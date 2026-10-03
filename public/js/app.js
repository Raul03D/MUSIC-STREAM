/**
 * GROOVIFY - PREMIUM SPOTIFY MUSIC WEB APP
 * High-performance SPA with HTML5 Audio, Web Audio API Visualizer,
 * Real-time Backend Sync, Queue Management, and Dark Aesthetic.
 */

(function () {
  "use strict";

  // Global State
  const state = {
    user: null,
    token: localStorage.getItem("groovify_token") || null,
    currentTrack: null,
    isPlaying: false,
    queue: [],
    queueIndex: -1,
    isShuffle: false,
    isRepeat: "off", // 'off' | 'track' | 'all'
    volume: parseFloat(localStorage.getItem("groovify_volume") || "0.8"),
    isMuted: false,
    currentView: "home",
    currentAlbumId: null,
    feedData: null,
    allTracks: [],
    allAlbums: [],
    likedTracksMap: new Set(),
    history: [{ view: "home", params: {} }],
    historyIndex: 0,
    audioContext: null,
    analyser: null,
    dataArray: null,
  };

  // HTML5 Audio Element
  const audio = new Audio();
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audio.volume = state.volume;

  // DOM Elements Cache
  const DOM = {};

  function initDOMElements() {
    DOM.mainContent = document.getElementById("mainContent");
    DOM.viewContainer = document.getElementById("viewContainer");
    DOM.topBar = document.getElementById("topBar");
    DOM.ambientGlow = document.getElementById("ambientGlow");
    DOM.searchInput = document.getElementById("topSearchInput");
    DOM.searchWrapper = document.getElementById("topSearchWrapper");
    DOM.userSection = document.getElementById("userSection");
    DOM.sidebarLibraryList = document.getElementById("sidebarLibraryList");

    // Audio Player Elements
    DOM.playerThumb = document.getElementById("playerThumb");
    DOM.playerTitle = document.getElementById("playerTitle");
    DOM.playerArtist = document.getElementById("playerArtist");
    DOM.playerLikeBtn = document.getElementById("playerLikeBtn");
    DOM.playPauseBtn = document.getElementById("playPauseBtn");
    DOM.prevBtn = document.getElementById("prevBtn");
    DOM.nextBtn = document.getElementById("nextBtn");
    DOM.shuffleBtn = document.getElementById("shuffleBtn");
    DOM.repeatBtn = document.getElementById("repeatBtn");
    DOM.currentTimeText = document.getElementById("currentTimeText");
    DOM.totalDurationText = document.getElementById("totalDurationText");
    DOM.progressTrack = document.getElementById("progressTrack");
    DOM.progressFill = document.getElementById("progressFill");
    DOM.progressContainer = document.getElementById("progressBarContainer");
    DOM.volumeBtn = document.getElementById("volumeBtn");
    DOM.volumeSlider = document.getElementById("volumeSlider");
    DOM.volumeFill = document.getElementById("volumeFill");
    DOM.visualizerCanvasMini = document.getElementById("visualizerCanvasMini");

    // Modals
    DOM.authModal = document.getElementById("authModal");
    DOM.queueDrawer = document.getElementById("queueDrawer");
    DOM.fullscreenOverlay = document.getElementById("fullscreenOverlay");
    DOM.fullscreenVisualizer = document.getElementById("fullscreenVisualizer");
    DOM.fullscreenArt = document.getElementById("fullscreenArt");
    DOM.fullscreenTitle = document.getElementById("fullscreenTitle");
    DOM.fullscreenArtist = document.getElementById("fullscreenArtist");
    DOM.toastContainer = document.getElementById("toastContainer");
  }

  // ==========================================================================
  // API HELPERS
  // ==========================================================================
  async function apiRequest(endpoint, options = {}) {
    const headers = options.headers || {};
    if (state.token) {
      headers["Authorization"] = `Bearer ${state.token}`;
    }
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  async function init() {
    initDOMElements();
    setupAudioListeners();
    setupEventListeners();
    setupScrollListener();
    initMiniVisualizer();

    // Check auth status
    await checkAuth();

    // Load initial feed & collections
    await loadInitialData();

    // Initial View Render
    navigateTo("home");
  }

  async function checkAuth() {
    if (!state.token) {
      updateUserUI(null);
      return;
    }
    try {
      const data = await apiRequest("/auth/me");
      if (data && data.user) {
        state.user = data.user;
        updateUserUI(state.user);
        syncLikedTracks(data.user.likedMusics);
      }
    } catch (err) {
      console.warn("Session expired or invalid, logging out");
      logout(false);
    }
  }

  function syncLikedTracks(likedMusics) {
    state.likedTracksMap.clear();
    if (Array.isArray(likedMusics)) {
      likedMusics.forEach((item) => {
        const id = typeof item === "string" ? item : item._id;
        if (id) state.likedTracksMap.add(id);
      });
    }
  }

  async function loadInitialData() {
    try {
      const [feed, musicsData, albumsData] = await Promise.all([
        apiRequest("/music/home-feed"),
        apiRequest("/music?limit=60"),
        apiRequest("/music/albums"),
      ]);

      state.feedData = feed;
      state.allTracks = musicsData.musics || [];
      state.allAlbums = albumsData.albums || [];

      // Populate sidebar library list
      renderSidebarLibrary();

      // If tracks are available and no track is loaded, prepare the first one in paused state
      if (!state.currentTrack && state.allTracks.length > 0) {
        setTrack(state.allTracks[0], state.allTracks, false);
      }
    } catch (err) {
      showToast("Notice: Loaded offline/fallback data", "info");
    }
  }

  // ==========================================================================
  // WEB AUDIO API & AUDIO ENGINE
  // ==========================================================================
  function setupAudioContext() {
    if (state.audioContext) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioContextClass();
      state.analyser = state.audioContext.createAnalyser();
      state.analyser.fftSize = 64;
      const bufferLength = state.analyser.frequencyBinCount;
      state.dataArray = new Uint8Array(bufferLength);

      const source = state.audioContext.createMediaElementSource(audio);
      source.connect(state.analyser);
      state.analyser.connect(state.audioContext.destination);
    } catch (e) {
      console.warn("Web Audio API not supported or blocked:", e);
    }
  }

  function setupAudioListeners() {
    audio.addEventListener("timeupdate", () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      const progress = (audio.currentTime / audio.duration) * 100;
      if (DOM.progressFill) DOM.progressFill.style.width = `${progress}%`;
      if (DOM.currentTimeText) DOM.currentTimeText.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener("loadedmetadata", () => {
      if (DOM.totalDurationText) DOM.totalDurationText.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("play", () => {
      state.isPlaying = true;
      updatePlayPauseButton(true);
      updateEqualizerAnimations(true);
    });

    audio.addEventListener("pause", () => {
      state.isPlaying = false;
      updatePlayPauseButton(false);
      updateEqualizerAnimations(false);
    });

    audio.addEventListener("ended", () => {
      if (state.isRepeat === "track") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNextTrack(true);
      }
    });

    audio.addEventListener("error", (e) => {
      console.error("Audio playback error:", e);
      showToast("Error playing track. Skipping to next...", "error");
      playNextTrack(false);
    });
  }

  function setTrack(track, queueList = null, autoPlay = true) {
    if (!track) return;
    state.currentTrack = track;

    if (queueList && Array.isArray(queueList)) {
      state.queue = [...queueList];
      state.queueIndex = state.queue.findIndex((t) => t._id === track._id);
    } else if (state.queue.length === 0) {
      state.queue = [track];
      state.queueIndex = 0;
    }

    // Set audio source
    audio.src = track.uri;
    audio.load();

    // Update Player Dock UI
    if (DOM.playerThumb) DOM.playerThumb.src = track.coverImage || getDefaultCover(track.genre);
    if (DOM.playerTitle) DOM.playerTitle.textContent = track.title;
    if (DOM.playerArtist) {
      DOM.playerArtist.textContent =
        typeof track.artist === "object" && track.artist ? track.artist.username : "Groovify Artist";
    }

    // Update Heart Icon in Dock
    const isLiked = state.likedTracksMap.has(track._id);
    updatePlayerHeartState(isLiked);

    // Update Ambient Glow color dynamically
    updateAmbientGlow(track.genre);

    // Fullscreen View Elements
    if (DOM.fullscreenArt) DOM.fullscreenArt.src = track.coverImage || getDefaultCover(track.genre);
    if (DOM.fullscreenTitle) DOM.fullscreenTitle.textContent = track.title;
    if (DOM.fullscreenArtist) {
      DOM.fullscreenArtist.textContent =
        typeof track.artist === "object" && track.artist ? track.artist.username : "Groovify Artist";
    }

    if (autoPlay) {
      setupAudioContext();
      if (state.audioContext && state.audioContext.state === "suspended") {
        state.audioContext.resume();
      }
      audio.play().then(() => {
        state.isPlaying = true;
        updatePlayPauseButton(true);
        // Record play on backend
        recordPlayCount(track._id);
      }).catch((err) => {
        console.warn("Autoplay was prevented by browser:", err);
      });
    }

    // Refresh active state in track rows
    updateActiveTrackRows();
  }

  function togglePlayPause() {
    if (!state.currentTrack && state.allTracks.length > 0) {
      setTrack(state.allTracks[0], state.allTracks, true);
      return;
    }
    setupAudioContext();
    if (state.audioContext && state.audioContext.state === "suspended") {
      state.audioContext.resume();
    }

    if (audio.paused) {
      audio.play().catch((err) => console.warn("Playback error:", err));
    } else {
      audio.pause();
    }
  }

  function playNextTrack(isAutoNext = false) {
    if (state.queue.length === 0) return;

    let nextIndex;
    if (state.isShuffle) {
      nextIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      nextIndex = state.queueIndex + 1;
      if (nextIndex >= state.queue.length) {
        if (state.isRepeat === "all") {
          nextIndex = 0;
        } else {
          if (isAutoNext) return; // reached end of queue
          nextIndex = 0;
        }
      }
    }

    state.queueIndex = nextIndex;
    setTrack(state.queue[nextIndex], null, true);
  }

  function playPrevTrack() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (state.queue.length === 0) return;

    let prevIndex = state.queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = state.queue.length - 1;
    }
    state.queueIndex = prevIndex;
    setTrack(state.queue[prevIndex], null, true);
  }

  function updatePlayPauseButton(isPlaying) {
    const playSvg = `<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>`;
    const pauseSvg = `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
    if (DOM.playPauseBtn) {
      DOM.playPauseBtn.innerHTML = isPlaying ? pauseSvg : playSvg;
    }
  }

  function updateEqualizerAnimations(isPlaying) {
    const eqBars = document.querySelectorAll(".eq-bar");
    eqBars.forEach((bar) => {
      bar.style.animationPlayState = isPlaying ? "running" : "paused";
    });
  }

  function updateActiveTrackRows() {
    const currentId = state.currentTrack ? state.currentTrack._id : null;
    document.querySelectorAll(".track-row").forEach((row) => {
      const rowId = row.getAttribute("data-id");
      if (rowId === currentId) {
        row.classList.add("active");
        const numCell = row.querySelector(".track-num-cell");
        if (numCell) {
          numCell.innerHTML = state.isPlaying
            ? `<div class="equalizer-anim"><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div></div>`
            : `<span style="color:var(--spotify-green);font-weight:700">▶</span>`;
        }
      } else {
        row.classList.remove("active");
        const numCell = row.querySelector(".track-num-cell");
        const originalIndex = row.getAttribute("data-index");
        if (numCell && originalIndex) {
          numCell.innerHTML = `<span class="track-index-num">${originalIndex}</span><button class="track-row-play-btn"><svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg></button>`;
        }
      }
    });
  }

  async function recordPlayCount(trackId) {
    try {
      await apiRequest(`/music/${trackId}/play`, { method: "POST" });
    } catch (e) {
      // Non-critical, ignore
    }
  }

  // ==========================================================================
  // MINI & FULLSCREEN AUDIO VISUALIZERS
  // ==========================================================================
  function initMiniVisualizer() {
    const canvas = DOM.visualizerCanvasMini;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function renderMini() {
      requestAnimationFrame(renderMini);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (state.isPlaying && state.analyser && state.dataArray) {
        state.analyser.getByteFrequencyData(state.dataArray);
        const barWidth = 4;
        let x = 0;
        const count = 8;
        const step = Math.floor(state.dataArray.length / count);

        for (let i = 0; i < count; i++) {
          const val = state.dataArray[i * step] || 0;
          const barHeight = Math.max((val / 255) * canvas.height, 3);
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, "#1db954");
          gradient.addColorStop(1, "#1ed760");
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 3;
        }
      } else {
        // Subtle resting bars
        const restingHeights = [4, 6, 8, 5, 7, 4, 6, 3];
        let x = 0;
        restingHeights.forEach((h) => {
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fillRect(x, canvas.height - h, 4, h);
          x += 7;
        });
      }
    }
    renderMini();
  }

  // ==========================================================================
  // LIKES & INTERACTION
  // ==========================================================================
  async function toggleLikeTrack(trackId, e) {
    if (e) e.stopPropagation();

    if (!state.user) {
      showToast("Please log in to save songs to your library", "info");
      openAuthModal("login");
      return;
    }

    const wasLiked = state.likedTracksMap.has(trackId);
    // Optimistic toggle
    if (wasLiked) {
      state.likedTracksMap.delete(trackId);
    } else {
      state.likedTracksMap.add(trackId);
    }

    updateTrackLikeButtons(trackId, !wasLiked);
    if (state.currentTrack && state.currentTrack._id === trackId) {
      updatePlayerHeartState(!wasLiked);
    }

    try {
      const res = await apiRequest(`/music/${trackId}/like`, { method: "POST" });
      showToast(res.message, "success");
    } catch (err) {
      // Rollback
      if (wasLiked) {
        state.likedTracksMap.add(trackId);
      } else {
        state.likedTracksMap.delete(trackId);
      }
      updateTrackLikeButtons(trackId, wasLiked);
      showToast("Failed to update like status", "error");
    }
  }

  function updateTrackLikeButtons(trackId, isLiked) {
    document.querySelectorAll(`.heart-action-btn[data-id="${trackId}"]`).forEach((btn) => {
      if (isLiked) {
        btn.classList.add("active");
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="#1db954"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;
      } else {
        btn.classList.remove("active");
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;
      }
    });
  }

  function updatePlayerHeartState(isLiked) {
    if (!DOM.playerLikeBtn) return;
    if (isLiked) {
      DOM.playerLikeBtn.classList.add("active");
      DOM.playerLikeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="#1db954"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;
    } else {
      DOM.playerLikeBtn.classList.remove("active");
      DOM.playerLikeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;
    }
  }

  // ==========================================================================
  // VIEW ROUTER & NAVIGATION
  // ==========================================================================
  function updateHistoryButtons() {
    const backBtn = document.getElementById("topHistoryBack");
    const fwdBtn = document.getElementById("topHistoryForward");
    if (backBtn) {
      const canBack = (state.historyIndex || 0) > 0;
      backBtn.disabled = !canBack;
      backBtn.style.opacity = canBack ? "1" : "0.35";
      backBtn.style.cursor = canBack ? "pointer" : "not-allowed";
    }
    if (fwdBtn) {
      const canFwd = (state.historyIndex || 0) < (state.history ? state.history.length - 1 : 0);
      fwdBtn.disabled = !canFwd;
      fwdBtn.style.opacity = canFwd ? "1" : "0.35";
      fwdBtn.style.cursor = canFwd ? "pointer" : "not-allowed";
    }
  }

  function goBack() {
    if ((state.historyIndex || 0) > 0) {
      state.historyIndex--;
      const target = state.history[state.historyIndex];
      navigateTo(target.view, target.params, false);
    }
  }

  function goForward() {
    if ((state.historyIndex || 0) < state.history.length - 1) {
      state.historyIndex++;
      const target = state.history[state.historyIndex];
      navigateTo(target.view, target.params, false);
    }
  }

  function navigateTo(viewName, params = {}, addToHistory = true) {
    state.currentView = viewName;

    if (addToHistory) {
      const cur = state.history[state.historyIndex || 0];
      const isSame =
        cur &&
        cur.view === viewName &&
        (cur.params?.albumId || null) === (params.albumId || null) &&
        (cur.params?.query || null) === (params.query || null);

      if (!isSame) {
        state.history = state.history.slice(0, (state.historyIndex || 0) + 1);
        state.history.push({ view: viewName, params });
        state.historyIndex = state.history.length - 1;
      }
    }

    updateHistoryButtons();

    // Update active state in sidebar nav items
    document.querySelectorAll(".nav-item").forEach((item) => {
      if (item.getAttribute("data-view") === viewName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Control search bar visibility in header
    if (DOM.searchWrapper) {
      DOM.searchWrapper.style.display = viewName === "search" ? "block" : "none";
      if (viewName === "search" && DOM.searchInput) {
        DOM.searchInput.focus();
      }
    }

    // Scroll to top
    if (DOM.mainContent) {
      DOM.mainContent.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Render corresponding view
    switch (viewName) {
      case "home":
        renderHomeView();
        break;
      case "search":
        renderSearchView();
        break;
      case "album":
        renderAlbumView(params.albumId || state.currentAlbumId);
        break;
      case "liked":
        renderLikedSongsView();
        break;
      case "studio":
        renderStudioView();
        break;
      default:
        renderHomeView();
    }
  }

  // ==========================================================================
  // VIEW: HOME VIEW
  // ==========================================================================
  function renderHomeView() {
    const greeting = getGreetingTime();
    const feed = state.feedData || {};
    const trending = feed.trendingTracks || state.allTracks.slice(0, 8);
    const albums = feed.featuredAlbums || state.allAlbums;

    let quickPicks = trending.slice(0, 6);

    let html = `
      <section>
        <h1 class="section-title" style="font-size:32px; margin-bottom:20px;">${greeting}</h1>
        <div class="quick-picks-grid">
          ${quickPicks.map((track) => `
            <div class="quick-pick-card" data-action="play-track" data-id="${track._id}">
              <img src="${track.coverImage || getDefaultCover(track.genre)}" class="quick-pick-thumb" alt="${track.title}" />
              <span class="quick-pick-title">${escapeHTML(track.title)}</span>
              <button class="quick-pick-play-btn" data-action="play-track" data-id="${track._id}">
                <svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
              </button>
            </div>
          `).join("")}
        </div>
      </section>

      <section>
        <div class="section-header">
          <h2 class="section-title">Featured Albums</h2>
          <a class="section-link" data-action="nav" data-target="search">Show all</a>
        </div>
        <div class="media-grid">
          ${albums.map((album) => `
            <div class="media-card" data-action="open-album" data-album-id="${album._id}">
              <div class="media-card-artwork">
                <img src="${album.coverImage || getDefaultCover(album.genre)}" class="media-card-img" alt="${album.title}" />
                <button class="media-card-play-btn" data-action="play-album" data-album-id="${album._id}">
                  <svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
                </button>
              </div>
              <div class="media-card-title">${escapeHTML(album.title)}</div>
              <div class="media-card-subtitle">${escapeHTML(album.description || (album.artist ? album.artist.username : "Groovify Artist"))}</div>
            </div>
          `).join("")}
        </div>
      </section>

      <section>
        <div class="section-header">
          <h2 class="section-title">Trending Tracks</h2>
          <span style="font-size:13px; color:var(--text-sub); font-weight:600;">Updated Hourly</span>
        </div>
        <table class="track-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th>Title</th>
              <th>Genre</th>
              <th>Plays</th>
              <th class="th-time">Time</th>
              <th class="th-actions"></th>
            </tr>
          </thead>
          <tbody>
            ${trending.map((track, idx) => renderTrackRow(track, idx + 1, trending)).join("")}
          </tbody>
        </table>
      </section>

      <section>
        <div class="section-header">
          <h2 class="section-title">Popular Genres</h2>
        </div>
        <div class="genre-grid">
          ${getGenreTiles().map((genre) => `
            <div class="genre-card" style="background:${genre.color}" data-action="genre-filter" data-genre="${genre.name}">
              <h3>${genre.name}</h3>
              <img src="${genre.img}" class="genre-card-art" alt="${genre.name}" />
            </div>
          `).join("")}
        </div>
      </section>
    `;

    DOM.viewContainer.innerHTML = html;
    updateActiveTrackRows();
  }

  // ==========================================================================
  // VIEW: SEARCH VIEW
  // ==========================================================================
  function renderSearchView(query = "") {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      // Empty Search: show browse categories
      let html = `
        <section>
          <h1 class="section-title" style="margin-bottom:24px;">Browse all</h1>
          <div class="genre-grid">
            ${getGenreTiles().map((genre) => `
              <div class="genre-card" style="background:${genre.color}" data-action="genre-filter" data-genre="${genre.name}">
                <h3>${genre.name}</h3>
                <img src="${genre.img}" class="genre-card-art" alt="${genre.name}" />
              </div>
            `).join("")}
          </div>
        </section>
      `;
      DOM.viewContainer.innerHTML = html;
      return;
    }

    // Filter tracks and albums based on query
    const matchingTracks = state.allTracks.filter((t) => {
      const titleMatch = t.title.toLowerCase().includes(trimmed);
      const genreMatch = t.genre && t.genre.toLowerCase().includes(trimmed);
      const artistMatch = t.artist && typeof t.artist === "object" && t.artist.username.toLowerCase().includes(trimmed);
      return titleMatch || genreMatch || artistMatch;
    });

    const matchingAlbums = state.allAlbums.filter((a) => {
      const titleMatch = a.title.toLowerCase().includes(trimmed);
      const genreMatch = a.genre && a.genre.toLowerCase().includes(trimmed);
      return titleMatch || genreMatch;
    });

    if (matchingTracks.length === 0 && matchingAlbums.length === 0) {
      DOM.viewContainer.innerHTML = `
        <div style="text-align:center; padding: 80px 20px;">
          <h2 style="font-size:24px; margin-bottom:8px;">No results found for "${escapeHTML(query)}"</h2>
          <p style="color:var(--text-sub); font-size:14px;">Please make sure your words are spelled correctly or use different keywords.</p>
        </div>
      `;
      return;
    }

    const topTrack = matchingTracks[0];

    let html = `
      <div style="display:grid; grid-template-columns: 2fr 3fr; gap:24px; margin-bottom:32px;">
        ${topTrack ? `
          <div>
            <h2 class="section-title" style="margin-bottom:16px;">Top Result</h2>
            <div class="media-card" style="background:var(--bg-surface-elevated); padding:24px; display:flex; flex-direction:column; gap:16px;" data-action="play-track" data-id="${topTrack._id}">
              <img src="${topTrack.coverImage || getDefaultCover(topTrack.genre)}" style="width:100px; height:100px; border-radius:var(--radius-sm); object-fit:cover; box-shadow:0 8px 20px rgba(0,0,0,0.5);" alt="${topTrack.title}" />
              <div>
                <h3 style="font-size:28px; font-weight:800; color:var(--text-main); margin-bottom:6px;">${escapeHTML(topTrack.title)}</h3>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:13px; color:var(--text-sub);">${escapeHTML(topTrack.artist ? topTrack.artist.username : "Groovify Artist")}</span>
                  <span class="role-badge" style="font-size:10px;">Song</span>
                </div>
              </div>
              <button class="quick-pick-play-btn" style="opacity:1; transform:none; width:48px; height:48px; align-self:flex-start; margin-top:auto;" data-action="play-track" data-id="${topTrack._id}">
                <svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
              </button>
            </div>
          </div>
        ` : `<div></div>`}

        <div>
          <h2 class="section-title" style="margin-bottom:16px;">Songs</h2>
          <table class="track-table">
            <tbody>
              ${matchingTracks.slice(0, 4).map((track, idx) => renderTrackRow(track, idx + 1, matchingTracks)).join("")}
            </tbody>
          </table>
        </div>
      </div>

      ${matchingAlbums.length > 0 ? `
        <section>
          <h2 class="section-title" style="margin-bottom:16px;">Albums</h2>
          <div class="media-grid">
            ${matchingAlbums.map((album) => `
              <div class="media-card" data-action="open-album" data-album-id="${album._id}">
                <div class="media-card-artwork">
                  <img src="${album.coverImage || getDefaultCover(album.genre)}" class="media-card-img" alt="${album.title}" />
                  <button class="media-card-play-btn" data-action="play-album" data-album-id="${album._id}">
                    <svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
                  </button>
                </div>
                <div class="media-card-title">${escapeHTML(album.title)}</div>
                <div class="media-card-subtitle">${escapeHTML(album.artist ? album.artist.username : "Artist")}</div>
              </div>
            `).join("")}
          </div>
        </section>
      ` : ""}
    `;

    DOM.viewContainer.innerHTML = html;
    updateActiveTrackRows();
  }

  // ==========================================================================
  // VIEW: ALBUM VIEW
  // ==========================================================================
  async function renderAlbumView(albumId) {
    if (!albumId) {
      navigateTo("home");
      return;
    }

    state.currentAlbumId = albumId;
    DOM.viewContainer.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <span style="color:var(--spotify-green); font-size:16px; font-weight:700;">Loading album...</span>
      </div>
    `;

    try {
      const data = await apiRequest(`/music/albums/${albumId}`);
      const album = data.album;
      if (!album) throw new Error("Album not found");

      const artistName = album.artist ? album.artist.username : "Groovify Artist";
      const tracks = album.musics || [];
      const totalSec = tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
      const totalMins = Math.floor(totalSec / 60);

      let html = `
        <div class="album-hero">
          <img src="${album.coverImage || getDefaultCover(album.genre)}" class="album-hero-cover" alt="${album.title}" />
          <div class="album-hero-details">
            <span class="album-hero-tag">Album</span>
            <h1 class="album-hero-title">${escapeHTML(album.title)}</h1>
            <p style="font-size:14px; color:var(--text-sub); margin-top:4px;">${escapeHTML(album.description || "")}</p>
            <div class="album-hero-meta">
              <span style="color:var(--text-main); font-weight:700;">${escapeHTML(artistName)}</span>
              <span class="bullet">•</span>
              <span>${album.releaseYear || 2025}</span>
              <span class="bullet">•</span>
              <span>${tracks.length} songs, approx. ${totalMins} min</span>
            </div>
          </div>
        </div>

        <div class="album-actions-bar">
          <button class="album-big-play-btn" data-action="play-album" data-album-id="${album._id}" title="Play album">
            <svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
          </button>
        </div>

        <table class="track-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th>Title</th>
              <th>Plays</th>
              <th class="th-time">Time</th>
              <th class="th-actions"></th>
            </tr>
          </thead>
          <tbody>
            ${tracks.map((track, idx) => renderTrackRow(track, idx + 1, tracks, false)).join("")}
          </tbody>
        </table>
      `;

      DOM.viewContainer.innerHTML = html;
      updateActiveTrackRows();
    } catch (err) {
      DOM.viewContainer.innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
          <h2>Failed to load album</h2>
          <button class="btn-primary" style="margin-top:16px;" data-action="nav" data-target="home">Back to Home</button>
        </div>
      `;
    }
  }

  // ==========================================================================
  // VIEW: LIKED SONGS VIEW
  // ==========================================================================
  async function renderLikedSongsView() {
    if (!state.user) {
      DOM.viewContainer.innerHTML = `
        <div style="text-align:center; padding: 100px 20px;">
          <h2 style="font-size:28px; margin-bottom:12px;">Sign in to view Liked Songs</h2>
          <p style="color:var(--text-sub); margin-bottom:24px;">Save your favorite tracks to listen whenever you want.</p>
          <button class="btn-primary" onclick="window.Groovify.openAuth('login')">Log In</button>
        </div>
      `;
      return;
    }

    DOM.viewContainer.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <span style="color:var(--spotify-green); font-size:16px; font-weight:700;">Loading favorites...</span>
      </div>
    `;

    try {
      const data = await apiRequest("/music/liked/all");
      const tracks = data.musics || [];

      let html = `
        <div class="album-hero">
          <div class="album-hero-cover" style="background: linear-gradient(135deg, #450af5 0%, #c4efd9 100%); display:flex; align-items:center; justify-content:center;">
            <svg viewBox="0 0 24 24" style="width:80px; height:80px; fill:#fff;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
          </div>
          <div class="album-hero-details">
            <span class="album-hero-tag">Playlist</span>
            <h1 class="album-hero-title">Liked Songs</h1>
            <div class="album-hero-meta">
              <span style="color:var(--text-main); font-weight:700;">${escapeHTML(state.user.username)}</span>
              <span class="bullet">•</span>
              <span>${tracks.length} songs</span>
            </div>
          </div>
        </div>

        ${tracks.length > 0 ? `
          <div class="album-actions-bar">
            <button class="album-big-play-btn" data-action="play-liked-all" title="Play Liked Songs">
              <svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
            </button>
          </div>

          <table class="track-table">
            <thead>
              <tr>
                <th class="th-num">#</th>
                <th>Title</th>
                <th>Genre</th>
                <th>Plays</th>
                <th class="th-time">Time</th>
                <th class="th-actions"></th>
              </tr>
            </thead>
            <tbody>
              ${tracks.map((track, idx) => renderTrackRow(track, idx + 1, tracks)).join("")}
            </tbody>
          </table>
        ` : `
          <div style="padding:48px 0; color:var(--text-sub);">
            <h3>Songs you like will appear here</h3>
            <p style="margin-top:6px; font-size:13px;">Save songs by tapping the heart icon on any track.</p>
          </div>
        `}
      `;

      DOM.viewContainer.innerHTML = html;
      updateActiveTrackRows();
    } catch (err) {
      showToast("Failed to load liked songs", "error");
    }
  }

  // ==========================================================================
  // VIEW: ARTIST STUDIO VIEW (UPLOADS & ALBUMS)
  // ==========================================================================
  function renderStudioView() {
    const isArtist = state.user && state.user.role === "artist";

    let html = `
      <section>
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px;">
          <div>
            <h1 class="section-title" style="font-size:32px;">Artist Studio</h1>
            <p style="color:var(--text-sub); font-size:14px; margin-top:4px;">Upload your original soundscapes and publish full albums.</p>
          </div>
          ${!isArtist ? `
            <div style="background:rgba(140,82,255,0.15); border:1px solid rgba(140,82,255,0.4); padding:10px 16px; border-radius:var(--radius-md); font-size:13px; color:#c4a4ff; display:flex; align-items:center; gap:8px;">
              <span>Listener Mode active. Quick-switch to <strong>Demo Artist</strong> below to upload.</span>
            </div>
          ` : ""}
        </div>

        <div class="studio-container">
          <!-- Track Upload Form -->
          <div class="studio-card">
            <div class="studio-card-header">
              <div class="studio-card-icon">
                <svg viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path></svg>
              </div>
              <div>
                <h3 style="font-size:18px; font-weight:700;">Upload New Track</h3>
                <p style="font-size:12px; color:var(--text-sub);">Supported audio formats: MP3, WAV, AAC</p>
              </div>
            </div>

            <form id="uploadMusicForm" onsubmit="window.Groovify.handleUploadTrack(event)">
              <div class="form-group" style="margin-bottom:14px;">
                <label>Audio File *</label>
                <div class="file-dropzone" id="audioDropzone" onclick="document.getElementById('audioFileInput').click()">
                  <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path></svg>
                  <p><span class="highlight">Choose audio file</span> or drag & drop here</p>
                  <span id="selectedFileName" style="font-size:12px; color:var(--spotify-green); font-weight:600;"></span>
                  <input type="file" id="audioFileInput" accept="audio/*" style="display:none;" required onchange="window.Groovify.handleFileSelect(event)" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:14px;">
                <label for="trackTitleInput">Track Title *</label>
                <input type="text" id="trackTitleInput" class="form-input" placeholder="e.g. Neon Boulevard" required />
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px;">
                <div class="form-group">
                  <label for="trackGenreSelect">Genre</label>
                  <select id="trackGenreSelect" class="form-select">
                    <option value="Synthwave">Synthwave</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Lo-Fi">Lo-Fi</option>
                    <option value="Pop">Pop</option>
                    <option value="Rock">Rock</option>
                    <option value="Ambient">Ambient</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="trackDurationInput">Estimated Duration (sec)</label>
                  <input type="number" id="trackDurationInput" class="form-input" value="180" min="10" max="1800" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:14px;">
                <label for="trackCoverUrlInput">Cover Art URL (Optional)</label>
                <input type="url" id="trackCoverUrlInput" class="form-input" placeholder="https://images.unsplash.com/..." />
              </div>

              <div class="form-group" style="margin-bottom:18px;">
                <label for="trackAlbumSelect">Assign to Album (Optional)</label>
                <select id="trackAlbumSelect" class="form-select">
                  <option value="">-- Standalone Single --</option>
                  ${state.allAlbums.map((a) => `<option value="${a._id}">${escapeHTML(a.title)}</option>`).join("")}
                </select>
              </div>

              <button type="submit" id="uploadTrackSubmitBtn" class="btn-primary" style="width:100%;">
                Publish Track to Groovify
              </button>
            </form>
          </div>

          <!-- Create Album Form -->
          <div class="studio-card">
            <div class="studio-card-header">
              <div class="studio-card-icon" style="background:rgba(140,82,255,0.15); color:var(--accent-purple);">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"></path></svg>
              </div>
              <div>
                <h3 style="font-size:18px; font-weight:700;">Create Album Collection</h3>
                <p style="font-size:12px; color:var(--text-sub);">Group tracks under an album release</p>
              </div>
            </div>

            <form id="createAlbumForm" onsubmit="window.Groovify.handleCreateAlbum(event)">
              <div class="form-group" style="margin-bottom:14px;">
                <label for="albumTitleInput">Album Title *</label>
                <input type="text" id="albumTitleInput" class="form-input" placeholder="e.g. Cyberpunk Odyssey Vol. 2" required />
              </div>

              <div class="form-group" style="margin-bottom:14px;">
                <label for="albumDescInput">Album Description</label>
                <textarea id="albumDescInput" class="form-textarea" rows="2" placeholder="Tell listeners about the inspiration behind this album..."></textarea>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px;">
                <div class="form-group">
                  <label for="albumGenreSelect">Genre</label>
                  <select id="albumGenreSelect" class="form-select">
                    <option value="Synthwave">Synthwave</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Lo-Fi">Lo-Fi</option>
                    <option value="Pop">Pop</option>
                    <option value="Rock">Rock</option>
                    <option value="Ambient">Ambient</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="albumYearInput">Release Year</label>
                  <input type="number" id="albumYearInput" class="form-input" value="2026" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:18px;">
                <label for="albumCoverUrlInput">Album Cover Artwork URL</label>
                <input type="url" id="albumCoverUrlInput" class="form-input" placeholder="https://images.unsplash.com/..." />
              </div>

              <button type="submit" id="createAlbumSubmitBtn" class="btn-primary" style="width:100%; background:var(--accent-purple);">
                Create Album
              </button>
            </form>
          </div>
        </div>
      </section>
    `;

    DOM.viewContainer.innerHTML = html;
  }

  // ==========================================================================
  // SIDEBAR LIBRARY RENDERER
  // ==========================================================================
  function renderSidebarLibrary() {
    if (!DOM.sidebarLibraryList) return;

    let items = [];

    // 1. Liked Songs entry
    items.push(`
      <div class="library-item" data-action="nav" data-target="liked">
        <div class="library-item-thumb liked-badge">
          <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
        </div>
        <div class="library-item-info">
          <span class="library-item-title">Liked Songs</span>
          <span class="library-item-subtitle">Playlist • ${state.likedTracksMap.size} songs</span>
        </div>
      </div>
    `);

    // 2. Albums list
    state.allAlbums.forEach((album) => {
      items.push(`
        <div class="library-item" data-action="open-album" data-album-id="${album._id}">
          <img src="${album.coverImage || getDefaultCover(album.genre)}" class="library-item-thumb" alt="${album.title}" />
          <div class="library-item-info">
            <span class="library-item-title">${escapeHTML(album.title)}</span>
            <span class="library-item-subtitle">Album • ${album.artist ? escapeHTML(album.artist.username) : "Artist"}</span>
          </div>
        </div>
      `);
    });

    DOM.sidebarLibraryList.innerHTML = items.join("");
  }

  // ==========================================================================
  // TRACK ROW TEMPLATE
  // ==========================================================================
  function renderTrackRow(track, index, trackList, showThumb = true) {
    const isCurrent = state.currentTrack && state.currentTrack._id === track._id;
    const isLiked = state.likedTracksMap.has(track._id);
    const artistName = track.artist && typeof track.artist === "object" ? track.artist.username : "Groovify Artist";

    return `
      <tr class="track-row ${isCurrent ? "active" : ""}" data-id="${track._id}" data-index="${index}" data-action="play-track" data-id="${track._id}">
        <td class="track-num-cell">
          ${isCurrent && state.isPlaying ? `
            <div class="equalizer-anim">
              <div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div>
            </div>
          ` : `
            <span class="track-index-num">${index}</span>
            <button class="track-row-play-btn">
              <svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
            </button>
          `}
        </td>
        <td>
          <div class="track-title-cell">
            ${showThumb ? `<img src="${track.coverImage || getDefaultCover(track.genre)}" class="track-thumb-img" alt="${track.title}" />` : ""}
            <div class="track-meta">
              <span class="track-title-text">${escapeHTML(track.title)}</span>
              <span class="track-artist-text">${escapeHTML(artistName)}</span>
            </div>
          </div>
        </td>
        ${track.genre ? `<td style="color:var(--text-sub); font-size:13px;">${escapeHTML(track.genre)}</td>` : ""}
        <td class="track-plays-text">${formatNumber(track.plays || 0)}</td>
        <td class="track-duration-text">${formatTime(track.duration || 180)}</td>
        <td style="text-align:center;">
          <button class="heart-action-btn ${isLiked ? "active" : ""}" data-id="${track._id}" data-action="toggle-like" title="Save to Liked Songs">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
          </button>
        </td>
      </tr>
    `;
  }

  // ==========================================================================
  // EVENT LISTENERS & DELEGATION
  // ==========================================================================
  function setupEventListeners() {
    // Navigation & Click delegation
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      const action = target.getAttribute("data-action");

      if (action === "nav") {
        const dest = target.getAttribute("data-target");
        navigateTo(dest);
      } else if (action === "play-track") {
        const trackId = target.getAttribute("data-id");
        const found = state.allTracks.find((t) => t._id === trackId);
        if (found) {
          if (state.currentTrack && state.currentTrack._id === trackId) {
            togglePlayPause();
          } else {
            setTrack(found, state.allTracks, true);
          }
        }
      } else if (action === "open-album") {
        const albumId = target.getAttribute("data-album-id");
        navigateTo("album", { albumId });
      } else if (action === "play-album") {
        e.stopPropagation();
        const albumId = target.getAttribute("data-album-id");
        playAlbumTracks(albumId);
      } else if (action === "play-liked-all") {
        playLikedTracks();
      } else if (action === "toggle-like") {
        const trackId = target.getAttribute("data-id");
        toggleLikeTrack(trackId, e);
      } else if (action === "genre-filter") {
        const genre = target.getAttribute("data-genre");
        filterByGenre(genre);
      }
    });

    // Player Controls
    if (DOM.playPauseBtn) DOM.playPauseBtn.addEventListener("click", togglePlayPause);
    if (DOM.nextBtn) DOM.nextBtn.addEventListener("click", () => playNextTrack(false));
    if (DOM.prevBtn) DOM.prevBtn.addEventListener("click", playPrevTrack);

    if (DOM.shuffleBtn) {
      DOM.shuffleBtn.addEventListener("click", () => {
        state.isShuffle = !state.isShuffle;
        DOM.shuffleBtn.classList.toggle("active", state.isShuffle);
        showToast(state.isShuffle ? "Shuffle On" : "Shuffle Off", "info");
      });
    }

    if (DOM.repeatBtn) {
      DOM.repeatBtn.addEventListener("click", () => {
        if (state.isRepeat === "off") {
          state.isRepeat = "all";
          DOM.repeatBtn.classList.add("active");
          showToast("Repeat All", "info");
        } else if (state.isRepeat === "all") {
          state.isRepeat = "track";
          DOM.repeatBtn.classList.add("active");
          showToast("Repeat One Track", "info");
        } else {
          state.isRepeat = "off";
          DOM.repeatBtn.classList.remove("active");
          showToast("Repeat Off", "info");
        }
      });
    }

    // Scrubber scrubbing
    if (DOM.progressContainer) {
      DOM.progressContainer.addEventListener("click", (e) => {
        if (!audio.duration || isNaN(audio.duration)) return;
        const rect = DOM.progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.min(Math.max(clickX / rect.width, 0), 1);
        audio.currentTime = percent * audio.duration;
      });
    }

    // Volume Control
    if (DOM.volumeSlider) {
      DOM.volumeSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
      });
    }

    if (DOM.volumeBtn) {
      DOM.volumeBtn.addEventListener("click", () => {
        if (state.isMuted) {
          setVolume(state.volume || 0.8, false);
        } else {
          setVolume(0, true);
        }
      });
    }

    // Player Dock Heart
    if (DOM.playerLikeBtn) {
      DOM.playerLikeBtn.addEventListener("click", () => {
        if (state.currentTrack) {
          toggleLikeTrack(state.currentTrack._id);
        }
      });
    }

    // Search Input Real-Time Debounce
    let searchDebounce = null;
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener("input", (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          renderSearchView(e.target.value);
        }, 250);
      });
    }

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
      // Ignore if typing in an input or textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "ArrowRight") {
        audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
      } else if (e.code === "ArrowLeft") {
        audio.currentTime = Math.max(audio.currentTime - 5, 0);
      } else if (e.code === "KeyM") {
        DOM.volumeBtn.click();
      } else if (e.code === "Escape") {
        closeModals();
      }
    });
  }

  function setupScrollListener() {
    if (!DOM.mainContent || !DOM.topBar) return;
    DOM.mainContent.addEventListener("scroll", () => {
      if (DOM.mainContent.scrollTop > 40) {
        DOM.topBar.classList.add("scrolled");
      } else {
        DOM.topBar.classList.remove("scrolled");
      }
    });
  }

  function setVolume(val, muted = false) {
    state.isMuted = muted;
    audio.muted = muted;
    if (!muted) {
      state.volume = val;
      audio.volume = val;
      localStorage.setItem("groovify_volume", val.toString());
    }

    if (DOM.volumeSlider) DOM.volumeSlider.value = muted ? 0 : val;
    if (DOM.volumeFill) DOM.volumeFill.style.width = `${(muted ? 0 : val) * 100}%`;

    // Update Volume Icon
    const volumeSvgHigh = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>`;
    const volumeSvgMute = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>`;
    if (DOM.volumeBtn) {
      DOM.volumeBtn.innerHTML = muted || val === 0 ? volumeSvgMute : volumeSvgHigh;
    }
  }

  async function playAlbumTracks(albumId) {
    try {
      const data = await apiRequest(`/music/albums/${albumId}`);
      if (data.album && data.album.musics && data.album.musics.length > 0) {
        state.queue = [...data.album.musics];
        state.queueIndex = 0;
        setTrack(state.queue[0], state.queue, true);
        showToast(`Playing "${data.album.title}"`, "info");
      } else {
        showToast("No songs found in this album", "info");
      }
    } catch (e) {
      showToast("Unable to play album", "error");
    }
  }

  async function playLikedTracks() {
    try {
      const data = await apiRequest("/music/liked/all");
      if (data.musics && data.musics.length > 0) {
        state.queue = [...data.musics];
        state.queueIndex = 0;
        setTrack(state.queue[0], state.queue, true);
        showToast("Playing Liked Songs", "info");
      }
    } catch (e) {
      showToast("No liked songs available", "info");
    }
  }

  function filterByGenre(genre) {
    navigateTo("search");
    if (DOM.searchInput) {
      DOM.searchInput.value = genre;
    }
    renderSearchView(genre);
  }

  function updateAmbientGlow(genre) {
    if (!DOM.ambientGlow) return;
    const colors = {
      synthwave: "radial-gradient(circle at 40% 10%, rgba(140, 82, 255, 0.35) 0%, transparent 70%)",
      electronic: "radial-gradient(circle at 40% 10%, rgba(45, 115, 255, 0.35) 0%, transparent 70%)",
      lofi: "radial-gradient(circle at 40% 10%, rgba(255, 179, 71, 0.3) 0%, transparent 70%)",
      pop: "radial-gradient(circle at 40% 10%, rgba(255, 77, 109, 0.35) 0%, transparent 70%)",
      rock: "radial-gradient(circle at 40% 10%, rgba(230, 57, 70, 0.35) 0%, transparent 70%)",
      ambient: "radial-gradient(circle at 40% 10%, rgba(29, 185, 84, 0.3) 0%, transparent 70%)",
    };
    const key = (genre || "synthwave").toLowerCase().replace(/[^a-z]/g, "");
    DOM.ambientGlow.style.background = colors[key] || colors.synthwave;
  }

  // ==========================================================================
  // AUTHENTICATION & PROFILE
  // ==========================================================================
  function updateUserUI(user) {
    if (!DOM.userSection) return;

    if (user) {
      DOM.userSection.innerHTML = `
        <div class="user-chip" id="userProfileChip" onclick="window.Groovify.toggleUserMenu()">
          <div class="user-avatar">${user.username ? user.username.charAt(0).toUpperCase() : "U"}</div>
          <span class="user-name-text">${escapeHTML(user.username)}</span>
          <span class="role-badge ${user.role === "artist" ? "artist" : ""}">${user.role}</span>
        </div>
      `;
    } else {
      DOM.userSection.innerHTML = `
        <button class="btn-secondary" onclick="window.Groovify.openAuth('register')">Sign up</button>
        <button class="btn-primary" onclick="window.Groovify.openAuth('login')">Log in</button>
      `;
    }
  }

  function openAuthModal(initialTab = "login") {
    if (!DOM.authModal) return;
    DOM.authModal.classList.add("active");
    switchAuthTab(initialTab);
  }

  function closeModals() {
    document.querySelectorAll(".modal-overlay").forEach((m) => m.classList.remove("active"));
    if (DOM.fullscreenOverlay) DOM.fullscreenOverlay.classList.remove("active");
  }

  function switchAuthTab(tab) {
    document.querySelectorAll(".auth-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });

    const isLogin = tab === "login";
    document.getElementById("authSubmitBtn").textContent = isLogin ? "Log In" : "Create Account";
    document.getElementById("roleFieldGroup").style.display = isLogin ? "none" : "flex";
    document.getElementById("authForm").setAttribute("data-mode", tab);
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    const mode = e.target.getAttribute("data-mode") || "login";
    const username = document.getElementById("authUsername").value.trim();
    const password = document.getElementById("authPassword").value;
    const email = document.getElementById("authEmail").value.trim();
    const role = document.getElementById("authRoleSelect").value;

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const body = mode === "login" ? { username, password } : { username, email, password, role };

    try {
      const res = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (res.token) {
        state.token = res.token;
        localStorage.setItem("groovify_token", res.token);
      }
      state.user = res.user;
      updateUserUI(state.user);
      syncLikedTracks(res.user.likedMusics);

      closeModals();
      showToast(res.message || "Welcome to Groovify!", "success");

      // Reload fresh user-specific recommendations
      await loadInitialData();
      navigateTo(state.currentView);
    } catch (err) {
      showToast(err.message || "Authentication error", "error");
    }
  }

  function quickLogin(username, password) {
    document.getElementById("authUsername").value = username;
    document.getElementById("authPassword").value = password;
    switchAuthTab("login");
    const fakeEvent = { preventDefault: () => {} };
    handleAuthSubmit({ preventDefault: () => {}, target: document.getElementById("authForm") });
  }

  function logout(showNotice = true) {
    state.user = null;
    state.token = null;
    localStorage.removeItem("groovify_token");
    state.likedTracksMap.clear();
    updateUserUI(null);

    apiRequest("/auth/logout", { method: "POST" }).catch(() => {});
    if (showNotice) showToast("Logged out successfully", "info");

    navigateTo("home");
  }

  // ==========================================================================
  // ARTIST UPLOAD ACTIONS
  // ==========================================================================
  function handleFileSelect(e) {
    const file = e.target.files[0];
    const nameEl = document.getElementById("selectedFileName");
    if (file && nameEl) {
      nameEl.textContent = `Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    }
  }

  async function handleUploadTrack(e) {
    e.preventDefault();
    if (!state.user || state.user.role !== "artist") {
      showToast("Artist account required to upload tracks. Please switch to Demo Artist.", "error");
      return;
    }

    const fileInput = document.getElementById("audioFileInput");
    const titleInput = document.getElementById("trackTitleInput");
    const genreSelect = document.getElementById("trackGenreSelect");
    const durationInput = document.getElementById("trackDurationInput");
    const coverUrlInput = document.getElementById("trackCoverUrlInput");
    const albumSelect = document.getElementById("trackAlbumSelect");
    const submitBtn = document.getElementById("uploadTrackSubmitBtn");

    if (!fileInput.files || fileInput.files.length === 0) {
      showToast("Please choose an audio file", "error");
      return;
    }

    const formData = new FormData();
    formData.append("music", fileInput.files[0]);
    formData.append("title", titleInput.value.trim());
    formData.append("genre", genreSelect.value);
    formData.append("duration", durationInput.value || 180);
    if (coverUrlInput.value.trim()) formData.append("coverImage", coverUrlInput.value.trim());
    if (albumSelect.value) formData.append("albumId", albumSelect.value);

    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading Audio & Publishing...";

    try {
      const res = await apiRequest("/music/upload", {
        method: "POST",
        body: formData,
      });

      showToast("Track published successfully!", "success");
      // Add to local state & play immediately!
      if (res.music) {
        state.allTracks.unshift(res.music);
        setTrack(res.music, state.allTracks, true);
      }
      e.target.reset();
      document.getElementById("selectedFileName").textContent = "";
      navigateTo("home");
    } catch (err) {
      showToast("Upload failed: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publish Track to Groovify";
    }
  }

  async function handleCreateAlbum(e) {
    e.preventDefault();
    if (!state.user || state.user.role !== "artist") {
      showToast("Artist account required to create albums. Please switch to Demo Artist.", "error");
      return;
    }

    const titleInput = document.getElementById("albumTitleInput");
    const descInput = document.getElementById("albumDescInput");
    const genreSelect = document.getElementById("albumGenreSelect");
    const yearInput = document.getElementById("albumYearInput");
    const coverUrlInput = document.getElementById("albumCoverUrlInput");
    const submitBtn = document.getElementById("createAlbumSubmitBtn");

    const payload = {
      title: titleInput.value.trim(),
      description: descInput.value.trim(),
      genre: genreSelect.value,
      releaseYear: Number(yearInput.value) || 2026,
      coverImage: coverUrlInput.value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Album...";

    try {
      const res = await apiRequest("/music/album", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showToast("Album created successfully!", "success");
      if (res.album) {
        state.allAlbums.unshift(res.album);
        renderSidebarLibrary();
        navigateTo("album", { albumId: res.album._id });
      }
      e.target.reset();
    } catch (err) {
      showToast("Album creation failed: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Album";
    }
  }

  // ==========================================================================
  // FULLSCREEN & QUEUE DRAWER
  // ==========================================================================
  function toggleFullscreen() {
    if (!DOM.fullscreenOverlay) return;
    const isActive = DOM.fullscreenOverlay.classList.contains("active");
    if (isActive) {
      DOM.fullscreenOverlay.classList.remove("active");
    } else {
      if (state.currentTrack) {
        DOM.fullscreenArt.src = state.currentTrack.coverImage || getDefaultCover(state.currentTrack.genre);
        DOM.fullscreenTitle.textContent = state.currentTrack.title;
        DOM.fullscreenArtist.textContent =
          typeof state.currentTrack.artist === "object" && state.currentTrack.artist
            ? state.currentTrack.artist.username
            : "Groovify Artist";
      }
      DOM.fullscreenOverlay.classList.add("active");
    }
  }

  function toggleQueueDrawer() {
    if (!DOM.queueDrawer) return;
    const isActive = DOM.queueDrawer.classList.contains("active");
    if (isActive) {
      DOM.queueDrawer.classList.remove("active");
    } else {
      renderQueueList();
      DOM.queueDrawer.classList.add("active");
    }
  }

  function renderQueueList() {
    const listEl = document.getElementById("queueItemsContainer");
    if (!listEl) return;

    if (state.queue.length === 0) {
      listEl.innerHTML = `<p style="color:var(--text-sub); font-size:14px; padding:20px 0;">No tracks in queue</p>`;
      return;
    }

    let html = state.queue.map((track, idx) => {
      const isCurrent = idx === state.queueIndex;
      return `
        <div class="library-item ${isCurrent ? "active" : ""}" data-action="play-track" data-id="${track._id}">
          <span style="font-size:13px; color:var(--text-sub); width:20px;">${idx + 1}</span>
          <img src="${track.coverImage || getDefaultCover(track.genre)}" class="library-item-thumb" style="width:36px; height:36px;" alt="${track.title}" />
          <div class="library-item-info">
            <span class="library-item-title" style="${isCurrent ? "color:var(--spotify-green);" : ""}">${escapeHTML(track.title)}</span>
            <span class="library-item-subtitle">${track.artist && typeof track.artist === "object" ? escapeHTML(track.artist.username) : "Artist"}</span>
          </div>
        </div>
      `;
    }).join("");

    listEl.innerHTML = html;
  }

  // ==========================================================================
  // UTILITIES & HELPERS
  // ==========================================================================
  function showToast(message, type = "info") {
    if (!DOM.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";

    const icons = {
      success: `<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#1db954"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
      error: `<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#ff4d6d"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
      info: `<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#1db954"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
    };

    toast.innerHTML = `${icons[type] || icons.info}<span>${escapeHTML(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(12px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }

  function escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getGreetingTime() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  function getDefaultCover(genre) {
    const genreMap = {
      synthwave: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
      electronic: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      lofi: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
      pop: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
      rock: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
      ambient: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    };
    const key = (genre || "synthwave").toLowerCase().replace(/[^a-z]/g, "");
    return genreMap[key] || genreMap.synthwave;
  }

  function getGenreTiles() {
    return [
      { name: "Synthwave", color: "#8c52ff", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80" },
      { name: "Electronic", color: "#2d73ff", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80" },
      { name: "Lo-Fi", color: "#ba5d2c", img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80" },
      { name: "Pop", color: "#e91e63", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80" },
      { name: "Rock", color: "#b91d47", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80" },
      { name: "Ambient", color: "#00aba9", img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80" },
    ];
  }

  // ==========================================================================
  // EXPOSE GLOBAL API HOOKS FOR HTML ONCLICK BINDINGS
  // ==========================================================================
  window.Groovify = {
    openAuth: openAuthModal,
    closeModals,
    switchAuthTab,
    handleAuthSubmit,
    quickLogin,
    logout,
    toggleUserMenu: () => {
      if (confirm(`Logged in as ${state.user.username} (${state.user.role}). Log out?`)) {
        logout(true);
      }
    },
    handleFileSelect,
    handleUploadTrack,
    handleCreateAlbum,
    toggleFullscreen,
    toggleQueueDrawer,
    filterByGenre,
    navigateTo,
    goBack,
    goForward,
  };

  // Start application on DOM ready
  document.addEventListener("DOMContentLoaded", init);
})();
