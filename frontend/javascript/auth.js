async function pushLocalWishlist() {
  const list = JSON.parse(localStorage.getItem('selwa_wishlist') || '[]');
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

function showError(msg) {
  let el = document.getElementById('auth-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'auth-error';
    const form = document.querySelector('form');
    form.insertBefore(el, form.firstChild);
  }
  el.textContent = msg;
}

// Password visibility toggle
document.querySelectorAll('.password-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'bi bi-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'bi bi-eye';
    }
  });
});

// Login form
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = loginForm.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('selwa_user', JSON.stringify(data.user));
      await pushLocalWishlist();
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = redirect || (data.user.is_admin ? 'admin.html' : 'profile.html');
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });
}

// Signup form
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  const pwdInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');
  const fill = document.getElementById('strength-fill');
  const strengthText = document.getElementById('strength-text');
  const rulesEl = document.getElementById('pw-rules');
  const confirmMsg = document.getElementById('confirm-msg');

  const rules = [
    { id: 'rule-length',  test: v => v.length >= 8 },
    { id: 'rule-upper',   test: v => /[A-Z]/.test(v) },
    { id: 'rule-number',  test: v => /[0-9]/.test(v) },
    { id: 'rule-special', test: v => /[^A-Za-z0-9]/.test(v) },
  ];

  function checkPassword(val) {
    const results = rules.map(r => r.test(val));
    const strength = results.filter(Boolean).length;

    // strength bar
    const colors = ['', '#e74c3c', '#e67e22', '#f1c40f', '#27ae60'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    fill.style.width = (strength * 25) + '%';
    fill.style.background = colors[strength];
    strengthText.textContent = val.length ? labels[strength] : '';
    strengthText.style.color = colors[strength];

    // rules list
    if (val.length > 0) {
      rulesEl.classList.add('visible');
      rules.forEach((r, i) => {
        const li = document.getElementById(r.id);
        li.className = results[i] ? 'ok' : 'fail';
      });
    } else {
      rulesEl.classList.remove('visible');
      rules.forEach(r => { document.getElementById(r.id).className = ''; });
    }

    return results.every(Boolean);
  }

  function checkConfirm() {
    if (!confirmInput.value) { confirmMsg.textContent = ''; confirmMsg.className = 'confirm-msg'; return false; }
    const match = pwdInput.value === confirmInput.value;
    confirmMsg.textContent = match ? 'Passwords match' : 'Passwords do not match';
    confirmMsg.className = 'confirm-msg ' + (match ? 'match' : 'no-match');
    return match;
  }

  if (pwdInput) {
    pwdInput.addEventListener('input', () => {
      checkPassword(pwdInput.value);
      if (confirmInput.value) checkConfirm();
    });
  }

  if (confirmInput) {
    confirmInput.addEventListener('input', checkConfirm);
  }

  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('full-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = pwdInput.value;
    const confirm = confirmInput.value;

    if (!name) { showError('Please enter your full name'); return; }
    if (!email) { showError('Please enter your email'); return; }

    const pwdStrong = checkPassword(password);
    if (!pwdStrong) {
      showError('Password does not meet all requirements');
      rulesEl.classList.add('visible');
      rules.forEach(r => {
        const li = document.getElementById(r.id);
        if (!li.classList.contains('ok')) li.className = 'fail';
      });
      return;
    }

    if (password !== confirm) {
      checkConfirm();
      showError('Passwords do not match');
      return;
    }

    const btn = signupForm.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Creating account…';

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      localStorage.setItem('selwa_user', JSON.stringify(data.user));
      await pushLocalWishlist();
      window.location.href = 'profile.html';
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Create account';
    }
  });
}
