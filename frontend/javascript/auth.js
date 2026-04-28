document.addEventListener('DOMContentLoaded', function () {

  // ── Toggle password visibility
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', function () {
      const input = document.getElementById(this.dataset.target);
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      const icon = this.querySelector('i');
      icon.classList.toggle('bi-eye', isText);
      icon.classList.toggle('bi-eye-slash', !isText);
    });
  });

  // ── Password strength meter (signup page)
  const pwdInput = document.getElementById('password');
  const strengthFill = document.getElementById('strength-fill');
  const strengthText = document.getElementById('strength-text');

  if (pwdInput && strengthFill) {
    pwdInput.addEventListener('input', function () {
      const val = this.value;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      strengthFill.className = 'strength-fill';
      if (val.length === 0) {
        strengthFill.style.width = '0';
        if (strengthText) strengthText.textContent = '';
      } else if (score <= 1) {
        strengthFill.classList.add('weak');
        if (strengthText) strengthText.textContent = 'Weak password';
      } else if (score <= 3) {
        strengthFill.classList.add('medium');
        if (strengthText) strengthText.textContent = 'Moderate password';
      } else {
        strengthFill.classList.add('strong');
        if (strengthText) strengthText.textContent = 'Strong password';
      }
    });
  }

  // ── Login form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const pwd = document.getElementById('login-password').value;
      const btn = loginForm.querySelector('.auth-submit');

      if (!email || !pwd) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      btn.textContent = 'Signing in…';
      btn.disabled = true;

      // Simulate async login
      setTimeout(() => {
        btn.textContent = 'Sign in';
        btn.disabled = false;
        // On success, redirect to index.html
        showToast('Welcome back to Selwa!');
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
      }, 1400);
    });
  }

  // ── Signup form submission
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('full-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const pwd = document.getElementById('password').value;
      const confirmPwd = document.getElementById('confirm-password').value;
      const terms = document.getElementById('terms')?.checked;
      const btn = signupForm.querySelector('.auth-submit');

      if (!name || !email || !pwd || !confirmPwd) {
        showToast('Please fill in all fields.', 'error');
        return;
      }
      if (pwd !== confirmPwd) {
        showToast('Passwords do not match.', 'error');
        return;
      }
      if (!terms) {
        showToast('Please accept the terms to continue.', 'error');
        return;
      }
      if (pwd.length < 8) {
        showToast('Password must be at least 8 characters.', 'error');
        return;
      }

      btn.textContent = 'Creating account…';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = 'Create account';
        btn.disabled = false;
        showToast('Account created! Please log in.');
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      }, 1600);
    });
  }

  // ── Forgot Password form submission
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const btn = forgotPasswordForm.querySelector('.auth-submit');

      if (!email) {
        showToast('Please enter your email address.', 'error');
        return;
      }

      btn.textContent = 'Sending link…';
      btn.disabled = true;

      // Simulate sending email
      setTimeout(() => {
        btn.textContent = 'Send reset link';
        btn.disabled = false;
        showToast('If an account exists for ' + email + ', you will receive a password reset link shortly.');
        document.getElementById('forgot-email').value = '';
      }, 1500);
    });
  }

});