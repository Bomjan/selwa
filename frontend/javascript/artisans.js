// ── Indicator ─────────────────────────────────────────────────────────────────

function moveAfIndicator(tag) {
  const indicator = document.getElementById('af-indicator');
  const strip     = document.getElementById('af-tags');
  if (!indicator || !strip || !tag) return;
  const tagRect   = tag.getBoundingClientRect();
  const stripRect = strip.getBoundingClientRect();
  indicator.style.left  = (tagRect.left - stripRect.left + strip.scrollLeft) + 'px';
  indicator.style.width = tagRect.width + 'px';
}

// ── Select a tag ──────────────────────────────────────────────────────────────

function selectAfTag(tag) {
  document.querySelectorAll('.af-tag').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  tag.classList.add('active');
  tag.setAttribute('aria-selected', 'true');
  moveAfIndicator(tag);
  filterArtisans(tag.dataset.craft);
}

// ── Filter ────────────────────────────────────────────────────────────────────

function filterArtisans(craft) {
  const grid    = document.getElementById('artisan-grid');
  const empty   = document.getElementById('af-empty');
  const countEl = document.getElementById('artisan-count');
  if (!grid) return;

  const all    = Array.from(grid.querySelectorAll('.artisan-card'));
  const toShow = all.filter(c => !craft || c.dataset.craft === craft);
  const toHide = all.filter(c => craft && c.dataset.craft !== craft);

  const leavers = all.filter(c => c.style.display !== 'none' && toHide.includes(c));

  leavers.forEach((card, i) => {
    card.style.transition = `opacity .18s ${i * 20}ms ease`;
    card.style.opacity    = '0';
    card.style.pointerEvents = 'none';
  });

  const delay = leavers.length > 0 ? 220 : 0;

  setTimeout(() => {
    toHide.forEach(card => {
      card.style.display = 'none';
      card.style.opacity = '';
      card.style.transition = '';
      card.style.pointerEvents = '';
    });

    toShow.forEach((card, i) => {
      card.style.display = '';
      card.style.opacity = '0';
      card.style.transition = 'none';
      card.style.pointerEvents = '';
      requestAnimationFrame(() => {
        setTimeout(() => {
          card.style.transition = `opacity .35s ease`;
          card.style.opacity    = '1';
        }, i * 60);
      });
    });

    setTimeout(() => {
      toShow.forEach(card => {
        card.style.transition = '';
        card.style.opacity    = '';
      });
    }, toShow.length * 60 + 400);

    const n = toShow.length;
    if (countEl) countEl.textContent = `${n} artisan${n !== 1 ? 's' : ''}`;
    if (empty) empty.style.display = n === 0 ? 'block' : 'none';
  }, delay);
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const tags = document.querySelectorAll('.af-tag');

  tags.forEach(tag => tag.addEventListener('click', () => selectAfTag(tag)));

  requestAnimationFrame(() => {
    const active = document.querySelector('.af-tag.active');
    if (active) moveAfIndicator(active);
  });

  window.addEventListener('resize', () => {
    const active = document.querySelector('.af-tag.active');
    if (active) moveAfIndicator(active);
  }, { passive: true });
});
