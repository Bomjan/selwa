// ── Wishlist ──────────────────────────────────────────────────────────────────

function getWishlist() {
  return JSON.parse(localStorage.getItem('selwa_wishlist') || '[]');
}

function saveWishlist(list) {
  localStorage.setItem('selwa_wishlist', JSON.stringify(list));
  updateWishlistCount();
}

function updateWishlistCount() {
  const total = getWishlist().length;
  document.querySelectorAll('.s-wishlist-count').forEach(el => {
    el.textContent = total;
    el.style.display = total === 0 ? 'none' : '';
  });
  const dockBadge = document.getElementById('dock-wishlist-badge');
  if (dockBadge) {
    dockBadge.textContent = total;
    dockBadge.style.display = total === 0 ? 'none' : '';
  }
}

function isWishlisted(name) {
  return getWishlist().some(item => item.name === name);
}

async function toggleWishlist(event) {
  event.preventDefault();
  event.stopPropagation();
  const btn = event.currentTarget;
  const card = btn.closest('.p-card');
  const name = card.querySelector('.p-card__name').textContent.trim();
  const priceText = card.querySelector('.p-card__price').textContent;
  const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
  const image = card.querySelector('img').getAttribute('src');

  const productId = card.dataset.productId ? parseInt(card.dataset.productId, 10) : null;
  const list = getWishlist();
  const idx = list.findIndex(item => item.name === name);
  const adding = idx < 0;

  if (adding) {
    list.push({ name, price, image, id: productId });
    btn.classList.add('wishlisted');
    btn.querySelector('i').className = 'bi bi-heart-fill';
    btn.setAttribute('aria-label', 'Remove from wishlist');
  } else {
    list.splice(idx, 1);
    btn.classList.remove('wishlisted');
    btn.querySelector('i').className = 'bi bi-heart';
    btn.setAttribute('aria-label', 'Add to wishlist');
  }
  saveWishlist(list);

  if (getUser() && productId) {
    try {
      if (adding) {
        await fetch('/api/wishlist', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId }),
        });
      } else {
        await fetch(`/api/wishlist/${productId}`, { method: 'DELETE', credentials: 'include' });
      }
    } catch (_) {}
  }
}

async function syncWishlistFromServer() {
  try {
    const res = await fetch('/api/wishlist', { credentials: 'include' });
    if (!res.ok) return;
    const items = await res.json();
    const list = items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image_url,
    }));
    saveWishlist(list);
  } catch (_) {}
}

async function syncWishlistToServer() {
  const list = getWishlist();
  for (const item of list) {
    if (!item.id) continue;
    try {
      await fetch('/api/wishlist', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: item.id }),
      });
    } catch (_) {}
  }
}

// ── Cart ──────────────────────────────────────────────────────────────────────

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
  document.querySelectorAll('#cart-count, #dock-cart-badge').forEach(el => {
    const prev = parseInt(el.textContent, 10) || 0;
    el.textContent = total;
    el.style.display = total === 0 ? 'none' : '';
    if (total !== prev && el.id === 'cart-count') {
      el.classList.remove('s-pop');
      void el.offsetWidth;
      el.classList.add('s-pop');
      el.addEventListener('animationend', () => el.classList.remove('s-pop'), { once: true });
    }
  });
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
  const productId = card.dataset.productId ? parseInt(card.dataset.productId, 10) : null;

  const cart = getCart();
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, image, qty: 1, id: productId });
  }
  saveCart(cart);

  const original = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-check"></i>';
  btn.style.background = 'var(--gold)';
  btn.style.color = '#fff';
  btn.style.borderColor = 'var(--gold)';
  setTimeout(() => {
    btn.innerHTML = original;
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
  }, 900);
}

// ── Nav auth ──────────────────────────────────────────────────────────────────

function renderNavAuth() {
  const el = document.getElementById('nav-auth-item');
  if (!el) return;
  const user = getUser();
  if (user) {
    el.innerHTML = `<a href="profile.html" class="nav-link">${user.name}</a>`;
  } else {
    el.innerHTML = `<a href="#" class="nav-link" id="auth-trigger">Sign in</a>`;
    const trigger = el.querySelector('#auth-trigger');
    if (trigger) {
      trigger.addEventListener('click', e => {
        e.preventDefault();
        openAuthModal('am-login');
      });
    }
  }
}

