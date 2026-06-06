// --- Configuration ---
const PREMADE_PIES = [
  { id: 'pepperoni', name: 'Traditional Pepperoni', price: 13 },
  { id: 'cheese', name: 'All Cheese', price: 10 },
  { id: 'meat-cheese', name: '3-Meat & Cheese', price: 15 },
  { id: 'pesto-supreme', name: 'Pesto Drizzle Supreme', price: 16 },
  { id: 'veg-venge', name: 'Vegetable Vengeance', price: 14, vegan: true }
];

const BYOP_CONFIG = {
  sizes: [
    { id: 'sm', name: '10"', basePrice: 14 },
    { id: 'md', name: '12"', basePrice: 16 },
    { id: 'reg', name: '14"', basePrice: 18 },
    { id: 'lg', name: '16"', basePrice: 20 },
    { id: 'xl', name: '18"', basePrice: 22 }
  ],
  crusts: [
    { id: 'tossed', name: 'Hand-Tossed' },
    { id: 'thin', name: 'Thin' },
    { id: 'deep', name: 'Deep-Dish' }
  ],
  sauces: [
    { id: 'red', name: 'Traditional Red' },
    { id: 'white', name: 'White Sauce' },
    { id: 'pesto', name: 'Pesto' },
    { id: 'none', name: 'None' }
  ],
  cheeses: [
    { id: 'mozz', name: 'Mozzarella' },
    { id: 'feta', name: 'Feta' },
    { id: 'provolone', name: 'Provolone' },
    { id: 'cheddar', name: 'Cheddar' },
    { id: 'three', name: '3-Cheese Blend' },
    { id: 'no-cheese', name: 'None' }
  ],
  toppings: [
    { id: 'pep', name: 'Pepperoni', type: 'meat' },
    { id: 'sau', name: 'Sausage', type: 'meat' },
    { id: 'bac', name: 'Bacon', type: 'meat' },
    { id: 'tom', name: 'Tomato', type: 'veg' },
    { id: 'gp', name: 'Green Pepper', type: 'veg' },
    { id: 'bp', name: 'Banana Pepper', type: 'veg' },
    { id: 'onion', name: 'Onion', type: 'veg' },
    { id: 'mush', name: 'Mushroom', type: 'veg' }
  ],
  extras: {
    cheese: 1.50,
    meat: 3.00,
    veg: 2.00
  }
};

const STATUS_STAGES = [
  { text: 'Order Confirmed', gif: 'order-confirmed.gif', variant: 'bg-secondary' },
  { text: 'Being Prepared', gif: 'order-being-prepared.gif', variant: 'bg-warning text-dark' },
  { text: 'Prepared', gif: 'order-prepared.gif', variant: 'bg-info text-dark' },
  { text: 'On The Way', gif: 'order-on-the-way.gif', variant: 'bg-primary' },
  { text: 'Reached Destination', gif: 'order-reached-destination.gif', variant: 'bg-info' },
  { text: 'Handed Over', gif: 'order-handed-over.gif', variant: 'bg-success' },
  { text: 'Delivered', gif: 'order-delivered.gif', variant: 'bg-success' }
];

const STAGE_DELAYS = [2000, 10000, 5000, 3000, 8000, 4000];

// --- State ---
let state = {
  cart: [],
  orders: [],
  history: [],
  nextOrderId: 1000,
  ageVerified: false,
  autoTimers: {}
};

// --- Persistence ---
const saveState = () => {
  localStorage.setItem('pieTrackerState', JSON.stringify(state));
}

const loadState = () => {
  const raw = localStorage.getItem('pieTrackerState');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    } catch (e) {
      console.error('Failed to load state', e);
    }
  }
}

