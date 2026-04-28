const CATEGORY_CONFIG = {
    Textiles: { emoji: '🧵', bg: 'linear-gradient(145deg, #f0e1c8, #fdf6eb)', badgeClass: 'badge-popular' },
    Woodcraft: { emoji: '🪵', bg: 'linear-gradient(145deg, #ebeadf, #faf8f2)', badgeClass: 'badge-new' },
    Jewellery: { emoji: '📿', bg: 'linear-gradient(145deg, #efe6f8, #faf7fe)', badgeClass: 'badge-popular' },
    Pottery: { emoji: '🫙', bg: 'linear-gradient(145deg, #f6e6de, #fff7f1)', badgeClass: 'badge-new' },
    Paintings: { emoji: '🖼️', bg: 'linear-gradient(145deg, #eee7da, #faf6ef)', badgeClass: 'badge-popular' }
};

let currentProducts = [];

function getCategoryConfig(category) {
    return CATEGORY_CONFIG[category] || { emoji: '🎁', bg: 'linear-gradient(145deg, #efe8de, #faf6f0)', badgeClass: 'badge-popular' };
}

function formatPrice(price) {
    return 'Nu. ' + Math.round(price).toLocaleString('en-IN');
}

function resolveProductsData() {
    return Array.isArray(window.SELWA_DEMO_PRODUCTS) ? window.SELWA_DEMO_PRODUCTS : [];
}

async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('server error');
        return await res.json();
    } catch (err) {
        return resolveProductsData();
    }
}

function renderProductCard(product) {
    const config = getCategoryConfig(product.category);
    const artisanLine = product.artisan && product.artisan.name
        ? `${product.artisan.name} · ${product.artisan.location}`
        : product.region || product.category;

    return `
        <article class="product-item" data-category="${product.category.toLowerCase()}">
            <a href="details.html?id=${product.id}" class="product-card">
                <div class="product-card__art" style="background:${config.bg}">
                    <span>${config.emoji}</span>
                </div>
                <div class="product-card__body">
                    <div class="cluster">
                        <span class="${config.badgeClass}">${product.category}</span>
                        <span class="tag">${product.region || 'Bhutan'}</span>
                    </div>
                    <h3 class="mt-3 mb-1 fw-semibold">${product.name}</h3>
                    <p class="product-meta mb-2">${artisanLine}</p>
                    <div class="stars mb-3">★★★★★</div>
                    <div class="product-card__footer">
                        <span class="product-price">${formatPrice(product.price)}</span>
                        <button class="button button-primary" onclick="addToCart(event)">Add</button>
                    </div>
                </div>
            </a>
        </article>
    `;
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = products.map(renderProductCard).join('');
}

function updateCount(visibleCount, query) {
    const countEl = document.getElementById('product-count');
    if (!countEl) return;
    let text = `Showing ${visibleCount} product${visibleCount !== 1 ? 's' : ''}`;
    if (query) text += ` for "${query}"`;
    countEl.textContent = text;
}

function updateBadges(searchQuery, categoryQuery) {
    const badgesContainer = document.getElementById('filter-badges');
    if (!badgesContainer) return;
    badgesContainer.innerHTML = '';

    if (searchQuery) {
        const badge = document.createElement('button');
        badge.className = 'badge-soft border-0';
        badge.innerHTML = `Search: ${searchQuery} &times;`;
        badge.onclick = () => { window.location.href = 'products.html'; };
        badgesContainer.appendChild(badge);
    }

    if (categoryQuery) {
        const badge = document.createElement('button');
        badge.className = 'badge-soft border-0';
        badge.innerHTML = `Category: ${categoryQuery} &times;`;
        badge.onclick = () => { window.location.href = 'products.html'; };
        badgesContainer.appendChild(badge);
    }
}

function filterProducts(searchQuery, categoryQuery) {
    const q = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const cat = categoryQuery ? categoryQuery.toLowerCase().trim() : '';

    const items = Array.from(document.querySelectorAll('.product-item'));
    let visibleCount = 0;

    items.forEach((item) => {
        const titleEl = item.querySelector('h3');
        const productCat = item.getAttribute('data-category') || '';
        const matchesSearch = !q || (titleEl && titleEl.textContent.toLowerCase().includes(q));
        const matchesCat = !cat || productCat === cat;
        const visible = matchesSearch && matchesCat;
        item.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });

    updateCount(visibleCount, searchQuery);
    updateBadges(searchQuery, categoryQuery);
}

function handleSort(value) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const sorted = [...currentProducts];
    if (value.includes('Low to high')) {
        sorted.sort((a, b) => a.price - b.price);
    } else if (value.includes('High to low')) {
        sorted.sort((a, b) => b.price - a.price);
    } else if (value.includes('Textiles')) {
        sorted.sort((a, b) => a.category.localeCompare(b.category));
    }

    renderProducts(sorted);

    const params = new URLSearchParams(window.location.search);
    filterProducts(params.get('q'), params.get('category'));
}

async function loadProducts() {
    currentProducts = await fetchProducts();
    renderProducts(currentProducts);
    updateCount(currentProducts.length, '');

    const params = new URLSearchParams(window.location.search);
    filterProducts(params.get('q'), params.get('category'));
}

document.addEventListener('DOMContentLoaded', loadProducts);
