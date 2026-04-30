document.addEventListener('DOMContentLoaded', function () {

  // ── Toggle password visibility
  document.querySelectorAll('.password-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(this.dataset.target);
      if (!input) return;
      var isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      var icon = this.querySelector('i');
      icon.classList.toggle('bi-eye', isText);
      icon.classList.toggle('bi-eye-slash', !isText);
    });
  });

  // ── Password strength meter (signup page)
  var pwdInput = document.getElementById('password');
  var strengthFill = document.getElementById('strength-fill');
  var strengthText = document.getElementById('strength-text');

  if (pwdInput && strengthFill) {
    pwdInput.addEventListener('input', function () {
      var val = this.value;
      var score = 0;
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

  // ── Helper: get redirect URL from ?return= param
  function getReturnUrl() {
    var returnPage = new URLSearchParams(window.location.search).get('return');
    return returnPage || 'index.html';
  }

  // ── Login form
  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('email').value.trim();
      var pwd = document.getElementById('login-password').value;
      var btn = loginForm.querySelector('.auth-submit');

      if (!email || !pwd) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      btn.textContent = 'Signing in…';
      btn.disabled = true;

      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pwd })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) {
            showToast(data.error, 'error');
          } else {
            localStorage.setItem('selwa_user', JSON.stringify(data.user));
            showToast('Welcome back, ' + (data.user.name.split(' ')[0]) + '!');
            setTimeout(function () {
              window.location.href = getReturnUrl();
            }, 1100);
          }
        })
        .catch(function () {
          showToast('Could not connect. Please try again.', 'error');
        })
        .finally(function () {
          btn.textContent = 'Sign in';
          btn.disabled = false;
        });
    });
  }

  // ── Signup form
  var signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('full-name').value.trim();
      var email = document.getElementById('signup-email').value.trim();
      var pwd = document.getElementById('password').value;
      var confirmPwd = document.getElementById('confirm-password').value;
      var terms = document.getElementById('terms') ? document.getElementById('terms').checked : false;
      var btn = signupForm.querySelector('.auth-submit');

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

      fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, password: pwd })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) {
            showToast(data.error, 'error');
          } else {
            showToast('Account created! Please sign in.');
            setTimeout(function () {
              window.location.href = 'login.html' + window.location.search;
            }, 1200);
          }
        })
        .catch(function () {
          showToast('Could not connect. Please try again.', 'error');
        })
        .finally(function () {
          btn.textContent = 'Create account';
          btn.disabled = false;
        });
    });
  }

  // ── Forgot Password form
  var forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('forgot-email').value.trim();
      var btn = forgotPasswordForm.querySelector('.auth-submit');

      if (!email) {
        showToast('Please enter your email address.', 'error');
        return;
      }

      btn.textContent = 'Sending link…';
      btn.disabled = true;

      setTimeout(function () {
        btn.textContent = 'Send reset link';
        btn.disabled = false;
        showToast('If an account exists for that email, a reset link has been sent.');
        document.getElementById('forgot-email').value = '';
      }, 1400);
    });
  }

});
