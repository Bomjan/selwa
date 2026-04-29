function updateNoResults(visible) {
    const noResults = document.getElementById('no-results');
    if (noResults) noResults.classList.toggle('d-none', visible > 0);
}

function filterArtisans(craft, btn) {
    document.querySelectorAll('.filter-btn').forEach((button) => button.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const cards = document.querySelectorAll('#artisan-grid [data-craft]');
    let visible = 0;
    cards.forEach((card) => {
        const match = craft === 'all' || card.dataset.craft === craft;
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });

    updateNoResults(visible);
}

function searchArtisans() {
    const input = document.getElementById('artisan-search');
    const query = input ? input.value.trim().toLowerCase() : '';
    const cards = document.querySelectorAll('#artisan-grid [data-craft]');
    let visible = 0;

    cards.forEach((card) => {
        const text = card.innerText.toLowerCase();
        const match = text.includes(query);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });

    document.querySelectorAll('.filter-btn').forEach((button) => button.classList.remove('active'));
    updateNoResults(visible);
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('artisan-search');
    if (!input) return;

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') searchArtisans();
    });
});
