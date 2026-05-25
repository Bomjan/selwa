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

  const original = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-check"></i>';
  setTimeout(() => (btn.innerHTML = original), 900);
}

// ── Mobile nav toggle: hamburger ↔ X icon ──

function initMobileNav() {
  // Support both id="nav-toggle" and class="nav-toggle" (older pages use inline onclick)
  const toggle = document.getElementById('nav-toggle') || document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.toggle('mobile-open');
    // Switch icon between bi-list and bi-x
    const icon = toggle.querySelector('i');
    if (icon) {
      icon.className = isOpen ? 'bi bi-x' : 'bi bi-list';
    }
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close when clicking a nav link
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'bi bi-list';
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close when clicking outside the nav
  document.addEventListener('click', (e) => {
    const nav = document.querySelector('.s-nav');
    if (nav && !nav.contains(e.target) && navLinks.classList.contains('mobile-open')) {
      navLinks.classList.remove('mobile-open');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'bi bi-list';
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) {
      navLinks.classList.remove('mobile-open');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'bi bi-list';
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderNavAuth();
  initMobileNav();
});