// --- Formatting ---
function fmtPrice(n) {
  return '$' + n.toFixed(2);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  document.getElementById('year').textContent = new Date().getFullYear();

  renderPremadeMenu();
  renderSides();
  renderWine();
  renderBYOPForm();
  updateBYOPPrice();
  renderCart();
  renderOrders();
  renderHistory();

  // Event Delegation
  document.getElementById('premade-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="add-premade"]');
    if (btn) addPremadeToCart(btn.dataset.id);
  });

  document.getElementById('sides-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="add-side"]');
    if (btn) addSideToCart(btn.dataset.id);
  });

  document.getElementById('wine-body').addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-action="add-wine"]');
    if (addBtn) addWineToCart(addBtn.dataset.id);

    const showVerifyBtn = e.target.closest('[data-action="show-verify"]');
    if (showVerifyBtn) showAgeVerifyForm();

    const lockBtn = e.target.closest('[data-action="lock-wine"]');
    if (lockBtn) {
      state.ageVerified = false;
      saveState();
      renderWine();
    }

    const confirmBtn = e.target.closest('[data-action="confirm-age"]');
    if (confirmBtn) {
      e.preventDefault();
      confirmAge();
    }
  });

  document.getElementById('cart-list').addEventListener('click', (e) => {
    const incBtn = e.target.closest('[data-action="inc-qty"]');
      if(incBn) updateCartQty(Number(incBtn.dataset.idx), 1);
    const decBtn = e.target.closest('[data-action="dec-qty"]');
      if(decBtn) updateCartQty(Number(decBtn.dataset.idx), -1)


    
  });

  document.getElementById('orders-container').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="advance"]');
    if (btn) advanceOrder(Number(btn.dataset.id));
    const btn2 = e.target.closest('[data-action="archive"]');
    if (btn2) completeOrder(Number(btn2.dataset.id));
    const cancelBtn = e.target.closest('[data-action="cancel"]');
    if (cancelBtn) cancelOrder(Number(cancelBtn.dataset.id));
    const autoBtn = e.target.closest('[data-action="auto-advance"]');
    if (autoBtn) autoAdvanceOrder(Number(autoBtn.dataset.id));
  });

  // Form Listeners
  document.getElementById('byop-form').addEventListener('change', updateBYOPPrice);
  document.getElementById('byop-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addBYOPToCart();
  });
  document.getElementById('clear-cart').addEventListener('click', clearCart);
  document.getElementById('place-order').addEventListener('click', placeOrder);
});

// --- Pre-made Menu ---
function renderPremadeMenu() {
  const container = document.getElementById('premade-list');
  container.innerHTML = PREMADE_PIES.map(pie => `
    <div class="list-group-item d-flex justify-content-between align-items-center py-3">
      <div class="d-flex align-items-center gap-2">
        <span class="fw-bold fs-5">${pie.name}</span>
        ${pie.vegan ? '<img src="./assets/images/vegan.svg" alt="Vegan" width="20" height="20">' : ''}
      </div>
      <div class="d-flex align-items-center gap-3">
        <span class="fw-bold text-primary fs-5">${fmtPrice(pie.price)}</span>
        <button class="btn btn-sm btn-outline-danger" data-action="add-premade" data-id="${pie.id}">Add</button>
      </div>
    </div>
  `).join('');
}

const addToCart = (item) => {
  const idx = state.cart.findIndex(c => c.name === item.name)
  if(idx > -1){
    state.cart[idx].qty += 1;
  } else{
    state.cart.push({ ...item, qty: 1});
  }
  saveState();
  renderCart();
}
const addPremadeToCart = (id) => {
  const preMadePie = PREMADE_PIES.find(p => p.id === id);
  if(preMadePie) addToCart({type: 'premade', name: preMadePie.name, price: preMadePie.price});
}

