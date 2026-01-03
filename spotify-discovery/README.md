# Spotify Music Discovery

Discover new music based on your playlist's genres. Paste any public Spotify playlist URL, and get personalized recommendations you can save directly to your Spotify account.

## Features

- **Genre Analysis**: Extracts and displays the top genres from your playlist
- **Smart Recommendations**: Finds new tracks based on your genre preferences
- **Save to Spotify**: One-click save to create a new playlist in your account
- **Preview Tracks**: Listen to 30-second previews before saving
- **No Backend Required**: Runs entirely in the browser

## Setup Instructions

### Step 1: Create a Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **Create App**
4. Fill in:
   - **App name**: Music Discovery (or anything)
   - **App description**: Personal music discovery tool
   - **Redirect URI**: Add your URL (see below)
5. Check the **Web API** checkbox
6. Accept the terms and click **Save**

### Step 2: Configure Redirect URI

Add one of these redirect URIs in your Spotify app settings:

**For local development (VS Code Live Server):**
```
http://127.0.0.1:5500/spotify-discovery/index.html
```

**For GitHub Pages:**
```
https://YOUR-USERNAME.github.io/YOUR-REPO/spotify-discovery/index.html
```

### Step 3: Get Your Client ID

1. In your Spotify app dashboard, click **Settings**
2. Copy your **Client ID**

### Step 4: Update the Code

Open `app.js` and update these lines at the top:

```javascript
const CONFIG = {
    clientId: 'YOUR_CLIENT_ID_HERE',  // <-- Paste your Client ID
    // ...
};

const DEMO_MODE = false;  // <-- Change to false
```

### Step 5: Run the App

**Option A - VS Code Live Server (Recommended):**
1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` → Open with Live Server
3. The app opens at `http://127.0.0.1:5500/...`

**Option B - Any local server:**
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

**Option C - GitHub Pages:**
1. Push to GitHub
2. Go to repo Settings → Pages
3. Enable GitHub Pages from main branch
4. Update redirect URI in Spotify dashboard

## How It Works

1. **Paste Playlist URL**: Enter any public Spotify playlist link
2. **Login**: Click "Connect with Spotify" to authorize
3. **Analysis**: The app fetches all tracks and extracts artist genres
4. **Recommendations**: Searches for new tracks in your top genres
5. **Save**: Creates a new playlist in your Spotify account

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /playlists/{id}` | Get playlist info |
| `GET /playlists/{id}/tracks` | Get all tracks |
| `GET /artists` | Get artist genres |
| `GET /search` | Find tracks by genre |
| `GET /artists/{id}/top-tracks` | Get popular tracks |
| `POST /users/{id}/playlists` | Create new playlist |
| `POST /playlists/{id}/tracks` | Add tracks to playlist |

## Limitations

- **Development Mode**: New Spotify apps are limited to 25 users
- **Public Playlists Only**: Can't analyze private playlists without owner login
- **No Audio Features**: Spotify removed this endpoint for new apps (Nov 2024)
- **Genre-Based Only**: Recommendations use genres, not audio analysis

## Troubleshooting

**"Invalid redirect URI" error:**
- Make sure the URL in your browser EXACTLY matches what's in Spotify dashboard
- Include the full path with `/index.html`

**"Could not access playlist" error:**
- The playlist must be public
- Check the URL is correct

**No recommendations showing:**
- Some niche genres may have limited results
- Try a playlist with more mainstream artists

## Tech Stack

- Pure HTML/CSS/JavaScript (no frameworks)
- Spotify Web API
- OAuth 2.0 Implicit Grant flow

## License

MIT - Use freely for personal projects.
