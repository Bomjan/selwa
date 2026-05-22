function handleSort(value) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.p-card'));

  cards.sort((a, b) => {
    const priceA = parseInt(a.querySelector('.p-card__price').textContent.replace(/[^0-9]/g, ''), 10);
    const priceB = parseInt(b.querySelector('.p-card__price').textContent.replace(/[^0-9]/g, ''), 10);
    if (value.includes('Low')) return priceA - priceB;
    if (value.includes('High')) return priceB - priceA;
    return 0;
  });

  cards.forEach(card => grid.appendChild(card));
}

function applyFilters() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const checked = Array.from(
    document.querySelectorAll('.s-filter-group input[type=checkbox]:checked')
  ).map(cb => cb.dataset.category);

  const cards = grid.querySelectorAll('.p-card');
  let visible = 0;
  cards.forEach(card => {
    const cat = card.dataset.category || '';
    const show = checked.length === 0 || checked.includes(cat);
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  const countEl = document.getElementById('product-count');
  if (countEl) countEl.textContent = `Showing ${visible} products`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Wire up category checkboxes with data-category attributes
  document.querySelectorAll('.s-filter-group input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
});
