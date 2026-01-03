// ============================================
// PLAYLIST DISCOVERY - Deezer API
// Find real curated playlists
// ============================================

// Deezer API - NO API KEY NEEDED!
const DEEZER_API = 'https://api.deezer.com';
// CORS proxy for browser requests
const CORS_PROXY = 'https://corsproxy.io/?';

// ============================================
// DOM Elements
// ============================================

const elements = {
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    quickTags: document.querySelectorAll('.quick-tag'),
    loadingSection: document.getElementById('loading-section'),
    loadingText: document.getElementById('loading-text'),
    resultsSection: document.getElementById('results-section'),
    searchQuery: document.getElementById('search-query'),
    resultsCount: document.getElementById('results-count'),
    playlistsGrid: document.getElementById('playlists-grid'),
    errorSection: document.getElementById('error-section'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    inputSection: document.getElementById('input-section')
};

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    elements.retryBtn.addEventListener('click', resetUI);

    // Quick tag clicks
    elements.quickTags.forEach(tag => {
        tag.addEventListener('click', () => {
            elements.searchInput.value = tag.dataset.query;
            handleSearch();
        });
    });
});

// ============================================
// API Call
// ============================================

async function searchPlaylists(query) {
    const url = `${CORS_PROXY}${encodeURIComponent(`${DEEZER_API}/search/playlist?q=${encodeURIComponent(query)}&limit=25`)}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch playlists');
    }

    const data = await response.json();
    return data.data || [];
}

// ============================================
// Main Search
// ============================================

async function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    showLoading();

    try {
        const playlists = await searchPlaylists(query);

        if (playlists.length === 0) {
            showError('No playlists found. Try a different search term.');
            return;
        }

        displayPlaylists(query, playlists);

    } catch (error) {
        console.error('Error:', error);
        showError('Failed to search playlists. Please try again.');
    }
}

// ============================================
// Display Playlists
// ============================================

function displayPlaylists(query, playlists) {
    elements.searchQuery.textContent = query;
    elements.resultsCount.textContent = `${playlists.length} playlists found`;

    elements.playlistsGrid.innerHTML = playlists.map(playlist => {
        const spotifySearch = encodeURIComponent(playlist.title);
        const youtubeSearch = encodeURIComponent(playlist.title + ' playlist');

        return `
            <div class="playlist-card">
                <div class="playlist-cover">
                    <img src="${playlist.picture_big || playlist.picture_medium || playlist.picture}"
                         alt="${escapeHtml(playlist.title)}"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231a1a1a%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2230%22>♪</text></svg>'">
                    <div class="playlist-overlay">
                        <a class="play-on-deezer" href="${playlist.link}" target="_blank">
                            Play on Deezer
                        </a>
                    </div>
                </div>
                <div class="playlist-info">
                    <div class="playlist-title" title="${escapeHtml(playlist.title)}">${escapeHtml(playlist.title)}</div>
                    <div class="playlist-meta">
                        <span class="playlist-tracks">${playlist.nb_tracks} tracks</span>
                        <span class="playlist-creator">by ${escapeHtml(playlist.user?.name || 'Deezer')}</span>
                    </div>
                    <div class="platform-links">
                        <a class="platform-link spotify"
                           href="https://open.spotify.com/search/${spotifySearch}/playlists"
                           target="_blank">
                            Find on Spotify
                        </a>
                        <a class="platform-link youtube"
                           href="https://www.youtube.com/results?search_query=${youtubeSearch}&sp=EgIQAw%253D%253D"
                           target="_blank">
                            Find on YouTube
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    hideLoading();
    elements.resultsSection.classList.remove('hidden');
    elements.errorSection.classList.add('hidden');
}

// ============================================
// Helpers
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// UI Helpers
// ============================================

function showLoading() {
    elements.loadingSection.classList.remove('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.errorSection.classList.add('hidden');
}

function hideLoading() {
    elements.loadingSection.classList.add('hidden');
}

function showError(message) {
    hideLoading();
    elements.errorMessage.textContent = message;
    elements.errorSection.classList.remove('hidden');
    elements.resultsSection.classList.add('hidden');
}

function resetUI() {
    elements.errorSection.classList.add('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.searchInput.value = '';
    elements.searchInput.focus();
}