// --- BYOP Form ---
const renderBYOPForm = () => {
  const sizeSelect = document.getElementById('byop-size');
  sizeSelect.innerHTML = BYOP_CONFIG.sizes.map((s, i) =>
    `<option value="${s.id}" ${i === 2 ? 'selected' : ''}>${s.name} — ${fmtPrice(s.basePrice)}</option>`
  ).join('');

  const fillSelect = (elId, items) => {
    document.getElementById(elId).innerHTML = items.map((item, i) =>
      `<option value="${item.id}" ${i === 0 ? 'selected' : ''}>${item.name}</option>`
    ).join('');
  };

  fillSelect('byop-crust', BYOP_CONFIG.crusts);
  fillSelect('byop-sauce', BYOP_CONFIG.sauces);

  // Cheeses as checkboxes
  document.getElementById('byop-cheeses').innerHTML = BYOP_CONFIG.cheeses.map(c => `
    <div class="col-6">
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="cheese-${c.id}" value="${c.id}">
        <label class="form-check-label" for="cheese-${c.id}">${c.name}</label>
      </div>
    </div>
  `).join('');

  // Group toppings by type
  const meats = BYOP_CONFIG.toppings.filter(t => t.type === 'meat');
  const veggies = BYOP_CONFIG.toppings.filter(t => t.type === 'veg');

  const renderGroup = (title, items) => `
    <div class="col-12">
      <div class="topping-group-header">${title}</div>
    </div>
    ${items.map(t => `
      <div class="col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="top-${t.id}" value="${t.id}">
          <label class="form-check-label" for="top-${t.id}">${t.name}</label>
        </div>
      </div>
    `).join('')}
  `;

  document.getElementById('byop-toppings').innerHTML = renderGroup('Meat Toppings', meats) + renderGroup('Vegetable Toppings', veggies);
}

const getBYOPPrice = () => {
  const sizeId = document.getElementById('byop-size').value;
  const size = BYOP_CONFIG.sizes.find(s => s.id === sizeId) || BYOP_CONFIG.sizes[0];

  const crustId = document.getElementById('byop-crust').value;
  const crust = BYOP_CONFIG.crusts.find(c => c.id === crustId) || BYOP_CONFIG.crusts[0];

  const sauceId = document.getElementById('byop-sauce').value;
  const sauce = BYOP_CONFIG.sauces.find(s => s.id === sauceId) || BYOP_CONFIG.sauces[0];

  const checkedCheeses = Array.from(document.querySelectorAll('#byop-cheeses input:checked'));
  const cheeses = checkedCheeses.map(cb => BYOP_CONFIG.cheeses.find(c => c.id === cb.value)).filter(Boolean);
  const cheeseExtra = Math.max(0, cheeses.length - 1) * BYOP_CONFIG.extras.cheese;

  const checkedToppings = Array.from(document.querySelectorAll('#byop-toppings input:checked'));
  const toppings = checkedToppings.map(cb => BYOP_CONFIG.toppings.find(t => t.id === cb.value)).filter(Boolean);

  let toppingsExtra = 0;
  for (let i = 1; i < toppings.length; i++) {
    const t = toppings[i];
    if (t.type === 'meat') toppingsExtra += BYOP_CONFIG.extras.meat;
    else toppingsExtra += BYOP_CONFIG.extras.veg;
  }

  const total = size.basePrice + cheeseExtra + toppingsExtra;

  return { total, size, crust, sauce, cheeses, toppings, cheeseExtra, toppingsExtra };
}

const updateBYOPPrice = () => {
  const { total, cheeseExtra, toppingsExtra } = getBYOPPrice();
  document.getElementById('byop-price').textContent = fmtPrice(total);

  // Cheese badges
  document.querySelectorAll('#byop-cheeses label .badge').forEach(el => el.remove());
  const checkedCheeses = Array.from(document.querySelectorAll('#byop-cheeses input:checked'));
  checkedCheeses.forEach((cb, idx) => {
    const c = BYOP_CONFIG.cheeses.find(ch => ch.id === cb.value);
    const label = document.querySelector(`label[for="${cb.id}"]`);
    if (!label || !c) return;
    const badge = document.createElement('span');
    badge.className = `badge ms-1 topping-badge-free ${idx === 0 ? 'bg-success' : 'bg-warning text-dark'}`;
    badge.textContent = idx === 0 ? 'Included' : `+${fmtPrice(BYOP_CONFIG.extras.cheese)}`;
    label.appendChild(badge);
  });

  // Topping badges
  document.querySelectorAll('#byop-toppings label .badge').forEach(el => el.remove());
  const checkedToppings = Array.from(document.querySelectorAll('#byop-toppings input:checked'));
  checkedToppings.forEach((cb, idx) => {
    const t = BYOP_CONFIG.toppings.find(top => top.id === cb.value);
    const label = document.querySelector(`label[for="${cb.id}"]`);
    if (!label || !t) return;
    let badgeText, badgeClass;
    if (idx === 0) {
      badgeText = 'Included';
      badgeClass = 'bg-success';
    } else if (t.type === 'meat') {
      badgeText = `+${fmtPrice(BYOP_CONFIG.extras.meat)}`;
      badgeClass = 'bg-warning text-dark';
    } else {
      badgeText = `+${fmtPrice(BYOP_CONFIG.extras.veg)}`;
      badgeClass = 'bg-info text-dark';
    }
    const badge = document.createElement('span');
    badge.className = `badge ms-1 topping-badge-free ${badgeClass}`;
    badge.textContent = badgeText;
    label.appendChild(badge);
  });
}

