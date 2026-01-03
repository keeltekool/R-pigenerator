// ============================================
// GENRE BROWSER - Hierarchical View
// 24 Main Genres → 6,291 Subgenres
// ============================================

// Data
let genreHierarchy = {};
let allGenresFlat = []; // For search: [{genre, parent}, ...]

// DOM Elements
const elements = {
    searchInput: document.getElementById('search-input'),
    matchCount: document.getElementById('match-count'),
    loadingSection: document.getElementById('loading-section'),
    mainGenresSection: document.getElementById('main-genres-section'),
    mainGenresGrid: document.getElementById('main-genres-grid'),
    subgenresSection: document.getElementById('subgenres-section'),
    subgenresTitle: document.getElementById('subgenres-title'),
    subgenresCount: document.getElementById('subgenres-count'),
    subgenresGrid: document.getElementById('subgenres-grid'),
    backBtn: document.getElementById('back-btn'),
    searchResultsSection: document.getElementById('search-results-section'),
    searchResultsGrid: document.getElementById('search-results-grid'),
    clearSearchBtn: document.getElementById('clear-search')
};

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('genres_hierarchy.json');
        genreHierarchy = await response.json();

        // Build flat list for search
        for (const [parent, subgenres] of Object.entries(genreHierarchy)) {
            for (const genre of subgenres) {
                allGenresFlat.push({ genre, parent });
            }
        }

        elements.loadingSection.classList.add('hidden');
        renderMainGenres();

    } catch (error) {
        console.error('Error loading genres:', error);
        elements.loadingSection.innerHTML = '<p>Error loading genres. Please refresh.</p>';
    }

    // Search with debounce
    let searchTimeout;
    elements.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 150);
    });

    // Back button
    elements.backBtn.addEventListener('click', showMainGenres);

    // Clear search
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        showMainGenres();
    });
});

// ============================================
// Render Main Genres (Initial View)
// ============================================

function renderMainGenres() {
    const mainGenres = Object.keys(genreHierarchy).sort();

    elements.mainGenresGrid.innerHTML = mainGenres.map(main => {
        const count = genreHierarchy[main].length;
        return `
            <div class="main-genre-card" data-genre="${escapeHtml(main)}">
                <div class="main-genre-name">${escapeHtml(main)}</div>
                <div class="main-genre-count">${count} subgenres</div>
                <span class="main-genre-arrow">&rarr;</span>
            </div>
        `;
    }).join('');

    // Click handlers
    elements.mainGenresGrid.querySelectorAll('.main-genre-card').forEach(card => {
        card.addEventListener('click', () => {
            const mainGenre = card.dataset.genre;
            showSubgenres(mainGenre);
        });
    });

    elements.mainGenresSection.classList.remove('hidden');
    elements.subgenresSection.classList.add('hidden');
    elements.searchResultsSection.classList.add('hidden');
    elements.matchCount.textContent = '';
}

// ============================================
// Show Subgenres (When Main Genre Clicked)
// ============================================

function showSubgenres(mainGenre) {
    const subgenres = genreHierarchy[mainGenre] || [];

    elements.subgenresTitle.textContent = mainGenre;
    elements.subgenresCount.textContent = `${subgenres.length} subgenres`;

    elements.subgenresGrid.innerHTML = subgenres.map(genre => `
        <a class="genre-tag" href="${getSpotifyUrl(genre)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(genre)}
        </a>
    `).join('');

    elements.mainGenresSection.classList.add('hidden');
    elements.searchResultsSection.classList.add('hidden');
    elements.subgenresSection.classList.remove('hidden');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Show Main Genres (Back Button)
// ============================================

function showMainGenres() {
    elements.subgenresSection.classList.add('hidden');
    elements.searchResultsSection.classList.add('hidden');
    elements.mainGenresSection.classList.remove('hidden');
    elements.matchCount.textContent = '';
}

// ============================================
// Search Handler
// ============================================

function handleSearch() {
    const query = elements.searchInput.value.toLowerCase().trim();

    if (!query) {
        showMainGenres();
        return;
    }

    // Search all genres
    const results = allGenresFlat.filter(item =>
        item.genre.toLowerCase().includes(query)
    );

    elements.matchCount.textContent = `${results.length} found`;

    if (results.length === 0) {
        elements.searchResultsGrid.innerHTML = '<p style="color: var(--text-muted);">No genres found. Try a different search.</p>';
    } else {
        // Limit to 200 results for performance
        const limited = results.slice(0, 200);

        elements.searchResultsGrid.innerHTML = limited.map(item => {
            // Highlight matching text
            const highlighted = highlightMatch(item.genre, query);
            return `
                <a class="genre-tag" href="${getSpotifyUrl(item.genre)}" target="_blank" rel="noopener noreferrer">
                    ${highlighted}
                    <span class="parent-badge">${escapeHtml(item.parent)}</span>
                </a>
            `;
        }).join('');

        if (results.length > 200) {
            elements.searchResultsGrid.innerHTML += `
                <p style="color: var(--text-muted); width: 100%; margin-top: 1rem;">
                    Showing first 200 of ${results.length} results. Refine your search for more specific results.
                </p>
            `;
        }
    }

    elements.mainGenresSection.classList.add('hidden');
    elements.subgenresSection.classList.add('hidden');
    elements.searchResultsSection.classList.remove('hidden');
}

// ============================================
// Helpers
// ============================================

function getSpotifyUrl(genre) {
    return `https://open.spotify.com/search/${encodeURIComponent(genre)}/playlists`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightMatch(text, query) {
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
