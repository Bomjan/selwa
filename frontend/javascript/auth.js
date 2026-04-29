document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.password-toggle').forEach((btn) => {
        btn.addEventListener('click', function () {
            const input = document.getElementById(this.dataset.target);
            if (!input) return;
            const showText = input.type === 'password';
            input.type = showText ? 'text' : 'password';
            const icon = this.querySelector('i');
            if (!icon) return;
            icon.classList.toggle('bi-eye', !showText);
            icon.classList.toggle('bi-eye-slash', showText);
        });
    });

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
            if (!val) {
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

    attachLoginHandler();
    attachSignupHandler();
    attachForgotHandler();
});

async function requestAuth(path, payload) {
    try {
        const response = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error((data && data.error) || 'Request failed');
        }

        return await response.json();
    } catch (error) {
        return { fallback: true, message: error.message };
    }
}

function attachLoginHandler() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const pwd = document.getElementById('login-password').value;
        const btn = loginForm.querySelector('.auth-submit');

        if (!email || !pwd) {
            showToast('Please fill in all fields.', 'error');
            return;
        }

        btn.textContent = 'Signing in...';
        btn.disabled = true;

        const result = await requestAuth('/api/login', { email, password: pwd });

        btn.textContent = 'Sign in';
        btn.disabled = false;

        if (result.fallback) {
            showToast('Signed in with demo mode. Backend login will connect later.');
        } else {
            showToast('Welcome back to Selwa!');
        }

        setTimeout(() => { window.location.href = 'index.html'; }, 1100);
    });
}

function attachSignupHandler() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async function (e) {
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

        btn.textContent = 'Creating account...';
        btn.disabled = true;

        const result = await requestAuth('/api/signup', { name, email, password: pwd });

        btn.textContent = 'Create account';
        btn.disabled = false;

        if (result.fallback) {
            showToast('Account created in demo mode. You can continue to sign in.');
        } else {
            showToast('Account created! Please sign in.');
        }

        setTimeout(() => { window.location.href = 'login.html'; }, 1100);
    });
}

function attachForgotHandler() {
    const forgotForm = document.getElementById('forgot-password-form');
    if (!forgotForm) return;

    forgotForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim();
        const btn = forgotForm.querySelector('.auth-submit');

        if (!email) {
            showToast('Please enter your email address.', 'error');
            return;
        }

        btn.textContent = 'Sending link...';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = 'Send reset link';
            btn.disabled = false;
            showToast(`Reset instructions prepared for ${email}.`);
            document.getElementById('forgot-email').value = '';
        }, 900);
    });
}
