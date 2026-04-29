const COUPONS = { SELWA10: 10, BHUTAN20: 20 };
let discountPct = 0;

function syncCartStorage(count) {
    localStorage.setItem('selwa-cart-count', String(Math.max(0, count)));
    syncCartBadge(count);
}

function recalculate() {
    const items = document.querySelectorAll('#cart-items .cart-item-card');
    let subtotal = 0;
    let count = 0;

    items.forEach((item) => {
        const price = parseInt(item.dataset.price, 10);
        const qty = parseInt(item.querySelector('.qty-val').textContent, 10);
        const lineTotal = price * qty;
        item.querySelector('.item-total').textContent = 'Nu. ' + lineTotal.toLocaleString('en-IN');
        subtotal += lineTotal;
        count += qty;
    });

    const discount = Math.round((subtotal * discountPct) / 100);
    const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 300;
    const total = subtotal - discount + shipping;

    document.getElementById('subtotal').textContent = 'Nu. ' + subtotal.toLocaleString('en-IN');
    document.getElementById('shipping-label').textContent = shipping === 0 ? 'Free' : 'Nu. ' + shipping.toLocaleString('en-IN');
    document.getElementById('total').textContent = 'Nu. ' + total.toLocaleString('en-IN');
    document.getElementById('summary-count').textContent = count;
    document.getElementById('item-count').textContent = count + ' item' + (count !== 1 ? 's' : '');

    if (discount > 0) {
        document.getElementById('discount-row').style.removeProperty('display');
        document.getElementById('discount-label').textContent = '-Nu. ' + discount.toLocaleString('en-IN');
    } else {
        document.getElementById('discount-row').style.display = 'none';
    }

    const hasItems = items.length > 0;
    document.getElementById('cart-items').style.display = hasItems ? '' : 'none';
    document.getElementById('empty-cart').classList.toggle('d-none', hasItems);
    document.querySelector('.summary-card').style.opacity = hasItems ? '1' : '.55';
    document.querySelector('.summary-card').style.pointerEvents = hasItems ? '' : 'none';

    syncCartStorage(count);
}

function changeItemQty(btn, delta) {
    const card = btn.closest('.cart-item-card');
    const qtyEl = card.querySelector('.qty-val');
    const newQty = parseInt(qtyEl.textContent, 10) + delta;

    if (newQty <= 0) {
        removeItem(btn);
        return;
    }

    qtyEl.textContent = newQty;
    recalculate();
}

function removeItem(btn) {
    const card = btn.closest('.cart-item-card');
    card.style.transition = 'opacity .22s ease';
    card.style.opacity = '0';
    setTimeout(() => {
        card.remove();
        recalculate();
    }, 220);
}

function applyCoupon() {
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    const msg = document.getElementById('coupon-msg');

    if (COUPONS[code] !== undefined) {
        discountPct = COUPONS[code];
        msg.style.color = 'var(--success)';
        msg.textContent = `Coupon "${code}" applied — ${discountPct}% off.`;
    } else {
        discountPct = 0;
        msg.style.color = 'var(--danger)';
        msg.textContent = 'Invalid coupon code. Try SELWA10 or BHUTAN20.';
    }
    recalculate();
}

function checkout() {
    if (document.querySelectorAll('#cart-items .cart-item-card').length === 0) return;
    showToast('Checkout flow will connect in the next milestone.');
}

document.addEventListener('DOMContentLoaded', recalculate);
