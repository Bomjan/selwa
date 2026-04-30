// ── Auth helpers ──────────────────────────────────────────────────────────────
function isLoggedIn() {
  return !!localStorage.getItem('selwa_user');
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('selwa_user')); } catch { return null; }
}

function logout() {
  localStorage.removeItem('selwa_user');
  window.location.href = 'index.html';
}

// ── Cart count (localStorage) ─────────────────────────────────────────────────
function getCartCount() {
  return parseInt(localStorage.getItem('selwa_cart_count') || '0');
}

function saveCartCount(n) {
  localStorage.setItem('selwa_cart_count', String(Math.max(0, n)));
}

function updateCartBadge() {
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent = getCartCount();
  });
}

// ── Toast notifications ───────────────────────────────────────────────────────
function showToast(msg, type) {
  type = type || 'success';
  var container = document.getElementById('selwa-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'selwa-toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'selwa-toast selwa-toast-' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  // Trigger animation
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { toast.classList.add('show'); });
  });
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () { toast.remove(); }, 350);
  }, 3200);
}

// ── Sign-in gate modal ────────────────────────────────────────────────────────
function ensureSignInModal() {
  if (document.getElementById('selwa-signin-gate')) return;
  var el = document.createElement('div');
  el.className = 'modal fade';
  el.id = 'selwa-signin-gate';
  el.setAttribute('tabindex', '-1');
  el.innerHTML = [
    '<div class="modal-dialog modal-dialog-centered">',
    '  <div class="modal-content rounded-4 border-0 shadow-lg">',
    '    <div class="modal-body text-center py-5 px-4">',
    '      <div style="font-size:3rem;line-height:1">🔐</div>',
    '      <h5 class="mt-3 mb-1 fw-semibold" style="color:var(--amber-deep)">Sign in to add to cart</h5>',
    '      <p class="text-muted small mb-4">You need a Selwa account to save items and place orders.</p>',
    '      <div class="d-flex gap-2 justify-content-center">',
    '        <a id="gate-signin-link" href="login.html" class="btn btn-selwa px-4">Sign in</a>',
    '        <a id="gate-signup-link" href="signup.html" class="btn btn-selwa-outline px-4">Create account</a>',
    '      </div>',
    '      <div class="mt-3">',
    '        <button type="button" class="btn btn-link small text-muted p-0" data-bs-dismiss="modal">Continue browsing</button>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(el);
}

function showSignInGate() {
  ensureSignInModal();
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (!currentPage) currentPage = 'index.html';
  var returnParam = '?return=' + encodeURIComponent(currentPage);
  var signinLink = document.getElementById('gate-signin-link');
  var signupLink = document.getElementById('gate-signup-link');
  if (signinLink) signinLink.href = 'login.html' + returnParam;
  if (signupLink) signupLink.href = 'signup.html' + returnParam;
  var bsModal = new bootstrap.Modal(document.getElementById('selwa-signin-gate'));
  bsModal.show();
}

// ── Add to cart ───────────────────────────────────────────────────────────────
function addToCart(e) {
  if (e) e.stopPropagation();
  if (!isLoggedIn()) {
    showSignInGate();
    return;
  }
  var n = getCartCount() + 1;
  saveCartCount(n);
  updateCartBadge();
  showToast('Added to cart!');
}

// ── Navbar: auth state ────────────────────────────────────────────────────────
function updateNavAuthState() {
  var el = document.getElementById('nav-auth-item');
  if (!el) return;
  if (isLoggedIn()) {
    var user = getCurrentUser();
    var first = (user && user.name) ? user.name.split(' ')[0] : 'Account';
    el.innerHTML =
      '<span style="display:inline-flex;align-items:center;gap:8px">' +
      '  <span class="nav-link" style="cursor:default;color:var(--text-mid)"><i class="bi bi-person-circle" style="margin-right:4px"></i>' + first + '</span>' +
      '  <button class="s-btn s-btn--outline-dark s-btn--sm" onclick="logout()">Sign out</button>' +
      '</span>';
  } else {
    el.innerHTML = '<a class="s-btn s-btn--outline-dark s-btn--sm" href="login.html">Sign in</a>';
  }
}

// ── Page init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  updateNavAuthState();
  updateCartBadge();
});
