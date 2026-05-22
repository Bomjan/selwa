function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cart-items');
  const emptyEl = document.getElementById('empty-cart');
  const cartMain = document.getElementById('cart-main');
  const itemCount = document.getElementById('item-count');

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  if (itemCount) itemCount.textContent = totalQty;

  if (cart.length === 0) {
    if (cartMain) cartMain.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (cartMain) cartMain.style.display = '';

  container.innerHTML = cart
    .map(
      (item, idx) => `
    <div class="cart-item cart-item-card" data-idx="${idx}">
      <div class="cart-item__img">
        <img src="${item.image}" alt="${item.name}" />
      </div>
      <div class="cart-item__body">
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__qty">
          <button class="cart-qty-btn" onclick="changeItemQty(${idx}, -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="cart-qty-btn" onclick="changeItemQty(${idx}, 1)">+</button>
        </div>
      </div>
      <div class="cart-item__price">
        <div class="cart-item__price-val">Nu. ${(item.price * item.qty).toLocaleString()}</div>
        <button class="cart-item__remove" onclick="removeItem(${idx})">Remove</button>
      </div>
    </div>`
    )
    .join('');

  updateSummary();
}

function changeItemQty(idx, delta) {
  const cart = getCart();
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  saveCart(cart);
  renderCart();
}

function removeItem(idx) {
  const cart = getCart();
  cart.splice(idx, 1);
  saveCart(cart);
  renderCart();
}

function updateSummary() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('subtotal').textContent = 'Nu. ' + subtotal.toLocaleString();
  document.getElementById('summary-count').textContent = count;
  document.getElementById('total').textContent = 'Nu. ' + subtotal.toLocaleString();
}

function checkout() {
  if (getCart().length === 0) return;
  if (!getUser()) {
    window.location.href = 'login.html';
    return;
  }
  saveCart([]);
  renderCart();
  alert('Order placed! Thank you for supporting Bhutanese artisans.');
}

document.addEventListener('DOMContentLoaded', renderCart);
