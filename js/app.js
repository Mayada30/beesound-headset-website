/* BeeSound – one shared script: catalog, cart, product modal, filters, checkout.
   Prices, colours and specs live ONLY in PRODUCTS below (single source of truth). */
(() => {
  'use strict';

  /* ---------- catalog ---------- */
  const CURRENCY = 'BAM';
  const MAX_QTY = 20;
  const money = n => `${CURRENCY} ${n.toFixed(2)}`;

  const PRODUCTS = [
    { id: 'beats', name: 'Beats By Dre', price: 29.99, img: 'black-headset.png', views: 3, type: 'headphones', tags: ['best', 'gamers'],
      colors: ['2b2b2b', '6b6b6b', '1b2250'], specs: ['DRE', 'Studio', 'Black', 'Headphones', 'Wireless'] },
    { id: 'jbl', name: 'JBL Speaker', price: 39.99, img: 'jbl.png', views: 4, type: 'speakers', tags: ['best'],
      colors: ['c25a00', 'a81f1a', '6b6b6b', '2b2b2b'], specs: ['JBL', 'Flip 5', 'Black', 'Speaker', 'Bluetooth'] },
    { id: 'earphones1', name: 'Samsung Earphones 1', price: 19.99, img: 'earphones.png', views: 3, type: 'earphones', tags: ['best'],
      colors: ['d8d8d8', '2b2b2b'], specs: ['SAMSUNG', 'Earphones 1', 'Black', 'In Ear', 'Wired'] },
    { id: 'headset', name: 'Wireless Headset', price: 69.99, img: 'gaming-earphones.png', views: 3, type: 'headphones', tags: ['best', 'gamers'],
      colors: ['2b2b2b', '6b6b6b', '1b2250'], specs: ['SAMSUNG', 'Headset', 'Black', 'Headset', 'Wireless'] },
    { id: 'airpods', name: 'Apple Airpods', price: 29.99, img: 'apple-airbuds.png', views: 3, type: 'earphones', tags: ['new'],
      colors: ['d8d8d8', '2b2b2b'], specs: ['Apple', 'Airpods', 'White', 'In Ear', 'Bluetooth'] },
    { id: 'studio3', name: 'Beats By Dre Studio 3', price: 29.99, img: 'studio3.png', views: 4, type: 'headphones', tags: ['new', 'gamers'],
      colors: ['6b6b6b', '2b2b2b', 'c9ab8c'], specs: ['DRE', 'Studio 3', 'Black', 'Headphones', 'Wireless'] },
    { id: 'max', name: 'Apple Airpods Max', price: 29.99, img: 'apple-airbuds-max.png', views: 3, type: 'headphones', tags: ['new'],
      colors: ['d8d8d8', '6b6b6b'], specs: ['Apple', 'Airpods Max', 'White', 'Headphones', 'Bluetooth'] },
    { id: 'earphones2', name: 'Samsung Earphones', price: 29.99, img: 'earphones2.png', views: 3, type: 'earphones', tags: ['new'],
      colors: ['d8d8d8', '2b2b2b', '1b2250'], specs: ['SAMSUNG', 'Earphones 2', 'White', 'In Ear', 'Wired'] }
  ];
  const SPEC_LABELS = ['Brand', 'Model Name', 'Color', 'Form Factor', 'Connectivity Technology'];

  const SALE = [
    { id: 'sale-outdoor', name: 'Outdoor Speaker', price: 20, was: 30, img: 'speaker1.png', colors: ['2b2b2b', '1b2250', '6b6b6b'] },
    { id: 'sale-roll2', name: 'Ultimate Ears ROLL 2', price: 30, was: 60, img: 'speaker2.png', colors: ['c25a00', 'a81f1a', '6b6b6b'] },
    { id: 'sale-boom2', name: 'Ultimate Ears Boom 2', price: 48, was: 80, img: 'speaker3.png', colors: ['d8d8d8', '2b2b2b'] }
  ];

  const FILTERS = {
    all: 'Our Collection', new: 'New Arrivals', gamers: 'For Gamers',
    headphones: 'Headphones', earphones: 'Earphones', speakers: 'Speakers'
  };
  const matches = (f, p) => f === 'all' || p.tags.includes(f) || p.type === f;

  const byId = Object.fromEntries([...PRODUCTS, ...SALE].map(p => [p.id, p]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const digits = s => String(s).replace(/\D/g, '');
  const params = new URLSearchParams(location.search);

  /* ---------- cart (localStorage with in-memory fallback) ---------- */
  const KEY = 'beesound-cart';
  let memory = null;

  function sanitize(obj) {
    const out = {};
    Object.entries(obj || {}).forEach(([id, q]) => {
      const n = Math.floor(Number(q));
      if (byId[id] && n >= 1) out[id] = Math.min(n, MAX_QTY);
    });
    return out;
  }
  function loadCart() {
    if (memory) return memory;
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) return sanitize(raw);
      const legacy = JSON.parse(localStorage.getItem('cart') || 'null');   // old format: ['beats','jbl']
      if (Array.isArray(legacy)) return sanitize(Object.fromEntries(legacy.map(id => [id, 1])));
    } catch (e) { /* storage blocked or corrupted: start empty */ }
    return {};
  }
  let cart = loadCart();
  function saveCart() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); memory = null; }
    catch (e) { memory = cart; }
    renderBadge();
  }
  const qtyOf = id => cart[id] || 0;
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = () => Object.entries(cart).reduce((s, [id, q]) => s + byId[id].price * q, 0);
  function addToCart(id) { cart[id] = Math.min(qtyOf(id) + 1, MAX_QTY); saveCart(); }
  function setQty(id, q) { if (q < 1) delete cart[id]; else cart[id] = Math.min(q, MAX_QTY); saveCart(); }
  function clearCart() { cart = {}; saveCart(); }

  function renderBadge() {
    const n = cartCount();
    $$('[data-cart-count]').forEach(el => { el.textContent = n || ''; });
    $$('[data-cart-label]').forEach(el => { el.textContent = `Cart, ${n} ${n === 1 ? 'item' : 'items'}`; });
  }

  /* ---------- small UI helpers ---------- */
  const dotsHtml = (colors, large) =>
    `<div class="dots${large ? ' dots-lg' : ''}" aria-hidden="true">${colors.map(c => `<span style="background:#${c}"></span>`).join('')}</div>`;

  function toast(message, withCartLink) {
    let box = $('.toast-container');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.append(box);
    }
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-dark border-0';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${message}${withCartLink ? ' <a class="link-light fw-medium ms-2" href="cart.html">View cart</a>' : ''}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
    box.append(el);
    el.addEventListener('hidden.bs.toast', () => el.remove());
    new bootstrap.Toast(el, { delay: 3500 }).show();
  }

  const productCard = p => `
    <div class="col">
      <a class="product-card d-block text-reset text-decoration-none" href="#${p.id}" data-product="${p.id}">
        <div class="thumb"><img src="./imgs/${p.img}" alt="" loading="lazy"></div>
        <h3 class="h5 fw-normal mt-3 mb-2">${p.name}</h3>
        ${dotsHtml(p.colors)}
        <p class="fs-5 mb-0">${money(p.price)}</p>
      </a>
    </div>`;

  const saleCard = p => {
    const off = Math.round((1 - p.price / p.was) * 100);
    return `
    <div class="col">
      <article class="h-100 d-flex flex-column">
        <div class="thumb"><span class="sale-badge" aria-label="${off}% off">-${off}%</span><img src="./imgs/${p.img}" alt="${p.name}" loading="lazy"></div>
        <h3 class="h5 fw-normal mt-3 mb-2">${p.name}</h3>
        ${dotsHtml(p.colors)}
        <del class="d-block text-white-50"><span class="visually-hidden">Was </span>${money(p.was)}</del>
        <p class="fs-5 mb-3"><span class="visually-hidden">Now </span>${money(p.price)}</p>
        <button type="button" class="btn btn-primary mt-auto" data-add="${p.id}">Add To Cart</button>
      </article>
    </div>`;
  };

  /* ---------- navigation state + header search ---------- */
  function setActiveNav(filter) {
    const page = location.pathname.split('/').pop() || 'index.html';
    $$('[data-nav]').forEach(a => {
      const key = a.dataset.nav;
      const on = page === 'products.html' && (key === filter || (key === 'all' && !['new', 'gamers'].includes(filter)));
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  const searchInput = $('[data-search]');
  if (searchInput && params.get('q')) searchInput.value = params.get('q');

  /* ---------- product grids on index ---------- */
  $$('[data-grid]').forEach(grid => {
    const kind = grid.dataset.grid;
    grid.innerHTML = kind === 'sale'
      ? SALE.map(saleCard).join('')
      : PRODUCTS.filter(p => p.tags.includes(kind)).map(productCard).join('');
  });

  /* ---------- black friday countdown ---------- */
  function nextBlackFriday(now = new Date()) {
    for (let y = now.getFullYear(); ; y++) {
      const firstThu = (4 - new Date(y, 10, 1).getDay() + 7) % 7 + 1;   // day-of-month of Nov's first Thursday
      const friday = new Date(y, 10, firstThu + 21 + 1);                 // day after the 4th Thursday
      if (friday > now) return friday;
    }
  }
  const timer = $('[data-countdown]');
  if (timer) {
    const target = nextBlackFriday();
    const tick = () => {
      let s = Math.max(0, Math.floor((target - new Date()) / 1000));
      const parts = { days: Math.floor(s / 86400), hours: Math.floor(s % 86400 / 3600), minutes: Math.floor(s % 3600 / 60), seconds: s % 60 };
      Object.entries(parts).forEach(([k, v]) => { const el = $(`[data-unit="${k}"]`, timer); if (el) el.textContent = String(v).padStart(2, '0'); });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- product modal (one shared modal for every page) ---------- */
  let modalEl, modal, currentId = null;

  function ensureModal() {
    if (modalEl) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="productModal" tabindex="-1" aria-labelledby="pmTitle" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable modal-fullscreen-lg-down">
          <div class="modal-content">
            <div class="modal-header border-0 pb-0">
              <h2 class="modal-title fw-normal fs-3" id="pmTitle"></h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="pmBody"></div>
          </div>
        </div>
      </div>`);
    modalEl = $('#productModal');
    modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalEl.addEventListener('hidden.bs.modal', () => {
      currentId = null;
      history.replaceState(null, '', location.pathname + location.search);
    });
    modalEl.addEventListener('click', e => {
      const thumb = e.target.closest('[data-view]');
      if (thumb) {
        const p = byId[currentId];
        const i = Number(thumb.dataset.view);
        $('#pmMain').src = i === 0 ? `./imgs/${p.img}` : `./imgs/${p.id}-${i}.png`;
        $('#pmMain').alt = `${p.name}, view ${i + 1}`;
        $$('[data-view]', modalEl).forEach(b => b.setAttribute('aria-pressed', String(b === thumb)));
        return;
      }
      const add = e.target.closest('[data-add]');
      if (add) { addToCart(add.dataset.add); updateModalCartNote(); toast(`${byId[add.dataset.add].name} added to your cart.`, true); return; }
      const rel = e.target.closest('[data-product]');
      if (rel) { e.preventDefault(); openProduct(rel.dataset.product); }
    });
  }

  function updateModalCartNote() {
    const note = $('#pmCartNote');
    if (!note || !currentId) return;
    const n = qtyOf(currentId);
    note.innerHTML = n ? `${n} in your cart · <a href="cart.html">View cart</a>` : '';
  }

  function openProduct(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    ensureModal();
    currentId = id;
    const views = [`./imgs/${p.img}`, ...Array.from({ length: p.views }, (_, i) => `./imgs/${p.id}-${i + 1}.png`)];
    const idx = PRODUCTS.indexOf(p);
    const related = [1, 2, 3, 4].map(k => PRODUCTS[(idx + k) % PRODUCTS.length]);
    $('#pmTitle').textContent = p.name;
    $('#pmBody').innerHTML = `
      <div class="row g-4">
        <div class="col-lg-7">
          <div class="pm-main"><img id="pmMain" src="${views[0]}" alt="${p.name}, view 1"></div>
          <div class="d-flex flex-wrap gap-2 mt-3">
            ${views.map((src, i) => `<button type="button" class="pm-thumb" data-view="${i}" aria-pressed="${i === 0}" aria-label="Show view ${i + 1}"><img src="${src}" alt=""></button>`).join('')}
          </div>
        </div>
        <div class="col-lg-5">
          ${dotsHtml(p.colors, true)}
          <p class="fs-2 my-3">${money(p.price)}</p>
          <dl class="pm-specs mb-4">
            ${SPEC_LABELS.map((l, i) => `<dt>${l}</dt><dd>${p.specs[i]}</dd>`).join('')}
          </dl>
          <button type="button" class="btn btn-primary btn-lg w-100" style="max-width:280px" data-add="${p.id}">Add To Cart</button>
          <p class="small text-secondary mt-2 mb-0" id="pmCartNote" aria-live="polite"></p>
        </div>
      </div>
      <h3 class="h4 fw-normal mt-5 mb-3">Related Products</h3>
      <div class="row row-cols-2 row-cols-md-4 g-3 mini">${related.map(productCard).join('')}</div>`;
    updateModalCartNote();
    history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
    modal.show();
    if (modalEl.querySelector('.modal-body')) modalEl.querySelector('.modal-body').scrollTop = 0;
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-product]');
    if (link && !(modalEl && modalEl.contains(link))) { e.preventDefault(); openProduct(link.dataset.product); }
    const add = e.target.closest('[data-add]');
    if (add && !(modalEl && modalEl.contains(add))) {
      addToCart(add.dataset.add);
      toast(`${byId[add.dataset.add].name} added to your cart.`, true);
    }
  });
  const openFromHash = () => { const id = location.hash.slice(1); if (id && PRODUCTS.some(p => p.id === id)) openProduct(id); };
  window.addEventListener('hashchange', openFromHash);

  /* ---------- products page: filter + sort ---------- */
  const grid = $('#productGrid');
  if (grid) {
    const sortEl = $('#sort');
    let filter = FILTERS[params.get('c')] ? params.get('c') : 'all';
    const q = (params.get('q') || '').trim().toLowerCase();

    const render = () => {
      let list = PRODUCTS.filter(p => matches(filter, p) && (!q || `${p.name} ${p.specs.join(' ')}`.toLowerCase().includes(q)));
      if (sortEl.value === 'low') list.sort((a, b) => a.price - b.price);
      if (sortEl.value === 'high') list.sort((a, b) => b.price - a.price);
      grid.innerHTML = list.map(productCard).join('');
      $('#pageTitle').textContent = FILTERS[filter];
      document.title = `BeeSound - ${FILTERS[filter]}`;
      const count = $('#resultCount');
      count.textContent = '';
      count.append(`${list.length} ${list.length === 1 ? 'product' : 'products'}`);
      if (q) { count.append(' for “'); count.append(document.createTextNode(q)); count.append('”. '); const a = document.createElement('a'); a.href = 'products.html'; a.textContent = 'Clear search'; count.append(a); }
      if (!list.length) grid.innerHTML = '<div class="col-12"><p class="text-secondary py-5 mb-0">No products match. Try another category or search term.</p></div>';
      $$('#filters [data-filter]').forEach(a => {
        const on = a.dataset.filter === filter;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      setActiveNav(filter);
    };
    $('#filters').addEventListener('click', e => {
      const a = e.target.closest('[data-filter]');
      if (!a) return;
      e.preventDefault();
      filter = a.dataset.filter;
      const url = new URL(location.href);
      url.hash = '';
      if (filter === 'all') url.searchParams.delete('c'); else url.searchParams.set('c', filter);
      history.replaceState(null, '', url);
      render();
    });
    sortEl.addEventListener('change', render);
    render();
  } else {
    setActiveNav('all');
  }

  /* ---------- cart page ---------- */
  const cartBox = $('#cartItems');
  const lineHtml = id => {
    const p = byId[id], n = qtyOf(id);
    const link = PRODUCTS.some(x => x.id === id) ? `<a class="text-reset text-decoration-none" href="products.html#${id}">${p.name}</a>` : p.name;
    return `
      <article class="d-flex flex-column flex-sm-row gap-3 gap-sm-4 py-4 border-bottom" aria-label="${p.name}">
        <div class="cart-pic"><img src="./imgs/${p.img}" alt="${p.name}"></div>
        <div class="flex-grow-1">
          <h2 class="h4 fw-normal mb-2">${link}</h2>
          ${dotsHtml(p.colors, true)}
          <p class="fs-3 mt-3 mb-1">${money(p.price)}</p>
          <p class="small text-secondary">Delivery Time: <strong class="fw-medium text-body">2 work days</strong></p>
          <div class="d-flex align-items-center flex-wrap gap-3 mt-3">
            <div class="input-group input-group-sm qty" role="group" aria-label="Quantity for ${p.name}">
              <button type="button" class="btn btn-outline-secondary" data-act="dec" data-id="${id}" aria-label="Decrease quantity">−</button>
              <input type="text" inputmode="numeric" class="form-control text-center" value="${n}" data-qty="${id}" aria-label="Quantity">
              <button type="button" class="btn btn-outline-secondary" data-act="inc" data-id="${id}" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="btn btn-link link-secondary p-0" data-act="remove" data-id="${id}">Remove</button>
            <span class="ms-auto fw-medium">${money(p.price * n)}</span>
          </div>
        </div>
      </article>`;
  };
  function renderCart(focusSel) {
    const ids = Object.keys(cart);
    const summary = $('#cartSummary');
    if (!ids.length) {
      cartBox.innerHTML = '<div class="py-5"><p class="text-secondary">Your cart is empty.</p><a class="btn btn-primary" href="products.html">Browse Products</a></div>';
      summary.innerHTML = '';
      return;
    }
    cartBox.innerHTML = ids.map(lineHtml).join('');
    summary.innerHTML = `
      <div class="card summary border-0 bg-soft"><div class="card-body p-4">
        <h2 class="h5 fw-medium mb-3">Order Summary</h2>
        <div class="d-flex justify-content-between mb-1"><span>Items</span><span>${cartCount()}</span></div>
        <div class="d-flex justify-content-between fs-4 my-3"><span>Total</span><strong class="fw-medium">${money(cartTotal())}</strong></div>
        <a href="checkout.html" class="btn btn-primary btn-lg w-100">Checkout</a>
      </div></div>`;
    if (focusSel) { const el = $(focusSel); if (el) el.focus(); }
  }
  if (cartBox) {
    renderCart();
    cartBox.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const id = b.dataset.id, act = b.dataset.act;
      if (act === 'inc') setQty(id, qtyOf(id) + 1);
      if (act === 'dec') setQty(id, qtyOf(id) - 1);
      if (act === 'remove') setQty(id, 0);
      renderCart(act === 'remove' ? null : `[data-act="${act}"][data-id="${id}"]`);
    });
    cartBox.addEventListener('change', e => {
      const input = e.target.closest('[data-qty]');
      if (!input) return;
      const n = parseInt(input.value, 10);
      setQty(input.dataset.qty, Number.isFinite(n) ? n : qtyOf(input.dataset.qty));
      renderCart();
    });
  }

  /* ---------- checkout page ---------- */
  const luhn = num => {
    let sum = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = +num[i];
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return sum % 10 === 0;
  };
  const rules = {
    name: v => v.trim().length >= 2 ? '' : 'Enter your full name.',
    address: v => v.trim().length >= 5 ? '' : 'Enter your shipping address (street, number, city).',
    phone: v => /^\+?[0-9 ()-]+$/.test(v.trim()) && digits(v).length >= 7 && digits(v).length <= 15 ? '' : 'Enter a valid phone number, for example +387 61 123 456.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    card: v => { const d = digits(v); return d.length >= 13 && d.length <= 19 && luhn(d) ? '' : 'Enter a valid card number (13 to 19 digits).'; },
    exp: v => {
      const m = /^(\d{2})\/(\d{2})$/.exec(v.trim());
      if (!m || +m[1] < 1 || +m[1] > 12) return 'Use the format MM/YY, for example 08/28.';
      const now = new Date(), year = 2000 + +m[2];
      return year * 12 + +m[1] >= now.getFullYear() * 12 + now.getMonth() + 1 ? '' : 'This card has expired.';
    },
    cvc: v => /^\d{3,4}$/.test(v.trim()) ? '' : 'Enter the 3 or 4 digit security code.'
  };
  function paint(input) {
    const msg = rules[input.name](input.value);
    input.setCustomValidity(msg);
    const fb = input.closest('.form-floating').querySelector('.invalid-feedback');
    if (fb) fb.textContent = msg;
    input.classList.toggle('is-invalid', !!msg);
    input.classList.toggle('is-valid', !msg);
    return !msg;
  }

  const form = $('#orderForm');
  if (form) {
    const shell = $('#checkoutShell');
    const empty = $('#checkoutEmpty');
    const items = Object.keys(cart);
    if (!items.length) { shell.hidden = true; empty.hidden = false; }
    else {
      $('#orderLines').innerHTML = items.map(id => `
        <li class="d-flex justify-content-between gap-3 py-2">
          <span>${byId[id].name} <span class="text-secondary">× ${qtyOf(id)}</span></span>
          <span>${money(byId[id].price * qtyOf(id))}</span>
        </li>`).join('');
      $('#orderTotal').textContent = money(cartTotal());
    }

    form.card.addEventListener('input', () => { form.card.value = digits(form.card.value).slice(0, 19).replace(/(.{4})(?=.)/g, '$1 '); });
    form.exp.addEventListener('input', () => {
      let d = digits(form.exp.value).slice(0, 4);
      if (d.length === 1 && +d > 1) d = '0' + d;
      form.exp.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    });
    form.cvc.addEventListener('input', () => { form.cvc.value = digits(form.cvc.value).slice(0, 4); });

    const fields = [...form.elements].filter(el => rules[el.name]);
    fields.forEach(el => {
      el.addEventListener('blur', () => { if (el.value) paint(el); });
      el.addEventListener('input', () => { if (el.classList.contains('is-invalid') || el.classList.contains('is-valid')) paint(el); });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();                                   
      const bad = fields.filter(el => !paint(el));
      if (bad.length) { bad[0].focus(); return; }
      const order = 'BS-' + String(Math.floor(100000 + Math.random() * 900000));
      const total = money(cartTotal());
      clearCart();
      shell.hidden = true;
      const done = $('#checkoutDone');
      $('#orderNumber').textContent = order;
      $('#orderPaid').textContent = total;
      done.hidden = false;
      done.focus();
    });
  }

  $$('[data-subscribe]').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      const input = $('input', f), msg = $('[data-subscribe-msg]', f);
      const ok = rules.email(input.value) === '';
      input.classList.toggle('is-invalid', !ok);
      msg.className = 'form-text ' + (ok ? 'text-success' : 'text-danger');
      msg.textContent = ok ? 'Thanks, you are subscribed.' : 'Enter a valid email address.';
      if (ok) f.reset(); else input.focus();
    });
  });

  renderBadge();
  window.addEventListener('storage', ev => {                // keep tabs in sync
    if (ev.key !== KEY) return;
    cart = loadCart(); renderBadge();
    if (cartBox) renderCart();
  });
  openFromHash();
})();
