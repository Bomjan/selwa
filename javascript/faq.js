function toggleFAQ(button) {
    const item = button.closest('.faq-item');
    if (!item) return;
    item.classList.toggle('is-open');
}
