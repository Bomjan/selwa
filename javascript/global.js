window.SELWA_DEMO_PRODUCTS = [
    {
        id: 1,
        name: 'Handwoven Kishuthara',
        description: 'A ceremonial silk textile handwoven in Bhutan using generations-old loom techniques and geometric motifs.',
        price: 12000,
        category: 'Textiles',
        region: 'Thimphu',
        materials: 'Silk, natural dyes',
        stock_quantity: 3,
        image_url: '',
        artisan: { id: 1, name: 'Pema Choden', location: 'Thimphu', craft_type: 'Weaving' }
    },
    {
        id: 2,
        name: 'Prayer Flag Set',
        description: 'A handcrafted set of prayer flags designed for home altars, courtyards, and gifting.',
        price: 850,
        category: 'Textiles',
        region: 'Punakha',
        materials: 'Cotton',
        stock_quantity: 15,
        image_url: '',
        artisan: { id: 2, name: 'Tshering Lhamo', location: 'Punakha', craft_type: 'Textile finishing' }
    },
    {
        id: 3,
        name: 'Carved Wooden Mask',
        description: 'A decorative wooden mask inspired by Bhutanese tsechu festivals and hand-carved in cypress wood.',
        price: 4200,
        category: 'Woodcraft',
        region: 'Paro',
        materials: 'Cypress wood',
        stock_quantity: 4,
        image_url: '',
        artisan: { id: 3, name: 'Tashi Dorji', location: 'Paro', craft_type: 'Woodcraft' }
    },
    {
        id: 4,
        name: 'Butter Tea Bowl',
        description: 'A polished wooden serving bowl made for traditional butter tea rituals and ceremonial hospitality.',
        price: 1600,
        category: 'Woodcraft',
        region: 'Paro',
        materials: 'Seasoned hardwood',
        stock_quantity: 8,
        image_url: '',
        artisan: { id: 3, name: 'Tashi Dorji', location: 'Paro', craft_type: 'Woodcraft' }
    },
    {
        id: 5,
        name: 'Silver Pendant',
        description: 'A handcrafted silver pendant with subtle Buddhist motifs and a polished heirloom finish.',
        price: 3200,
        category: 'Jewellery',
        region: 'Bumthang',
        materials: 'Silver',
        stock_quantity: 6,
        image_url: '',
        artisan: { id: 4, name: 'Dechen Lhamo', location: 'Bumthang', craft_type: 'Jewellery' }
    },
    {
        id: 6,
        name: 'Painted Clay Vase',
        description: 'A hand-painted clay vessel with warm earth pigments drawn from Bhutanese floral patterns.',
        price: 2800,
        category: 'Pottery',
        region: 'Wangdue',
        materials: 'Clay, mineral pigment',
        stock_quantity: 5,
        image_url: '',
        artisan: { id: 5, name: 'Sonam Zangmo', location: 'Wangdue', craft_type: 'Pottery' }
    }
];

function getStoredCartCount() {
    return parseInt(localStorage.getItem('selwa-cart-count') || '0', 10);
}

function setStoredCartCount(value) {
    localStorage.setItem('selwa-cart-count', String(Math.max(0, value)));
}

function syncCartBadge(value) {
    const count = typeof value === 'number' ? value : getStoredCartCount();
    document.querySelectorAll('#cart-count').forEach((badge) => {
        badge.textContent = count;
    });
}

function addToCart(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const count = getStoredCartCount() + 1;
    setStoredCartCount(count);
    syncCartBadge(count);
    showToast('Added to your cart.');
}

function showToast(message, type) {
    const existing = document.getElementById('selwa-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'selwa-toast';
    toast.className = 'selwa-toast' + (type === 'error' ? ' selwa-toast--error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('selwa-toast--visible'));

    setTimeout(() => {
        toast.classList.remove('selwa-toast--visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 2600);
}

document.addEventListener('DOMContentLoaded', () => syncCartBadge());
