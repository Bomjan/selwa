function submitContact() {
    const inputs = document.querySelectorAll('.contact-form input, .contact-form textarea, .contact-form select');
    let valid = true;

    inputs.forEach((input) => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger)';
            valid = false;
        } else {
            input.style.borderColor = '';
        }
    });

    if (!valid) {
        showToast('Please complete all fields before sending.', 'error');
        return;
    }

    const success = document.getElementById('contact-success');
    if (success) success.classList.remove('d-none');
    inputs.forEach((input) => { input.value = ''; });
    showToast('Your message has been prepared. We will follow up soon.');
}
