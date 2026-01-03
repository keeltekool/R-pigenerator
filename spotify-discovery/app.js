// ============================================
// GENRE BROWSER - Find Spotify Playlists
// 6,291 genres from genres.json
// ============================================

// State
let allGenres = [];
let filteredGenres = [];
let displayedCount = 0;
const BATCH_SIZE = 200; // Load 200 genres at a time

// DOM Elements
const elements = {
    searchInput: document.getElementById('search-input'),
    matchCount: document.getElementById('match-count'),
    alphabetFilter: document.getElementById('alphabet-filter'),
    loadingSection: document.getElementById('loading-section'),
    genresSection: document.getElementById('genres-section'),
    genresGrid: document.getElementById('genres-grid'),
    loadMoreContainer: document.getElementById('load-more-container'),
    loadMoreBtn: document.getElementById('load-more-btn'),
    noResults: document.getElementById('no-results')
};

// Current filters
let currentSearch = '';
let currentLetter = 'all';

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Load genres
    try {
        const response = await fetch('genres.json');
        allGenres = await response.json();
        filteredGenres = [...allGenres];

        elements.loadingSection.classList.add('hidden');
        elements.genresSection.classList.remove('hidden');

        renderGenres();
        updateMatchCount();
    } catch (error) {
        console.error('Error loading genres:', error);
        elements.loadingSection.innerHTML = '<p>Error loading genres. Please refresh.</p>';
    }

    // Search input with debounce
    let searchTimeout;
    elements.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = elements.searchInput.value.toLowerCase().trim();
            applyFilters();
        }, 150);
    });

    // Alphabet filter
    elements.alphabetFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('letter-btn')) {
            // Update active state
            document.querySelectorAll('.letter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            currentLetter = e.target.dataset.letter;
            applyFilters();
        }
    });

    // Load more button
    elements.loadMoreBtn.addEventListener('click', () => {
        renderMoreGenres();
    });
});

// ============================================
// Filtering
// ============================================

function applyFilters() {
    filteredGenres = allGenres.filter(genre => {
        // Search filter
        if (currentSearch && !genre.toLowerCase().includes(currentSearch)) {
            return false;
        }

        // Letter filter
        if (currentLetter !== 'all') {
            const firstChar = genre.charAt(0).toLowerCase();
            if (currentLetter === '#') {
                // Non-letter characters (numbers, symbols)
                if (/[a-z]/i.test(firstChar)) return false;
            } else {
                if (firstChar !== currentLetter) return false;
            }
        }

        return true;
    });

    displayedCount = 0;
    elements.genresGrid.innerHTML = '';
    renderGenres();
    updateMatchCount();
}

// ============================================
// Rendering
// ============================================

function renderGenres() {
    if (filteredGenres.length === 0) {
        elements.genresSection.classList.add('hidden');
        elements.noResults.classList.remove('hidden');
        return;
    }

    elements.noResults.classList.add('hidden');
    elements.genresSection.classList.remove('hidden');

    renderMoreGenres();
}

function renderMoreGenres() {
    const endIndex = Math.min(displayedCount + BATCH_SIZE, filteredGenres.length);
    const genresToRender = filteredGenres.slice(displayedCount, endIndex);

    const fragment = document.createDocumentFragment();

    genresToRender.forEach(genre => {
        const tag = document.createElement('a');
        tag.className = 'genre-tag';
        tag.textContent = genre;
        tag.href = getSpotifySearchUrl(genre);
        tag.target = '_blank';
        tag.rel = 'noopener noreferrer';
        fragment.appendChild(tag);
    });

    elements.genresGrid.appendChild(fragment);
    displayedCount = endIndex;

    // Show/hide load more button
    if (displayedCount < filteredGenres.length) {
        elements.loadMoreContainer.classList.remove('hidden');
        elements.loadMoreBtn.textContent = `Load More (${filteredGenres.length - displayedCount} remaining)`;
    } else {
        elements.loadMoreContainer.classList.add('hidden');
    }
}

function updateMatchCount() {
    const count = filteredGenres.length;
    const total = allGenres.length;

    if (currentSearch || currentLetter !== 'all') {
        elements.matchCount.textContent = `${count.toLocaleString()} of ${total.toLocaleString()}`;
    } else {
        elements.matchCount.textContent = `${total.toLocaleString()} genres`;
    }
}

// ============================================
// Spotify URL
// ============================================

function getSpotifySearchUrl(genre) {
    const query = encodeURIComponent(genre);
    return `https://open.spotify.com/search/${query}/playlists`;
}
