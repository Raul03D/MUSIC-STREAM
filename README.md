# 🎵 Groovify - Full-Stack Music Streaming Web Application

A modern, high-performance music streaming application inspired by Spotify with sleek dark aesthetics, full-length 160kbps audio streaming, curated genre playlists, album views, in-app history navigation, Web Audio API frequency visualizer, and artist studio features.

---

## ✨ Features

- **🎧 800 Full-Length Songs**:
  - 8 distinct genres (Hindi, Bengali, English, Bollywood, Pop, Lo-Fi, Synthwave, Electronic) with 100 unique, uncut songs each (zero duplicates).
  - High-fidelity 160kbps AAC streaming audio with full durations (3 to 6+ minutes).
- **💿 32 Curated Albums**: 4 themed albums per genre with high-resolution artwork.
- **🎨 Spotify-Grade Dark UI**: Glassmorphic styling, ambient background glow adapting to the playing track, quick picks, and clean typography.
- **🧭 In-App History Navigation**: Custom history stack for seamless `<` (back) and `>` (forward) buttons without leaving the SPA.
- **📊 Real-time Visualizer & Equalizer**: Web Audio API frequency analyser and animated track equalizers.
- **🔍 Dedicated Genre Hubs**: Click any genre card to open a custom playlist page with a "Play All 100 Songs" action.
- **🎙️ Artist Studio**: Upload custom tracks, manage albums, and publish songs.
- **❤️ Liked Songs Library**: Real-time optimistic liking with MongoDB synchronization.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Vanilla CSS Design System, Web Audio API
- **Backend**: Node.js, Express 5, MongoDB / Mongoose, JWT Authentication, Multer, ImageKit
- **Audio Streaming**: High-speed CDN with full CORS support

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure environment variables
Create a `.env` file in the root directory:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ImageKit_PRIVATE_KEY=your_imagekit_private_key
PORT=3000
```

### 3. Run the application
```bash
# Terminal 1 - Backend Server (Port 3000)
npm run dev:backend

# Terminal 2 - Frontend App (Port 5173)
npm run dev:frontend
```

Open `http://localhost:5173` in your browser.

---

## 📜 Scripts
- `npm run dev:backend`: Starts Express backend with nodemon.
- `npm run dev:frontend`: Starts Vite React dev server.
- `npm run build`: Builds the production bundle.
- `node --openssl-legacy-provider scripts/seed_full_length_songs.js`: Seeds 800 full-length tracks into MongoDB.
