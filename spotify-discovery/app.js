// ============================================
// MUSIC DISCOVERY - Last.fm API
// ============================================

const API_KEY = '9ed41078f8f32b59097f8ccc3eccd9a3';
const API_BASE = 'https://ws.audioscrobbler.com/2.0/';

// ============================================
// DOM Elements
// ============================================

const elements = {
    artistInput: document.getElementById('artist-input'),
    searchBtn: document.getElementById('search-btn'),
    suggestions: document.getElementById('suggestions'),
    loadingSection: document.getElementById('loading-section'),
    loadingText: document.getElementById('loading-text'),
    artistSection: document.getElementById('artist-section'),
    artistImage: document.getElementById('artist-image'),
    artistName: document.getElementById('artist-name'),
    artistListeners: document.getElementById('artist-listeners'),
    artistTags: document.getElementById('artist-tags'),
    similarSection: document.getElementById('similar-section'),
    similarArtists: document.getElementById('similar-artists'),
    tracksSection: document.getElementById('tracks-section'),
    tracksList: document.getElementById('tracks-list'),
    errorSection: document.getElementById('error-section'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    inputSection: document.getElementById('input-section')
};

// ============================================
// State
// ============================================

let searchTimeout = null;

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.artistInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    elements.artistInput.addEventListener('input', handleInputChange);
    elements.retryBtn.addEventListener('click', resetUI);

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#input-section')) {
            elements.suggestions.classList.add('hidden');
        }
    });
});

// ============================================
// API Calls
// ============================================

async function apiCall(method, params = {}) {
    const url = new URL(API_BASE);
    url.searchParams.append('method', method);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('format', 'json');

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('API request failed');
    }

    const data = await response.json();
    if (data.error) {
        throw new Error(data.message || 'API error');
    }

    return data;
}

async function searchArtists(query) {
    const data = await apiCall('artist.search', { artist: query, limit: 5 });
    return data.results?.artistmatches?.artist || [];
}

async function getArtistInfo(artist) {
    const data = await apiCall('artist.getinfo', { artist, autocorrect: 1 });
    return data.artist;
}

async function getSimilarArtists(artist) {
    const data = await apiCall('artist.getsimilar', { artist, limit: 12, autocorrect: 1 });
    return data.similarartists?.artist || [];
}

async function getArtistTopTracks(artist) {
    const data = await apiCall('artist.gettoptracks', { artist, limit: 5, autocorrect: 1 });
    return data.toptracks?.track || [];
}

// ============================================
// Search & Autocomplete
// ============================================

function handleInputChange() {
    clearTimeout(searchTimeout);
    const query = elements.artistInput.value.trim();

    if (query.length < 2) {
        elements.suggestions.classList.add('hidden');
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const artists = await searchArtists(query);
            displaySuggestions(artists);
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

function displaySuggestions(artists) {
    if (!artists.length) {
        elements.suggestions.classList.add('hidden');
        return;
    }

    elements.suggestions.innerHTML = artists.map(artist => `
        <div class="suggestion-item" data-name="${escapeHtml(artist.name)}">
            <img src="${getArtistImage(artist)}" alt="${escapeHtml(artist.name)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231f1f1f%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%235a5a5a%22 font-size=%2240%22>?</text></svg>'">
            <div>
                <div class="name">${escapeHtml(artist.name)}</div>
                <div class="listeners">${formatNumber(artist.listeners)} listeners</div>
            </div>
        </div>
    `).join('');

    elements.suggestions.classList.remove('hidden');

    // Add click handlers
    elements.suggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            elements.artistInput.value = item.dataset.name;
            elements.suggestions.classList.add('hidden');
            handleSearch();
        });
    });
}

// ============================================
// Main Search
// ============================================

async function handleSearch() {
    const query = elements.artistInput.value.trim();
    if (!query) return;

    elements.suggestions.classList.add('hidden');
    showLoading('Finding artist info...');

    try {
        // Get artist info
        const artistInfo = await getArtistInfo(query);
        displayArtist(artistInfo);

        showLoading('Finding similar artists...');

        // Get similar artists
        const similar = await getSimilarArtists(query);
        displaySimilarArtists(similar);

        showLoading('Getting top tracks...');

        // Get top tracks from similar artists
        const tracks = await getTopTracksFromSimilar(similar.slice(0, 6));
        displayTracks(tracks);

        hideLoading();

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Artist not found. Please try another name.');
    }
}

async function getTopTracksFromSimilar(artists) {
    const allTracks = [];

    for (const artist of artists) {
        try {
            const tracks = await getArtistTopTracks(artist.name);
            // Add artist info to each track
            tracks.forEach(track => {
                track.artistInfo = artist;
            });
            allTracks.push(...tracks.slice(0, 3));
        } catch (error) {
            console.error(`Error getting tracks for ${artist.name}:`, error);
        }
    }

    // Shuffle and return
    return shuffleArray(allTracks).slice(0, 15);
}

