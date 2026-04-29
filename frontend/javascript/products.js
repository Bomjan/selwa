// products.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const categoryQuery = urlParams.get('category');
    
    if (searchQuery || categoryQuery) {
        filterProducts(searchQuery, categoryQuery);
    }
});

function filterProducts(searchQuery, categoryQuery) {
    const q = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const cat = categoryQuery ? categoryQuery.toLowerCase().trim() : '';
    
    const products = document.querySelectorAll('.product-item');
    let visibleCount = 0;
    
    products.forEach(product => {
        const titleElement = product.querySelector('.fw-semibold.small.mb-1');
        const productCategory = product.getAttribute('data-category') || '';
        
        let matchesSearch = true;
        let matchesCategory = true;
        
        if (q && titleElement) {
            matchesSearch = titleElement.textContent.toLowerCase().includes(q);
        }
        
        if (cat) {
            matchesCategory = productCategory === cat;
        }
        
        if (matchesSearch && matchesCategory) {
            product.style.display = '';
            visibleCount++;
        } else {
            product.style.display = 'none';
        }
    });
    
    // Update the showing count
    const countElement = document.getElementById('product-count');
    if (countElement) {
        let text = `Showing ${visibleCount} product${visibleCount !== 1 ? 's' : ''}`;
        if (q) {
            text += ` for "${searchQuery}"`;
        }
        countElement.textContent = text;
    }
    
    // Update active filter badges
    const badgesContainer = document.querySelector('.d-flex.gap-2.flex-wrap.mb-3');
    if (badgesContainer) {
        badgesContainer.innerHTML = ''; // clear mock badges
        if (q) {
            const span = document.createElement('span');
            span.className = 'badge badge-popular px-2 py-1';
            span.innerHTML = `Search: ${searchQuery} &times;`;
            span.onclick = () => { window.location.href = 'products.html' };
            span.style.cursor = 'pointer';
            badgesContainer.appendChild(span);
        }
        if (cat) {
            const span = document.createElement('span');
            span.className = 'badge badge-popular px-2 py-1';
            span.innerHTML = `Category: ${categoryQuery} &times;`;
            span.onclick = () => { window.location.href = 'products.html' };
            span.style.cursor = 'pointer';
            badgesContainer.appendChild(span);
        }
    }
}

/* ── handleSort(value)
   Called when the sort dropdown changes. ── */
function handleSort(value) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    const products = Array.from(grid.querySelectorAll('.product-item'));
    
    if (value.includes('Low to high')) {
        products.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (value.includes('High to low')) {
        products.sort((a, b) => getPrice(b) - getPrice(a));
    }
    
    products.forEach(p => grid.appendChild(p));
}

function getPrice(productEl) {
    const priceText = productEl.querySelector('.product-price').textContent;
    return parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
}