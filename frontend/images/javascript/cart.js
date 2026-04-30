// cart.js

const COUPONS = { SELWA10: 10, BHUTAN20: 20 };
let discountPct = 0;

/* ── Auth gate: if not logged in, replace cart content with a sign-in prompt ── */
function checkCartAuth() {
    if (isLoggedIn()) return;
    var wrap = document.getElementById('cart-main');
    if (!wrap) return;
    wrap.innerHTML = [
        '<div style="grid-column:1/-1;text-align:center;padding:64px 24px">',
        '  <i class="bi bi-lock" style="font-size:3rem;color:var(--text-faint)"></i>',
        '  <h3 style="margin-top:16px;margin-bottom:8px">Sign in to view your cart</h3>',
        '  <p style="color:var(--text-muted);margin-bottom:24px">Your saved items and orders are waiting for you.</p>',
        '  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">',
        '    <a href="login.html?return=cart.html" class="s-btn s-btn--gold">Sign in</a>',
        '    <a href="signup.html?return=cart.html" class="s-btn s-btn--outline-dark">Create account</a>',
        '  </div>',
        '  <div style="margin-top:20px"><a href="products.html" style="font-size:.875rem;color:var(--gold)">Continue browsing</a></div>',
        '</div>'
    ].join('');
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