// ============================================
// Display Functions
// ============================================

function displayArtist(artist) {
    elements.artistImage.src = getLargeImage(artist.image);
    elements.artistImage.onerror = () => {
        elements.artistImage.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231f1f1f%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%235a5a5a%22 font-size=%2240%22>?</text></svg>';
    };
    elements.artistName.textContent = artist.name;
    elements.artistListeners.textContent = `${formatNumber(artist.stats?.listeners || 0)} listeners`;

    // Tags
    const tags = artist.tags?.tag || [];
    elements.artistTags.innerHTML = tags.slice(0, 5).map(tag =>
        `<span class="tag">${escapeHtml(tag.name)}</span>`
    ).join('');

    elements.artistSection.classList.remove('hidden');
}

function displaySimilarArtists(artists) {
    if (!artists.length) {
        elements.similarSection.classList.add('hidden');
        return;
    }

    elements.similarArtists.innerHTML = artists.map(artist => `
        <div class="similar-artist" data-name="${escapeHtml(artist.name)}">
            <img src="${getLargeImage(artist.image)}" alt="${escapeHtml(artist.name)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231f1f1f%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%235a5a5a%22 font-size=%2240%22>?</text></svg>'">
            <div class="name">${escapeHtml(artist.name)}</div>
            <div class="match">${Math.round(parseFloat(artist.match) * 100)}% match</div>
        </div>
    `).join('');

    elements.similarSection.classList.remove('hidden');

    // Add click handlers to explore similar artists
    elements.similarArtists.querySelectorAll('.similar-artist').forEach(item => {
        item.addEventListener('click', () => {
            elements.artistInput.value = item.dataset.name;
            handleSearch();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

function displayTracks(tracks) {
    if (!tracks.length) {
        elements.tracksSection.classList.add('hidden');
        return;
    }

    elements.tracksList.innerHTML = tracks.map(track => {
        const trackImage = getLargeImage(track.image) || getLargeImage(track.artistInfo?.image);
        const spotifySearch = encodeURIComponent(`${track.name} ${track.artist.name}`);
        const youtubeSearch = encodeURIComponent(`${track.name} ${track.artist.name}`);

        return `
            <div class="track-item">
                <img class="track-image" src="${trackImage}" alt="${escapeHtml(track.name)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231f1f1f%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%235a5a5a%22 font-size=%2230%22>♪</text></svg>'">
                <div class="track-info">
                    <div class="track-name">${escapeHtml(track.name)}</div>
                    <div class="track-artist">${escapeHtml(track.artist.name)}</div>
                </div>
                <span class="playcount">${formatNumber(track.playcount)} plays</span>
                <div class="track-actions">
                    <a class="track-link spotify" href="https://open.spotify.com/search/${spotifySearch}" target="_blank">
                        Spotify
                    </a>
                    <a class="track-link youtube" href="https://music.youtube.com/search?q=${youtubeSearch}" target="_blank">
                        YouTube
                    </a>
                </div>
            </div>
        `;
    }).join('');

    elements.tracksSection.classList.remove('hidden');
}

// ============================================
// Helpers
// ============================================

function getArtistImage(artist) {
    if (!artist.image) return '';
    const img = artist.image.find(i => i.size === 'medium') || artist.image[0];
    return img?.['#text'] || '';
}

function getLargeImage(images) {
    if (!images) return '';
    const img = images.find(i => i.size === 'extralarge') ||
                images.find(i => i.size === 'large') ||
                images.find(i => i.size === 'medium') ||
                images[0];
    return img?.['#text'] || '';
}

function formatNumber(num) {
    const n = parseInt(num) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================
// UI Helpers
// ============================================

function showLoading(text) {
    elements.loadingText.textContent = text;
    elements.loadingSection.classList.remove('hidden');
    elements.artistSection.classList.add('hidden');
    elements.similarSection.classList.add('hidden');
    elements.tracksSection.classList.add('hidden');
    elements.errorSection.classList.add('hidden');
}

function hideLoading() {
    elements.loadingSection.classList.add('hidden');
}

function showError(message) {
    hideLoading();
    elements.errorMessage.textContent = message;
    elements.errorSection.classList.remove('hidden');
    elements.artistSection.classList.add('hidden');
    elements.similarSection.classList.add('hidden');
    elements.tracksSection.classList.add('hidden');
}

function resetUI() {
    elements.errorSection.classList.add('hidden');
    elements.artistSection.classList.add('hidden');
    elements.similarSection.classList.add('hidden');
    elements.tracksSection.classList.add('hidden');
    elements.artistInput.value = '';
    elements.artistInput.focus();
}
