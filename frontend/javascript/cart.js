// cart.js

const COUPONS = { SELWA10: 10, BHUTAN20: 20 }; // code → % discount
let discountPct = 0;

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

// Initialise totals on page load
recalculate();