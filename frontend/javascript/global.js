// Cart is stored in localStorage as an array of {name, price, image, qty}

function getCart() {
  return JSON.parse(localStorage.getItem('selwa_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('selwa_cart', JSON.stringify(cart));
  updateCartCount();
}

function getUser() {
  return JSON.parse(localStorage.getItem('selwa_user') || 'null');
}

function updateCartCount() {
  const total = getCart().reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cart-count').forEach(el => (el.textContent = total));
}

function renderNavAuth() {
  const el = document.getElementById('nav-auth-item');
  if (!el) return;
  const user = getUser();
  if (user) {
    el.innerHTML = `<a href="profile.html" class="nav-link">${user.name}</a>`;
  } else {
    el.innerHTML = `<a href="login.html" class="nav-link">Sign in</a>`;
  }
}

function addToCart(event) {
  event.preventDefault();
  event.stopPropagation();
  const btn = event.currentTarget;
  const card = btn.closest('.p-card');
  const name = card.querySelector('.p-card__name').textContent.trim();
  const priceText = card.querySelector('.p-card__price').textContent;
  const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
  const image = card.querySelector('img').getAttribute('src');

  const cart = getCart();
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, image, qty: 1 });
  }
  saveCart(cart);

  const original = btn.textContent;
  btn.textContent = '✓';
  setTimeout(() => (btn.textContent = original), 900);
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderNavAuth();
});
