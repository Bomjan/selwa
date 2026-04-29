// detail.js

function changeQty(delta) {
    var el = document.getElementById('qty');
    el.textContent = Math.max(1, parseInt(el.textContent) + delta);
}

function setThumb(el, emoji) {
    document.querySelectorAll('.thumb').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    document.getElementById('main-img').textContent = emoji;
}

function saveWishlist(e) {
    if (e) e.preventDefault();
    if (!isLoggedIn()) {
        showSignInGate();
        return;
    }
    showToast('Saved to your wishlist!');
}