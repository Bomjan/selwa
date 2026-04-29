const CAT_EMOJI = {
    Crafts:   '🧺',
    Wellness: '🌿',
    Food:     '🍯',
    Pottery:  '🫙'
};

let currentProducts = [];

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
    } catch {
        return resolveProductsData();
    }
}

function renderProductCard(product) {
    const emoji = CAT_EMOJI[product.category] || '🎁';
    const origin = product.region || 'Bhutan';
    const stockLabel = product.stock_quantity <= 3
        ? `Only ${product.stock_quantity} left`
        : `${product.stock_quantity} in stock`;
    const stockCls = product.stock_quantity <= 3 ? 'pcard-stock low' : 'pcard-stock';
    const artisanName = product.artisan && product.artisan.name ? product.artisan.name : null;

    const imgHtml = product.image_url
        ? `<img src="${product.image_url}" alt="${product.name}" loading="lazy" />`
        : `<span class="pcard-emoji">${emoji}</span>`;

    return `
        <article class="product-item" data-category="${product.category.toLowerCase()}">
            <a class="pcard" href="details.html?id=${product.id}">
                <div class="pcard-img">
                    ${imgHtml}
                    <span class="pcard-tag">${origin}</span>
                </div>
                <div class="pcard-info">
                    <p class="pcard-cat">${product.category}</p>
                    <h3 class="pcard-name">${product.name}</h3>
                    ${artisanName ? `<p class="pcard-maker">by ${artisanName}</p>` : ''}
                    <div class="pcard-foot">
                        <span class="pcard-price">${formatPrice(product.price)}</span>
                        <button class="pcard-add" onclick="addToCart(event)" aria-label="Add to cart">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                    <p class="${stockCls}">${stockLabel}</p>
                </div>
            </a>
        </article>`;
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = products.map(renderProductCard).join('');
}

function updateCount(n, query) {
    const el = document.getElementById('product-count');
    if (!el) return;
    let t = `Showing ${n} product${n !== 1 ? 's' : ''}`;
    if (query) t += ` for "${query}"`;
    el.textContent = t;
}

function updateBadges(searchQuery, catQuery) {
    const box = document.getElementById('filter-badges');
    if (!box) return;
    box.innerHTML = '';
    const make = (label) => {
        const b = document.createElement('button');
        b.className = 'badge badge-stone border-0';
        b.innerHTML = `${label} &times;`;
        b.onclick = () => { window.location.href = 'products.html'; };
        box.appendChild(b);
    };
    if (searchQuery) make(`Search: ${searchQuery}`);
    if (catQuery) make(`Category: ${catQuery}`);
}

function filterProducts(searchQuery, catQuery) {
    const q   = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const cat = catQuery    ? catQuery.toLowerCase().trim()    : '';
    const items = Array.from(document.querySelectorAll('.product-item'));
    let count = 0;
    items.forEach(item => {
        const name = (item.querySelector('.pcard-name') || {}).textContent || '';
        const itemCat = item.getAttribute('data-category') || '';
        const ok = (!q || name.toLowerCase().includes(q)) && (!cat || itemCat === cat);
        item.style.display = ok ? '' : 'none';
        if (ok) count++;
    });
    updateCount(count, searchQuery);
    updateBadges(searchQuery, catQuery);
}

function handleSort(value) {
    const sorted = [...currentProducts];
    if (value.includes('Low to high'))  sorted.sort((a, b) => a.price - b.price);
    if (value.includes('High to low'))  sorted.sort((a, b) => b.price - a.price);
    renderProducts(sorted);
    const p = new URLSearchParams(window.location.search);
    filterProducts(p.get('q'), p.get('category'));
}

async function loadProducts() {
    currentProducts = await fetchProducts();
    renderProducts(currentProducts);
    updateCount(currentProducts.length, '');
    const p = new URLSearchParams(window.location.search);
    filterProducts(p.get('q'), p.get('category'));
}

document.addEventListener('DOMContentLoaded', loadProducts);
