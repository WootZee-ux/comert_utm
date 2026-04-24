(function () {
  const CART_KEY = 'audiohub-cart';

  const parsePrice = (value) => Number(value) || 0;

  const readCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const saveCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  };

  const formatPrice = (value) => `${value.toLocaleString('ro-RO')} lei`;

  const cartCountNode = document.querySelector('.js-cart-count');
  const cartListNode = document.querySelector('.js-cart-items');
  const cartTotalNode = document.querySelector('.js-cart-total');
  const paymentStatusNode = document.querySelector('.js-payment-status');
  const checkoutButton = document.querySelector('.js-checkout');
  const clearButton = document.querySelector('.js-clear-cart');

  const renderCart = () => {
    const cart = readCart();
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    if (cartCountNode) {
      cartCountNode.textContent = `Coș (${count})`;
    }

    if (cartListNode) {
      if (cart.length === 0) {
        cartListNode.innerHTML = '<li class="cart-empty">Coșul este gol momentan. Adaugă produse din pagina de produse pentru a continua.</li>';
      } else {
        cartListNode.innerHTML = cart
          .map((item) => {
            const lineTotal = item.price * item.quantity;

            return `<li class="cart-item"><div class="cart-item-main"><span class="cart-item-name">${item.name}</span><small class="cart-item-type">${item.type}</small></div><div class="cart-item-price"><span class="cart-item-qty">${item.quantity} x ${formatPrice(item.price)}</span><strong>${formatPrice(lineTotal)}</strong></div></li>`;
          })
          .join('');
      }
    }

    if (cartTotalNode) {
      cartTotalNode.textContent = formatPrice(total);
    }

    if (checkoutButton) {
      checkoutButton.disabled = cart.length === 0;
    }

    if (clearButton) {
      clearButton.disabled = cart.length === 0;
    }
  };

  const addToCart = (button) => {
    const name = button.dataset.name;
    const type = button.dataset.type;
    const price = parsePrice(button.dataset.price);

    if (!name || !type || !price) return;

    const cart = readCart();
    const existingItem = cart.find((item) => item.name === name && item.type === type);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        name,
        type,
        price,
        quantity: 1,
      });
    }

    saveCart(cart);
    renderCart();
  };

  const prettyName = (value) =>
    value
      .replaceAll('-', ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const applyFilters = () => {
    const cards = Array.from(document.querySelectorAll('.js-filter-card'));
    if (cards.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const category = (params.get('category') || '').trim().toLowerCase();
    const brand = (params.get('brand') || '').trim().toLowerCase();
    const titleNode = document.querySelector('.js-filter-title');
    const emptyNode = document.querySelector('.js-filter-empty');

    let visible = 0;

    cards.forEach((card) => {
      const categoryMatch = !category || card.dataset.category === category;
      const brandMatch = !brand || card.dataset.brand === brand;
      const isVisible = categoryMatch && brandMatch;

      card.hidden = !isVisible;
      if (isVisible) visible += 1;
    });

    if (titleNode) {
      if (category && brand) {
        titleNode.textContent = `Filtru activ: categoria "${prettyName(category)}" și brandul "${prettyName(brand)}".`;
      } else if (category) {
        titleNode.textContent = `Filtru activ: categoria "${prettyName(category)}".`;
      } else if (brand) {
        titleNode.textContent = `Filtru activ: brandul "${prettyName(brand)}".`;
      } else {
        titleNode.textContent = 'Alege o categorie sau un brand pentru listă filtrată.';
      }
    }

    if (emptyNode) {
      emptyNode.hidden = visible > 0;
    }
  };

  document.querySelectorAll('.js-add-to-cart').forEach((button) => {
    button.addEventListener('click', () => addToCart(button));
  });

  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      const cart = readCart();
      if (cart.length === 0) return;

      const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      if (paymentStatusNode) {
        paymentStatusNode.textContent = `Plată simulată cu succes pentru ${formatPrice(total)}. Îți mulțumim!`;
      }

      saveCart([]);
      renderCart();
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      saveCart([]);
      if (paymentStatusNode) {
        paymentStatusNode.textContent = 'Coșul a fost golit.';
      }
      renderCart();
    });
  }

  applyFilters();
  renderCart();
})();