// ── Mobile dock ───────────────────────────────────────────────────────────────

function buildMobileDock() {
  if (document.body.classList.contains('auth-body')) return;
  if (document.getElementById('s-dock')) return;

  const path = window.location.pathname.replace(/.*\//, '') || 'index.html';
  const active = (page) => path === page || (page === 'index.html' && path === '') ? 'active' : '';
  const user = getUser();
  const accountHref = user ? 'profile.html' : '#';
  const accountLabel = user ? user.name.split(' ')[0] : 'Account';

  const dock = document.createElement('nav');
  dock.id = 's-dock';
  dock.setAttribute('aria-label', 'Mobile navigation');
  const wishlistCount = getWishlist().length;
  dock.innerHTML = `
    <a class="s-dock__item ${active('products.html')}" href="products.html">
      <i class="bi bi-grid-3x3-gap"></i><span>Products</span>
    </a>
    <a class="s-dock__item ${active('wishlist.html')}" href="wishlist.html" style="position:relative">
      <i class="bi bi-heart"></i>
      <span class="s-dock__badge s-wishlist-count" id="dock-wishlist-badge" style="display:${wishlistCount === 0 ? 'none' : ''}">${wishlistCount}</span>
      <span>Wishlist</span>
    </a>
    <a class="s-dock__item ${active('cart.html')}" href="cart.html" style="position:relative">
      <i class="bi bi-bag"></i>
      <span class="s-dock__badge" id="dock-cart-badge">0</span>
      <span>Cart</span>
    </a>
    <a class="s-dock__item ${active('profile.html')}" href="${accountHref}" id="dock-account-btn">
      <i class="bi bi-person"></i><span>${accountLabel}</span>
    </a>
  `;
  document.body.appendChild(dock);

  const accountBtn = dock.querySelector('#dock-account-btn');
  if (!user && accountBtn) {
    accountBtn.addEventListener('click', e => {
      e.preventDefault();
      openAuthModal('am-login');
    });
  }

  // Sync badge on load
  const badge = dock.querySelector('#dock-cart-badge');
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  if (badge) { badge.textContent = total; badge.style.display = total === 0 ? 'none' : ''; }
}

// ── Mobile nav ────────────────────────────────────────────────────────────────

function initMobileNav() {
  const toggle = document.getElementById('nav-toggle') || document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.toggle('mobile-open');
    const icon = toggle.querySelector('i');
    if (icon) icon.className = isOpen ? 'bi bi-x' : 'bi bi-list';
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'bi bi-list';
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    const nav = document.querySelector('.s-nav');
    if (nav && !nav.contains(e.target) && navLinks.classList.contains('mobile-open')) {
      navLinks.classList.remove('mobile-open');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'bi bi-list';
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) {
      navLinks.classList.remove('mobile-open');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'bi bi-list';
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Auth Overlay ──────────────────────────────────────────────────────────────

function buildAuthModal() {
  if (document.getElementById('auth-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Sign in or create account');

  modal.innerHTML = `
    <div class="am-brand">
      <div class="am-brand__logo">Selwa</div>
      <div class="am-brand__heading">Where every<br>craft tells<br>a story.</div>
      <div class="am-brand__rule"></div>
      <p class="am-brand__sub">Handmade in Bhutan. Every purchase goes directly to the artisan who made it.</p>
    </div>
    <div class="am-form-panel">
      <button class="am-close" aria-label="Close">&times;</button>
      <div class="am-inner">
        <div class="am-tabs">
          <button class="am-tab active" data-pane="am-login">Sign in</button>
          <button class="am-tab" data-pane="am-signup">Create account</button>
        </div>
        <div class="am-pane active" id="am-login">
          <div class="am-error" id="am-login-error" style="display:none"></div>
          <form id="am-login-form" novalidate>
            <label class="am-label" for="am-email">Email</label>
            <input type="email" id="am-email" class="am-input" placeholder="you@example.com" autocomplete="email" required />
            <label class="am-label" for="am-password">Password</label>
            <div class="am-field">
              <input type="password" id="am-password" class="am-input with-btn" placeholder="Your password" autocomplete="current-password" required />
              <button type="button" class="am-eye" data-target="am-password"><i class="bi bi-eye"></i></button>
            </div>
            <button type="submit" class="am-submit">Sign in</button>
          </form>
        </div>
        <div class="am-pane" id="am-signup">
          <div class="am-error" id="am-signup-error" style="display:none"></div>
          <form id="am-signup-form" novalidate>
            <label class="am-label" for="am-name">Full name</label>
            <input type="text" id="am-name" class="am-input" placeholder="Your name" autocomplete="name" required />
            <label class="am-label" for="am-signup-email">Email</label>
            <input type="email" id="am-signup-email" class="am-input" placeholder="you@example.com" autocomplete="email" required />
            <label class="am-label" for="am-signup-password">Password</label>
            <div class="am-field">
              <input type="password" id="am-signup-password" class="am-input with-btn" placeholder="Create a password" autocomplete="new-password" required />
              <button type="button" class="am-eye" data-target="am-signup-password"><i class="bi bi-eye"></i></button>
            </div>
            <button type="submit" class="am-submit">Create account</button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('.am-tab').forEach(tab => {
    tab.addEventListener('click', () => switchAuthPane(modal, tab.dataset.pane));
  });


  modal.querySelector('.am-close').addEventListener('click', closeAuthModal);
  modal.querySelector('.am-brand').addEventListener('click', closeAuthModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('s-open')) closeAuthModal();
  });

  modal.querySelectorAll('.am-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const icon = btn.querySelector('i');
      input.type = input.type === 'password' ? 'text' : 'password';
      icon.className = input.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
    });
  });

  document.getElementById('am-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    const errEl = document.getElementById('am-login-error');
    errEl.style.display = 'none';
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const res = await fetch('/api/login', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('am-email').value.trim(),
          password: document.getElementById('am-password').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('selwa_user', JSON.stringify(data.user));
      await syncWishlistToServer();
      await syncWishlistFromServer();
      updateWishlistCount();
      initWishlistButtons();
      closeAuthModal();
      renderNavAuth();
      if (data.user.is_admin) window.location.href = 'admin.html';
    } catch (err) {
      errEl.textContent = err.message; errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  });

  document.getElementById('am-signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    const errEl = document.getElementById('am-signup-error');
    errEl.style.display = 'none';
    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
      const res = await fetch('/api/signup', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('am-name').value.trim(),
          email: document.getElementById('am-signup-email').value.trim(),
          password: document.getElementById('am-signup-password').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      localStorage.setItem('selwa_user', JSON.stringify(data.user));
      await syncWishlistToServer();
      await syncWishlistFromServer();
      updateWishlistCount();
      initWishlistButtons();
      closeAuthModal();
      renderNavAuth();
    } catch (err) {
      errEl.textContent = err.message; errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Create account';
    }
  });
}

function switchAuthPane(modal, paneId) {
  modal.querySelectorAll('.am-tab').forEach(t => t.classList.toggle('active', t.dataset.pane === paneId));
  modal.querySelectorAll('.am-pane').forEach(p => p.classList.toggle('active', p.id === paneId));
}

function openAuthModal(tab) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  if (tab) switchAuthPane(modal, tab);
  modal.classList.add('s-open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const first = modal.querySelector('.am-pane.active input');
    if (first) first.focus();
  }, 820);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal || modal.classList.contains('s-closing')) return;

  // Phase 1 — panels fade out (180ms)
  modal.classList.add('s-closing');

  // Phase 2 — stamp collapses (clip-path reverses, 520ms)
  setTimeout(() => {
    modal.classList.remove('s-open');
  }, 180);

  // Phase 3 — cleanup after stamp fully closed
  setTimeout(() => {
    modal.classList.remove('s-closing');
    document.body.style.overflow = '';
  }, 720);
}

// ── Scroll reveal (IntersectionObserver) ──────────────────────────────────────

function initScrollReveal() {
  const selectors = [
    '.p-card', '.a-card', '.artisan-card',
    '.cat-pill', '.value-card', '.team-card', '.faq-item',
    '.s-hd-row', '.s-eyebrow:not(.s-hero .s-eyebrow)',
    '.about-mission__grid', '.p-grid', '.artisans-grid',
    '.cta-section', '.join-cta', '.s-footer__col',
    '.artisans-bar', '.artisans-hero',
  ];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('s-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -50px 0px' });

  // Mark and stagger elements
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.closest('.s-hero') || el.closest('#auth-modal')) return;
      el.classList.add('s-reveal');
      observer.observe(el);
    });
  });

  // Apply stagger delays to grid children
  document.querySelectorAll('.p-grid, .cat-pills, .artisans-grid, .about-impact__grid, .value-cards').forEach(grid => {
    const items = grid.querySelectorAll(':scope > *');
    items.forEach((child, i) => {
      if (child.classList.contains('s-reveal')) {
        child.style.transitionDelay = `${i * 90}ms`;
      }
    });
  });

  // Section headings — scramble on reveal
  const h2Observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        scrambleText(entry.target);
        h2Observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('h2:not(.s-hero h2):not(.am-brand h2)').forEach(h => {
    if (h.textContent.trim().length > 2) h2Observer.observe(h);
  });
}

// ── Text scramble ─────────────────────────────────────────────────────────────

function scrambleText(el) {
  const original = el.textContent;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let frame = 0;
  const totalFrames = original.length * 2.5;

  const tick = () => {
    el.textContent = original.split('').map((char, i) => {
      if (char === ' ' || char === '\n') return char;
      if (i < frame / 2.5) return char;
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    frame++;
    if (frame <= totalFrames) requestAnimationFrame(tick);
    else el.textContent = original;
  };
  requestAnimationFrame(tick);
}

// ── Cursor glow on product cards ──────────────────────────────────────────────

function initCardGlow() {
  document.querySelectorAll('.p-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });
}

// ── Button ripple ─────────────────────────────────────────────────────────────

function initRipple() {
  document.addEventListener('click', e => {
    const btn = e.target.closest(
      '.s-btn, .s-btn--add, .am-submit, .auth-submit, .am-tab, .filter-btn'
    );
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const ripple = document.createElement('span');
    ripple.className = 's-ripple';
    ripple.style.cssText = `
      width:${size}px; height:${size}px;
      left:${e.clientX - r.left - size / 2}px;
      top:${e.clientY - r.top - size / 2}px;
    `;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });
}

// ── Scroll progress bar ───────────────────────────────────────────────────────

function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 's-progress';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
  }, { passive: true });
}

// ── Back to top ───────────────────────────────────────────────────────────────

function initBackToTop() {
  const btn = document.createElement('button');
  btn.id = 's-back-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('s-visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Hero parallax ─────────────────────────────────────────────────────────────

function initHeroParallax() {
  const hero = document.querySelector('.s-hero__bg');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight * 1.2) {
      hero.style.setProperty('--parallax-y', `${y * 0.2}px`);
    }
  }, { passive: true });
}

// ── Page transitions ──────────────────────────────────────────────────────────

function initPageTransitions() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto')
      || href.startsWith('tel') || href.includes('://')
      || link.target === '_blank'
      || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    document.documentElement.classList.add('page-exit');
    setTimeout(() => { window.location.href = href; }, 200);
  });
}

// ── Wishlist button sync ──────────────────────────────────────────────────────

function initWishlistButtons() {
  document.querySelectorAll('.p-card').forEach(card => {
    const name = card.querySelector('.p-card__name');
    if (!name) return;
    const btn = card.querySelector('.s-btn--wishlist');
    if (!btn) return;
    if (isWishlisted(name.textContent.trim())) {
      btn.classList.add('wishlisted');
      btn.querySelector('i').className = 'bi bi-heart-fill';
      btn.setAttribute('aria-label', 'Remove from wishlist');
    }
    btn.addEventListener('click', toggleWishlist);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function signOut() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  } catch (_) {}
  localStorage.removeItem('selwa_user');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  // Restore session from cookie if localStorage is stale / missing
  if (!getUser()) {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('selwa_user', JSON.stringify(user));
      }
    } catch (_) {}
  }

  // Sync wishlist from server so badge and heart states are accurate
  if (getUser()) {
    await syncWishlistFromServer();
  }

  updateCartCount();
  updateWishlistCount();
  buildAuthModal();
  renderNavAuth();
  buildMobileDock();
  initMobileNav();
  initScrollReveal();
  initCardGlow();
  initWishlistButtons();
  initRipple();
  initScrollProgress();
  initBackToTop();
  initHeroParallax();
  initPageTransitions();
});
