// detail.js

/* ── changeQty(delta)
   Increases or decreases quantity, never below 1. ── */
function changeQty(delta) {
    const el = document.getElementById('qty');
    const val = Math.max(1, parseInt(el.textContent) + delta);
    el.textContent = val;
}

/* ── setThumb(el, emoji)
   Highlights the clicked thumbnail and updates the main image. ── */
function setThumb(el, emoji) {
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('main-img').textContent = emoji;
}