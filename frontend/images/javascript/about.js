// about.js

/* ── submitContact()
   Basic form validation and success message display. ── */
function submitContact() {
    const inputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
    let valid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#dc3545';
            valid = false;
        } else {
            input.style.borderColor = '';
        }
    });

    if (valid) {
        var successEl = document.getElementById('contact-success');
        if (successEl) successEl.style.display = 'block';
        inputs.forEach(input => input.value = '');
    }
}