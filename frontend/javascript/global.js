/* ── addToCart(event)
   Stops click bubbling, increments cart badge in navbar. ── */
function addToCart(e) {
    e.stopPropagation();
    const badge = document.getElementById('cart-count');
    badge.textContent = parseInt(badge.textContent) + 1;
}