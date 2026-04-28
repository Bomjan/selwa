const DETAIL_CATEGORY_CONFIG = {
    Textiles: { emoji: '🧵', bg: 'linear-gradient(145deg, #f0e1c8, #fdf6eb)' },
    Woodcraft: { emoji: '🪵', bg: 'linear-gradient(145deg, #ebeadf, #faf8f2)' },
    Jewellery: { emoji: '📿', bg: 'linear-gradient(145deg, #efe6f8, #faf7fe)' },
    Pottery: { emoji: '🫙', bg: 'linear-gradient(145deg, #f6e6de, #fff7f1)' },
    Paintings: { emoji: '🖼️', bg: 'linear-gradient(145deg, #eee7da, #faf6ef)' }
};

function detailFormatPrice(price) {
    return 'Nu. ' + Math.round(price).toLocaleString('en-IN');
}

function getInitials(name) {
    return name.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getFallbackProduct(id) {
    return (window.SELWA_DEMO_PRODUCTS || []).find((product) => String(product.id) === String(id));
}

async function fetchProduct(id) {
    try {
        const res = await fetch(`/api/products/${id}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('server error');
        return await res.json();
    } catch (err) {
        return getFallbackProduct(id);
    }
}

function renderProduct(product) {
    const config = DETAIL_CATEGORY_CONFIG[product.category] || { emoji: '🎁', bg: 'linear-gradient(145deg, #efe8de, #faf6f0)' };
    document.title = `Selwa — ${product.name}`;

    const mainImg = document.getElementById('main-img');
    if (mainImg) {
        mainImg.textContent = config.emoji;
        mainImg.style.background = config.bg;
    }

    document.querySelectorAll('.thumb').forEach((thumb) => {
        thumb.textContent = config.emoji;
        thumb.style.background = config.bg;
    });

    setText('detail-title', product.name);
    setText('detail-breadcrumb', product.name);
    setText('detail-price', detailFormatPrice(product.price));
    setText('detail-category', `${product.category} · ${product.region || 'Bhutan'}`);
    setText('detail-materials', product.materials || 'Craft materials shared by artisan');
    setText('detail-stock', `${product.stock_quantity} in stock`);
    setText('detail-description', product.description);
    setText('detail-origin', product.region || 'Bhutan');
    setText('detail-spec-materials', product.materials || 'Mixed natural materials');

    if (product.artisan && product.artisan.name) {
        setText('detail-artisan-name', product.artisan.name);
        setText('detail-artisan-craft', product.artisan.craft_type);
        setText('detail-artisan-location', `${product.artisan.location}, Bhutan`);
        setText('detail-artisan-avatar', getInitials(product.artisan.name));
    }
}

async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || '1';
    const product = await fetchProduct(id);

    if (!product) {
        setText('detail-title', 'Product not found');
        return;
    }

    renderProduct(product);
}

function changeQty(delta) {
    const el = document.getElementById('qty');
    const nextValue = Math.max(1, parseInt(el.textContent, 10) + delta);
    el.textContent = nextValue;
}

function setThumb(el, emoji) {
    document.querySelectorAll('.thumb').forEach((thumb) => thumb.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('main-img').textContent = emoji;
}

document.addEventListener('DOMContentLoaded', loadProduct);
