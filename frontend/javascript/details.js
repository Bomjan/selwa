const DETAIL_CATEGORY_CONFIG = {
    Crafts:   { emoji: '🧺' },
    Wellness: { emoji: '🌿' },
    Food:     { emoji: '🍯' },
    Pottery:  { emoji: '🫙' }
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
    const config = DETAIL_CATEGORY_CONFIG[product.category] || { emoji: '🎁' };
    document.title = `Selwa — ${product.name}`;

    const mainImg = document.getElementById('main-img');
    if (mainImg) {
        if (product.image_url) {
            mainImg.innerHTML = `<img src="${product.image_url}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" />`;
        } else {
            mainImg.textContent = config.emoji;
        }
    }

    document.querySelectorAll('.thumb').forEach((thumb) => {
        if (product.image_url) {
            thumb.style.backgroundImage = `url('${product.image_url}')`;
            thumb.style.backgroundSize = 'cover';
            thumb.style.backgroundPosition = 'center';
            thumb.textContent = '';
        } else {
            thumb.textContent = config.emoji;
        }
    });

    setText('detail-title', product.name);
    setText('detail-breadcrumb', product.name);
    setText('detail-price', detailFormatPrice(product.price));
    setText('detail-category', `${product.category} · ${product.region || 'Bhutan'}`);
    setText('detail-materials', product.materials || 'Natural materials');
    setText('detail-stock', `${product.stock_quantity} in stock`);
    setText('detail-description', product.description);
    setText('detail-origin', product.region || 'Bhutan');
    setText('detail-spec-materials', product.materials || 'Natural materials');

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
