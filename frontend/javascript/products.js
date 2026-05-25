// ── Indicator ─────────────────────────────────────────────────────────────────

function moveIndicator(tag) {
  const indicator = document.getElementById('pf-indicator');
  const strip = document.getElementById('pf-tags');
  if (!indicator || !strip || !tag) return;

  const tagRect = tag.getBoundingClientRect();
  const stripRect = strip.getBoundingClientRect();
  const left = tagRect.left - stripRect.left + strip.scrollLeft;

  indicator.style.left  = left + 'px';
  indicator.style.width = tagRect.width + 'px';
}

// ── Select a tag ──────────────────────────────────────────────────────────────

function selectTag(tag) {
  document.querySelectorAll('.pf-tag').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  tag.classList.add('active');
  tag.setAttribute('aria-selected', 'true');
  moveIndicator(tag);
  filterProducts(tag.dataset.category);
}

// ── Filter with animation ─────────────────────────────────────────────────────

function filterProducts(category) {
  const grid = document.getElementById('product-grid');
  const empty = document.getElementById('pf-empty');
  const countEl = document.getElementById('product-count');
  if (!grid) return;

  const all = Array.from(grid.querySelectorAll('.product-item'));
  const toShow = all.filter(c => !category || c.dataset.category === category);
  const toHide = all.filter(c => category && c.dataset.category !== category);

  // Step 1 — fade out items that are leaving
  const currentlyVisible = all.filter(c => c.style.display !== 'none');
  const leavers = currentlyVisible.filter(c => toHide.includes(c));

  leavers.forEach((card, i) => {
    card.style.transition = `opacity .2s ${i * 25}ms ease, transform .2s ${i * 25}ms ease`;
    card.style.opacity = '0';
    card.style.transform = 'translateY(-10px) scale(0.96)';
    card.style.pointerEvents = 'none';
  });

  const delay = leavers.length > 0 ? 240 : 0;

  setTimeout(() => {
    // Hide leavers, reset styles
    toHide.forEach(card => {
      card.style.display = 'none';
      card.style.opacity = '';
      card.style.transform = '';
      card.style.transition = '';
      card.style.pointerEvents = '';
    });

    // Show entrants with stagger
    toShow.forEach((card, i) => {
      card.style.display = '';
      card.style.opacity = '0';
      card.style.transform = 'translateY(18px) scale(0.97)';
      card.style.transition = 'none';
      card.style.pointerEvents = '';

      // Force reflow then animate
      requestAnimationFrame(() => {
        setTimeout(() => {
          card.style.transition = `opacity .38s ease, transform .38s ease`;
          card.style.opacity = '1';
          card.style.transform = '';
        }, i * 75);
      });
    });

    // Clean up after animations settle
    const settleMs = toShow.length * 75 + 420;
    setTimeout(() => {
      toShow.forEach(card => {
        card.style.transition = '';
        card.style.opacity = '';
        card.style.transform = '';
      });
    }, settleMs);

    // Update count
    const n = toShow.length;
    if (countEl) {
      countEl.classList.add('updating');
      setTimeout(() => {
        countEl.textContent = `${n} product${n !== 1 ? 's' : ''}`;
        countEl.classList.remove('updating');
      }, 120);
    }

    // Empty state
    if (empty) empty.style.display = n === 0 ? 'block' : 'none';
    if (grid) grid.style.display = n === 0 ? 'none' : '';

  }, delay);
}

// ── Sort ──────────────────────────────────────────────────────────────────────

function handleSort(value) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const visible = Array.from(grid.querySelectorAll('.product-item')).filter(
    c => c.style.display !== 'none'
  );

  visible.sort((a, b) => {
    const pa = parseInt(a.querySelector('.p-card__price').textContent.replace(/[^0-9]/g, ''), 10);
    const pb = parseInt(b.querySelector('.p-card__price').textContent.replace(/[^0-9]/g, ''), 10);
    if (value === 'asc')  return pa - pb;
    if (value === 'desc') return pb - pa;
    return 0;
  });

  // Animate cards out then back in the new order
  visible.forEach(card => {
    card.style.transition = 'opacity .15s ease, transform .15s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateY(6px)';
  });

  setTimeout(() => {
    visible.forEach((card, i) => {
      grid.appendChild(card);
      setTimeout(() => {
        card.style.transition = 'opacity .3s ease, transform .3s ease';
        card.style.opacity = '1';
        card.style.transform = '';
      }, i * 55);
    });

    setTimeout(() => {
      visible.forEach(card => {
        card.style.transition = '';
        card.style.opacity = '';
        card.style.transform = '';
      });
    }, visible.length * 55 + 350);
  }, 180);
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const tags = document.querySelectorAll('.pf-tag');

  tags.forEach(tag => {
    tag.addEventListener('click', () => selectTag(tag));
  });

  // Position indicator on the initially active tag
  requestAnimationFrame(() => {
    const active = document.querySelector('.pf-tag.active');
    if (active) moveIndicator(active);

    const total = document.querySelectorAll('.product-item').length;
    const countEl = document.getElementById('product-count');
    if (countEl) countEl.textContent = `${total} products`;
  });

  // Recalculate indicator on resize
  window.addEventListener('resize', () => {
    const active = document.querySelector('.pf-tag.active');
    if (active) moveIndicator(active);
  }, { passive: true });

  // URL param pre-select (from category pills on home page)
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('category');
  if (catParam) {
    const tag = document.querySelector(`.pf-tag[data-category="${catParam}"]`);
    if (tag) {
      // Small delay so indicator renders after layout
      requestAnimationFrame(() => selectTag(tag));
    }
  }

  // Sort
  const sortEl = document.getElementById('pf-sort');
  if (sortEl) sortEl.addEventListener('change', () => handleSort(sortEl.value));
});
