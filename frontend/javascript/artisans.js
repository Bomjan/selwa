// artisans.js

/* ── filterArtisans(craft, btn)
   Shows only cards matching the selected craft category. ── */
function filterArtisans(craft, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const cards = document.querySelectorAll('#artisan-grid [data-craft]');
    let visible = 0;
    cards.forEach(card => {
        const match = craft === 'all' || card.dataset.craft === craft;
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });

    document.getElementById('no-results').classList.toggle('d-none', visible > 0);
}

/* ── searchArtisans()
   Filters cards by name or craft tag text. ── */
function searchArtisans() {
    const query = document.getElementById('artisan-search').value.trim().toLowerCase();
    const cards = document.querySelectorAll('#artisan-grid [data-craft]');
    let visible = 0;

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        const match = text.includes(query);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });

    document.getElementById('no-results').classList.toggle('d-none', visible > 0);

    // Reset filter buttons to neutral
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
}

// Allow Enter key to trigger search
document.getElementById('artisan-search').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') searchArtisans();
});