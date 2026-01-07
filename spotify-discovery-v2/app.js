// ============================================
// ARTIST BROWSER - Hierarchical View
// 34 Genres → 5,819 Artists
// ============================================

// Data
let genreHierarchy = {};
let allArtistsFlat = []; // For search: [{artist, genre}, ...]

// DOM Elements
const elements = {
    searchInput: document.getElementById('search-input'),
    matchCount: document.getElementById('match-count'),
    loadingSection: document.getElementById('loading-section'),
    mainGenresSection: document.getElementById('main-genres-section'),
    mainGenresGrid: document.getElementById('main-genres-grid'),
    artistsSection: document.getElementById('artists-section'),
    artistsTitle: document.getElementById('artists-title'),
    artistsCount: document.getElementById('artists-count'),
    artistsGrid: document.getElementById('artists-grid'),
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
        const response = await fetch('artists_hierarchy.json');
        genreHierarchy = await response.json();

        // Build flat list for search
        for (const [genre, artists] of Object.entries(genreHierarchy)) {
            for (const artist of artists) {
                allArtistsFlat.push({ artist, genre });
            }
        }

        elements.loadingSection.classList.add('hidden');
        renderMainGenres();

    } catch (error) {
        console.error('Error loading artists:', error);
        elements.loadingSection.innerHTML = '<p>Error loading artists. Please refresh.</p>';
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
    const mainGenres = Object.keys(genreHierarchy).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    elements.mainGenresGrid.innerHTML = mainGenres.map(genre => {
        const count = genreHierarchy[genre].length;
        return `
            <div class="main-genre-card" data-genre="${escapeHtml(genre)}">
                <div class="main-genre-name">${escapeHtml(genre)}</div>
                <div class="main-genre-count">${count} artists</div>
                <span class="main-genre-arrow">&rarr;</span>
            </div>
        `;
    }).join('');

    // Click handlers
    elements.mainGenresGrid.querySelectorAll('.main-genre-card').forEach(card => {
        card.addEventListener('click', () => {
            const genre = card.dataset.genre;
            showArtists(genre);
        });
    });

    elements.mainGenresSection.classList.remove('hidden');
    elements.artistsSection.classList.add('hidden');
    elements.searchResultsSection.classList.add('hidden');
    elements.matchCount.textContent = '';
}

// ============================================
// Show Artists (When Genre Clicked)
// ============================================

function showArtists(genre) {
    const artists = genreHierarchy[genre] || [];

    elements.artistsTitle.textContent = genre;
    elements.artistsCount.textContent = `${artists.length} artists`;

    elements.artistsGrid.innerHTML = artists.map(artist => `
        <a class="artist-tag" href="${getSpotifyUrl(artist)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(artist)}
        </a>
    `).join('');

    elements.mainGenresSection.classList.add('hidden');
    elements.searchResultsSection.classList.add('hidden');
    elements.artistsSection.classList.remove('hidden');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Show Main Genres (Back Button)
// ============================================

function showMainGenres() {
    elements.artistsSection.classList.add('hidden');
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

    // Search all artists
    const results = allArtistsFlat.filter(item =>
        item.artist.toLowerCase().includes(query)
    );

    elements.matchCount.textContent = `${results.length} found`;

    if (results.length === 0) {
        elements.searchResultsGrid.innerHTML = '<p style="color: var(--text-muted);">No artists found. Try a different search.</p>';
    } else {
        // Limit to 200 results for performance
        const limited = results.slice(0, 200);

        elements.searchResultsGrid.innerHTML = limited.map(item => {
            // Highlight matching text
            const highlighted = highlightMatch(item.artist, query);
            return `
                <a class="artist-tag" href="${getSpotifyUrl(item.artist)}" target="_blank" rel="noopener noreferrer">
                    ${highlighted}
                    <span class="genre-badge">${escapeHtml(item.genre)}</span>
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
    elements.artistsSection.classList.add('hidden');
    elements.searchResultsSection.classList.remove('hidden');
}

// ============================================
// Helpers
// ============================================

function getSpotifyUrl(artist) {
    return `https://open.spotify.com/search/${encodeURIComponent(artist)}/playlists`;
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
