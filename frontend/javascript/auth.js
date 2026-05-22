function showError(msg) {
  let el = document.getElementById('auth-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'auth-error';
    el.style.cssText =
      'color:#c0392b;font-size:0.875rem;margin-bottom:14px;padding:10px 14px;background:#fdf0f0;border:1px solid #f5c6c6;border-radius:6px;';
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('selwa_user', JSON.stringify(data.user));
      window.location.href = 'profile.html';
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
  // Password strength indicator
  const pwdInput = document.getElementById('password');
  if (pwdInput) {
    pwdInput.addEventListener('input', () => {
      const val = pwdInput.value;
      const fill = document.getElementById('strength-fill');
      const text = document.getElementById('strength-text');
      if (!fill || !text) return;
      let strength = 0;
      if (val.length >= 8) strength++;
      if (/[A-Z]/.test(val)) strength++;
      if (/[0-9]/.test(val)) strength++;
      if (/[^A-Za-z0-9]/.test(val)) strength++;
      const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
      const colors = ['', '#e74c3c', '#e67e22', '#f1c40f', '#27ae60'];
      fill.style.width = (strength * 25) + '%';
      fill.style.background = colors[strength];
      text.textContent = labels[strength];
      text.style.color = colors[strength];
    });
  }

  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('full-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;

    if (password !== confirm) {
      showError('Passwords do not match');
      return;
    }

    const btn = signupForm.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Creating account…';

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      localStorage.setItem('selwa_user', JSON.stringify(data.user));
      window.location.href = 'profile.html';
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Create account';
    }
  });
}