const addBYOPToCart = () => {
  const { total, size, crust, sauce, cheeses, toppings } = getBYOPPrice();
  const cheeseStr = cheeses.length ? cheeses.map(c => c.name).join('/') : 'No Cheese';
  const toppingStr = toppings.length ? toppings.map(t => t.name).join(', ') : 'No Toppings';
  const name = `BYOP ${size.name} — ${crust.name}, ${sauce.name}, ${cheeseStr} + ${toppingStr}`;
  addToCart({ type: 'byop', name, price: total, qty: 1 });
  saveState();
  renderCart();
  document.querySelectorAll('#byop-cheeses input, #byop-toppings input').forEach(cb => cb.checked = false);
  updateBYOPPrice();
}

// --- Cart ---
const renderCart = () => {
  const section = document.getElementById('cart-section');
  const list = document.getElementById('cart-list');
  const totalEl = document.getElementById('cart-total');
  const countEl = document.getElementById('cart-count');

  if (state.cart.length === 0) {
    section.classList.add('d-none');
    list.innerHTML = '';
    return;
  }

  section.classList.remove('d-none');
  const totalItems = state.cart.reduce((s, c)=> s + c.qty, 0);
  countEl.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;

 

  list.innerHTML = state.cart.map((item, idx) => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <div class="fw-bold">${item.name}</div>
        <small class="text-muted text-capitalize">${item.type}</small>
      </div>
      <div class="d-flex align-items-center gap-3">
        <span class="fw-bold">${fmtPrice(item.price * item.qty)}</span>
        <button class="btn btn-sm btn-outline-secondary" data-action="dec-qty" data-idx="${idx}">−</button>
        <span class="fw-bold">${item.qty}</span>
        <button class="btn btn-sm btn-outline-secondary" data-action:"inc-qty" data-idx="${idx}">+</button>
      </div>
    </li>
  `).join('');
  const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  totalEl.textContent = fmtPrice(total);
}

const updateCartQty = (idx, delta) => {
  const item = state.cart[idx];
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) state.cart.splice(idx, 1);
  saveState();
  renderCart();
}

  const removeCartItem = (idx) => {
  state.cart.splice(idx, 1);
  saveState();
  renderCart();
}

const clearCart = () => {
  state.cart = [];
  saveState();
  renderCart();
}

// --- Sides & Wine ---
const SIDES = [
  { id: 'bread', name: 'Breadsticks', price: 10 },
  { id: 'cheese-bread', name: 'Cheesesticks', price: 12 },
  { id: 'garlic-cheese', name: 'Garlic Cheesy Bread', price: 15 },
  { id: 'mozz-sticks', name: 'Mozzarella Sticks', price: 8 }
];

const WINES = [
  { id: 'cab', name: 'Cabernet Sauvignon', price: 32 },
  { id: 'pinot', name: 'Pinot Noir', price: 28 },
  { id: 'chard', name: 'Chardonnay', price: 26 },
  { id: 'rose', name: 'Rosé', price: 24 },
  { id: 'prosecco', name: 'Prosecco', price: 30 }
];

const renderSides = () => {
  const container = document.getElementById('sides-list');
  container.innerHTML = SIDES.map(side => `
    <div class="list-group-item d-flex justify-content-between align-items-center py-3">
      <span class="fw-bold fs-5">${side.name}</span>
      <div class="d-flex align-items-center gap-3">
        <span class="fw-bold text-primary fs-5">${fmtPrice(side.price)}</span>
        <button class="btn btn-sm btn-outline-warning" data-action="add-side" data-id="${side.id}">Add</button>
      </div>
    </div>
  `).join('');
}

const addSideToCart = (id) => {
  const side = SIDES.find(s => s.id === id);
  if (!side) return;
  addToCart({ type: 'side', name: side.name, price: side.price });
  saveState();
  renderCart();
}

const renderWine = () => {
  const container = document.getElementById('wine-body');
  if (!state.ageVerified) {
    container.innerHTML = `
      <div class="text-center py-4">
        <p class="text-muted mb-3">Our wine selection is available for guests 21 years of age or older.</p>
        <button class="btn btn-dark" data-action="show-verify">Verify Age (21+)</button>
      </div>
    `;
    return;
  }
  container.innerHTML = `
    <div class="list-group list-group-flush mb-3">
      ${WINES.map(wine => `
        <div class="list-group-item d-flex justify-content-between align-items-center py-3">
          <span class="fw-bold fs-5">${wine.name}</span>
          <div class="d-flex align-items-center gap-3">
            <span class="fw-bold text-primary fs-5">${fmtPrice(wine.price)}</span>
            <button class="btn btn-sm btn-outline-dark" data-action="add-wine" data-id="${wine.id}">Add</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="text-center">
      <button class="btn btn-sm btn-outline-secondary" data-action="lock-wine"><i class="bi bi-lock"></i> Lock Menu</button>
    </div>
  `;
}

const showAgeVerifyForm = () => {
  const container = document.getElementById('wine-body');
  container.innerHTML = `
    <form id="age-form" class="text-center py-3">
      <p class="text-muted mb-3">Please confirm your date of birth.</p>
      <div class="mb-3 d-flex justify-content-center gap-2">
        <select class="form-select w-auto" id="age-month" required>
          <option value="" disabled selected>MM</option>
          ${Array.from({length:12}, (_,i) => `<option value="${i+1}">${String(i+1).padStart(2,'0')}</option>`).join('')}
        </select>
        <select class="form-select w-auto" id="age-day" required>
          <option value="" disabled selected>DD</option>
          ${Array.from({length:31}, (_,i) => `<option value="${i+1}">${String(i+1).padStart(2,'0')}</option>`).join('')}
        </select>
        <select class="form-select w-auto" id="age-year" required>
          <option value="" disabled selected>YYYY</option>
          ${Array.from({length:100}, (_,i) => {
            const y = new Date().getFullYear() - 12 - i;
            return `<option value="${y}">${y}</option>`;
          }).join('')}
        </select>
      </div>
      <button type="button" class="btn btn-dark" data-action="confirm-age">Confirm Age</button>
      <p class="text-danger mt-2 d-none" id="age-error">You must be at least 21 years old to view our wine selection.</p>
    </form>
  `;
}

const confirmAge = () => {
  const month = Number(document.getElementById('age-month')?.value);
  const day = Number(document.getElementById('age-day')?.value);
  const year = Number(document.getElementById('age-year')?.value);
  const error = document.getElementById('age-error');

  if (!month || !day || !year) {
    if (error) error.classList.remove('d-none');
    return;
  }

  const birth = new Date(year, month - 1, day);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

  if (age >= 21) {
    state.ageVerified = true;
    saveState();
    renderWine();
  } else {
    if (error) error.classList.remove('d-none');
  }
}


const addWineToCart = (id) => {
  const wine = WINES.find(w => w.id === id);
  if (!wine) return;
  addToCart({ type: 'wine', name: wine.name, price: wine.price, qty: 1 });
  saveState();
  renderCart();
}

// --- Orders ---
const placeOrder = () => {
  if (state.cart.length === 0) return;

  const order = {
    id: state.nextOrderId++,
    items: [...state.cart],
    total: state.cart.reduce((sum, item) => sum + item.price, 0),
    statusIdx: 0,
    createdAt: new Date().toISOString()
  };

  state.orders.push(order);
  state.cart = [];
  saveState();
  renderCart();
  renderOrders();
}

const renderOrders = () => {
  const container = document.getElementById('orders-container');

  if (state.orders.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <p class="lead">No active orders. Build your pie above!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.orders.map(order => {
    const stage = STATUS_STAGES[order.statusIdx];
    const isDelivered = order.statusIdx >= STATUS_STAGES.length - 1;
    return `
      <div class="col-md-6 col-xl-4">
        <div class="card h-100 shadow-sm order-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Order #${order.id}</h5>
            <span class="badge ${stage.variant}">${stage.text}</span>
          </div>
          <div class="card-body text-center">
            <img src="./assets/images/${stage.gif}" alt="${stage.text}" class="img-fluid mb-3 rounded" style="max-height: 160px;">
            <ul class="list-group list-group-flush text-start small mb-0">
              ${order.items.map(item => `
                <li class="list-group-item d-flex justify-content-between px-0">
                  <span class="text-truncate me-2" title="${item.name}">${item.name}</span>
                  <span class="fw-bold text-nowrap">${fmtPrice(item.price)}</span>
                </li>
              `).join('')}
              <li class="list-group-item d-flex justify-content-between px-0 fw-bold border-top">
                <span>Total</span>
                <span class="text-nowrap">${fmtPrice(order.total)}</span>
              </li>
            </ul>
          </div>
           <div class="card-footer">
                ${isDelivered
                  ? `<button class="btn btn-outline-secondary w-100" data-action="archive" data-id="${order.id}">Archive Order</button>`
                  : `<div class="d-flex gap-2">
                      ${order.statusIdx === 0
                        ? `<button class="btn btn-primary flex-grow-1" data-action="auto-advance" data-id="${order.id}">▶ Demo Mode</button>`
                        : `<button class="btn btn-primary flex-grow-1" data-action="advance" data-id="${order.id}">Next Stage</button>`
                      }
                      <button class="btn btn-outline-danger" data-action="cancel" data-id="${order.id}">Cancel</button>
                    </div>`
                }
              </div>
            `;
  }).join('');

}

const advanceOrder = (id) => {
  const order = state.orders.find(o => o.id === id);
  if (!order) return;
  if (order.statusIdx < STATUS_STAGES.length - 1) {
    order.statusIdx++;
    saveState();
    renderOrders();
  }
}

const cancelOrder = (id) => {
  if(state.autoTimers[id]) clearTimeout(state.autoTimers[id]);
  delete state.autoTimers[id];
  state.orders = state.orders.filter(o => o.id !== id);
  saveState();
  renderOrders();
}

const autoAdvanceOrder = (id) => {
  let cumulative = 0;
  for (const delay of STAGE_DELAYS) {
    cumulative += delay;
    state.autoTimers[id] = setTimeout(() => {
      advanceOrder(id);
      delete state.autoTimers[id];
    }, cumulative);
  }
}

const completeOrder = (id) => {
  const idx = state.orders.findIndex(o => o.id === id);
  if (idx === -1) return;
  const order = state.orders.splice(idx, 1)[0];
  state.history.unshift(order);
  saveState();
  renderOrders();
  renderHistory();
}

// --- History ---
const renderHistory = () => {
  const list = document.getElementById('history-list');

  if (state.history.length === 0) {
    list.innerHTML = `
      <div class="text-center text-muted py-3">No completed orders yet.</div>
    `;
    return;
  }

  list.innerHTML = state.history.map(order => {
    const date = new Date(order.createdAt);
    return `
      <div class="list-group-item">
        <div class="d-flex w-100 justify-content-between align-items-start">
          <h5 class="mb-1">Order #${order.id}</h5>
          <small class="text-muted">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
        </div>
        <p class="mb-1">${order.items.length} item(s) — ${fmtPrice(order.total)}</p>
        <small class="text-success">Delivered</small>
      </div>
    `;
  }).join('');
}
