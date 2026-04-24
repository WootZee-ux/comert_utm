(function () {
  const CART_KEY = 'audiohub-cart';
  const ACCOUNT_KEY = 'audiohub-account';
  const ORDERS_KEY = 'audiohub-orders';

  const parsePrice = (value) => Number(value) || 0;

  const safeRead = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : fallback;
      return parsed ?? fallback;
    } catch (error) {
      return fallback;
    }
  };

  const readCart = () => {
    const cart = safeRead(CART_KEY, []);
    return Array.isArray(cart) ? cart : [];
  };

  const saveCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  };

  const readAccount = () => {
    const account = safeRead(ACCOUNT_KEY, null);
    if (account && typeof account === 'object') {
      return account;
    }

    return {
      name: 'Daniel Ionescu',
      email: 'daniel.ionescu@email.com',
      phone: '0770 564 417',
      city: 'Chișinău',
      address: 'Str. Mihai Viteazul 14, ap. 16',
      password: 'audiohub123',
      points: 0,
    };
  };

  const saveAccount = (account) => {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  };

  const readOrders = () => {
    const orders = safeRead(ORDERS_KEY, []);
    return Array.isArray(orders) ? orders : [];
  };

  const saveOrders = (orders) => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
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

  const formatOrderDate = (isoDate) => {
    try {
      return new Intl.DateTimeFormat('ro-RO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(isoDate));
    } catch (error) {
      return isoDate;
    }
  };

  const buildOrderId = () => `AH-${Date.now().toString().slice(-7)}`;

  const finalizeOrder = (cart) => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const orders = readOrders();
    orders.unshift({
      id: buildOrderId(),
      createdAt: new Date().toISOString(),
      status: 'Confirmată',
      total,
      items: cart,
    });
    saveOrders(orders);

    const account = readAccount();
    account.points = Number(account.points || 0) + Math.floor(total / 10);
    saveAccount(account);

    return total;
  };

  const setupAccountPage = () => {
    const greetingNode = document.querySelector('.js-account-greeting');
    const ordersKpiNode = document.querySelector('.js-kpi-orders');
    const pointsKpiNode = document.querySelector('.js-kpi-points');
    const spentKpiNode = document.querySelector('.js-kpi-spent');
    const accountForm = document.querySelector('.js-account-form');
    const accountStatus = document.querySelector('.js-account-status');
    const passwordForm = document.querySelector('.js-password-form');
    const passwordStatus = document.querySelector('.js-password-status');
    const orderList = document.querySelector('.js-order-list');

    if (!greetingNode || !accountForm || !passwordForm || !orderList) return;

    const refreshAccountView = () => {
      const account = readAccount();
      const orders = readOrders();
      const totalSpent = orders.reduce((acc, order) => acc + Number(order.total || 0), 0);
      const firstName = (account.name || '').trim().split(' ')[0] || 'prietene';

      greetingNode.textContent = `Bine ai revenit, ${firstName} 👋`;
      accountForm.elements.name.value = account.name || '';
      accountForm.elements.email.value = account.email || '';
      accountForm.elements.phone.value = account.phone || '';
      accountForm.elements.city.value = account.city || '';
      accountForm.elements.address.value = account.address || '';

      ordersKpiNode.textContent = String(orders.length);
      pointsKpiNode.textContent = Number(account.points || 0).toLocaleString('ro-RO');
      spentKpiNode.textContent = formatPrice(totalSpent);

      if (orders.length === 0) {
        orderList.innerHTML = '<li class="order-empty">Nu ai comenzi încă. Mergi în <a href="produse.html">Produse</a> și finalizează o comandă pentru a vedea istoricul aici.</li>';
      } else {
        orderList.innerHTML = orders
          .map((order) => {
            const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
            const firstItems = order.items
              .slice(0, 2)
              .map((item) => `${item.name} × ${item.quantity}`)
              .join(', ');

            return `<li class="order-item"><div><p class="order-id">Comandă ${order.id}</p><p class="order-meta">${formatOrderDate(order.createdAt)} • ${itemCount} produse • ${order.status}</p><p class="order-products">${firstItems}${order.items.length > 2 ? '…' : ''}</p></div><strong>${formatPrice(order.total)}</strong></li>`;
          })
          .join('');
      }
    };

    accountForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(accountForm);
      const values = Object.fromEntries(formData.entries());

      if (Object.values(values).some((value) => String(value).trim().length === 0)) {
        accountStatus.textContent = 'Completează toate câmpurile pentru a salva profilul.';
        accountStatus.dataset.state = 'error';
        return;
      }

      const account = readAccount();
      saveAccount({
        ...account,
        ...values,
      });

      accountStatus.textContent = 'Profilul a fost actualizat cu succes.';
      accountStatus.dataset.state = 'success';
      refreshAccountView();
    });

    passwordForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const currentPassword = passwordForm.elements.currentPassword.value;
      const newPassword = passwordForm.elements.newPassword.value;
      const confirmPassword = passwordForm.elements.confirmPassword.value;
      const account = readAccount();

      if (currentPassword !== account.password) {
        passwordStatus.textContent = 'Parola curentă este incorectă.';
        passwordStatus.dataset.state = 'error';
        return;
      }

      if (newPassword.length < 6) {
        passwordStatus.textContent = 'Parola nouă trebuie să aibă minim 6 caractere.';
        passwordStatus.dataset.state = 'error';
        return;
      }

      if (newPassword !== confirmPassword) {
        passwordStatus.textContent = 'Parolele noi nu coincid.';
        passwordStatus.dataset.state = 'error';
        return;
      }

      saveAccount({
        ...account,
        password: newPassword,
      });

      passwordStatus.textContent = 'Parola a fost schimbată cu succes.';
      passwordStatus.dataset.state = 'success';
      passwordForm.reset();
    });

    refreshAccountView();
  };

  document.querySelectorAll('.js-add-to-cart').forEach((button) => {
    button.addEventListener('click', () => addToCart(button));
  });

  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      const cart = readCart();
      if (cart.length === 0) return;

      const total = finalizeOrder(cart);
      if (paymentStatusNode) {
        paymentStatusNode.textContent = `Plată simulată cu succes pentru ${formatPrice(total)}. Comanda a fost salvată în Contul meu.`;
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
  setupAccountPage();
})();
