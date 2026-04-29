// cart.js

const COUPONS = { SELWA10: 10, BHUTAN20: 20 };
let discountPct = 0;

/* ── Auth gate: if not logged in, replace cart content with a sign-in prompt ── */
function checkCartAuth() {
    if (isLoggedIn()) return;
    var wrap = document.querySelector('.px-4.pb-5 .row');
    if (!wrap) return;
    wrap.innerHTML = [
        '<div class="col-12 text-center py-5 my-3">',
        '  <div style="font-size:3.5rem;line-height:1">🔐</div>',
        '  <h4 class="mt-4 mb-2 fw-semibold" style="color:var(--amber-deep)">Sign in to view your cart</h4>',
        '  <p class="text-muted small mb-4">Your saved items and orders are waiting for you.</p>',
        '  <div class="d-flex gap-3 justify-content-center flex-wrap">',
        '    <a href="login.html?return=cart.html" class="btn btn-selwa px-5 py-2">Sign in</a>',
        '    <a href="signup.html?return=cart.html" class="btn btn-selwa-outline px-5 py-2">Create account</a>',
        '  </div>',
        '  <div class="mt-4"><a href="products.html" class="small" style="color:var(--amber-dark)">Continue browsing</a></div>',
        '</div>'
    ].join('');
    // Hide coupon and suggestions sections
    document.querySelectorAll('.px-4.pb-5').forEach(function(el, i) {
        if (i > 0) el.style.display = 'none';
    });
}

/* ── recalculate()
   Reads all item quantities and prices, updates subtotal, discount, total,
   and the item count badges. ── */
function recalculate() {
    const items = document.querySelectorAll('#cart-items .cart-item-card');
    let subtotal = 0;
    let count = 0;

    items.forEach(item => {
        const price = parseInt(item.dataset.price);
        const qty = parseInt(item.querySelector('.qty-val').textContent);
        const lineTotal = price * qty;
        item.querySelector('.item-total').textContent = 'Nu. ' + lineTotal.toLocaleString();
        subtotal += lineTotal;
        count += qty;
    });

    const discount = Math.round(subtotal * discountPct / 100);
    const shipping = subtotal >= 5000 ? 0 : 300;
    const total = subtotal - discount + shipping;

    document.getElementById('subtotal').textContent = 'Nu. ' + subtotal.toLocaleString();
    document.getElementById('shipping-label').textContent = shipping === 0 ? 'Free' : 'Nu. ' + shipping;
    document.getElementById('total').textContent = 'Nu. ' + total.toLocaleString();
    document.getElementById('summary-count').textContent = count;
    document.getElementById('item-count').textContent = count + ' item' + (count !== 1 ? 's' : '');
    document.getElementById('cart-count').textContent = count;

    if (discount > 0) {
        document.getElementById('discount-row').style.removeProperty('display');
        document.getElementById('discount-label').textContent = '−Nu. ' + discount.toLocaleString();
    } else {
        document.getElementById('discount-row').style.display = 'none';
    }

    // Show empty state if no items left
    const hasItems = items.length > 0;
    document.getElementById('cart-items').style.display = hasItems ? '' : 'none';
    document.getElementById('empty-cart').classList.toggle('d-none', hasItems);
    document.querySelector('.summary-card').style.opacity = hasItems ? '1' : '.5';
    document.querySelector('.summary-card').style.pointerEvents = hasItems ? '' : 'none';
}

/* ── changeItemQty(btn, delta)
   Adjusts a single cart item quantity; removes item if it hits 0. ── */
function changeItemQty(btn, delta) {
    const card = btn.closest('.cart-item-card');
    const qtyEl = card.querySelector('.qty-val');
    const newQty = parseInt(qtyEl.textContent) + delta;

    if (newQty <= 0) {
        removeItem(btn);
        return;
    }
    qtyEl.textContent = newQty;
    recalculate();
}

/* ── removeItem(btn)
   Removes the cart item card with a fade animation. ── */
function removeItem(btn) {
    const card = btn.closest('.cart-item-card');
    card.style.transition = 'opacity .3s';
    card.style.opacity = '0';
    setTimeout(() => { card.remove(); recalculate(); }, 300);
}

/* ── applyCoupon()
   Validates and applies a coupon code. ── */
function applyCoupon() {
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    const msg = document.getElementById('coupon-msg');

    if (COUPONS[code] !== undefined) {
        discountPct = COUPONS[code];
        msg.style.color = '#27500A';
        msg.textContent = `✅ Coupon "${code}" applied — ${discountPct}% off!`;
    } else {
        discountPct = 0;
        msg.style.color = '#dc3545';
        msg.textContent = '❌ Invalid coupon code. Try SELWA10 or BHUTAN20.';
    }
    recalculate();
}

/* ── checkout()
   Placeholder checkout handler. ── */
function checkout() {
    const items = document.querySelectorAll('#cart-items .cart-item-card');
    if (items.length === 0) return;
    alert('Proceeding to checkout — payment integration coming soon!');
}

// Initialise on page load
document.addEventListener('DOMContentLoaded', function () {
    checkCartAuth();
    if (isLoggedIn()) {
        recalculate();
        // Sync localStorage cart count with actual items in cart
        var items = document.querySelectorAll('#cart-items .cart-item-card');
        var count = 0;
        items.forEach(function (item) {
            count += parseInt(item.querySelector('.qty-val').textContent || '1');
        });
        saveCartCount(count);
        updateCartBadge();
    }
});