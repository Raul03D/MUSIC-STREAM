import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const MusicContext = createContext();

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }) => {
  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem('groovify_token') || null);
  const [user, setUser] = useState(null);

  // Playback state
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'track' | 'all'
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolumeState] = useState(() => parseFloat(localStorage.getItem('groovify_volume') || '0.8'));
  const [isMuted, setIsMuted] = useState(false);

  // Navigation & Data
  const [currentView, setCurrentView] = useState('home');
  const [currentAlbumId, setCurrentAlbumId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedData, setFeedData] = useState(null);
  const [allTracks, setAllTracks] = useState([]);
  const [allAlbums, setAllAlbums] = useState([]);
  const [likedTrackIds, setLikedTrackIds] = useState(new Set());

  // UI Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Audio & Web Audio Refs
  const audioRef = useRef(new Audio());
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // API helper with Bearer token
  const apiRequest = async (endpoint, options = {}) => {
    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `API error ${res.status}`);
    }
    return data;
  };

  // Web Audio Analyser setup
  const initWebAudio = () => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
    } catch (e) {
      console.warn('Web Audio API initialized or restricted:', e);
    }
  };

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    audio.crossOrigin = 'anonymous';
    audio.volume = volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      if (repeatMode === 'track') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNext(true);
      }
    };

    const handleError = (e) => {
      console.error('Audio playback error:', e);
      showToast('Error playing track, skipping...', 'error');
      playNext(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeatMode, queue, queueIndex, isShuffle]);

  // Initial Data & Auth check
  const fetchInitialData = async () => {
    try {
      const [feed, musicsData, albumsData] = await Promise.all([
        apiRequest('/music/home-feed'),
        apiRequest('/music?limit=1000'),
        apiRequest('/music/albums'),
      ]);
      setFeedData(feed);
      setAllTracks(musicsData.musics || []);
      setAllAlbums(albumsData.albums || []);

      if (!currentTrack && musicsData.musics && musicsData.musics.length > 0) {
        setCurrentTrack(musicsData.musics[0]);
        setQueue(musicsData.musics);
        setQueueIndex(0);
        audioRef.current.src = musicsData.musics[0].uri;
      }
    } catch (e) {
      console.warn('Initial data load warning:', e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Check Auth
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLikedTrackIds(new Set());
      return;
    }
    apiRequest('/auth/me')
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          const ids = new Set((data.user.likedMusics || []).map((m) => (typeof m === 'string' ? m : m._id)));
          setLikedTrackIds(ids);
        }
      })
      .catch(() => {
        logout(false);
      });
  }, [token]);

  // Playback controls
  const playTrack = (track, newQueueList = null) => {
    if (!track) return;
    initWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    setCurrentTrack(track);

    if (newQueueList && Array.isArray(newQueueList)) {
      setQueue([...newQueueList]);
      const idx = newQueueList.findIndex((t) => t._id === track._id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else if (queue.length === 0) {
      setQueue([track]);
      setQueueIndex(0);
    }

    const audio = audioRef.current;
    if (audio.src !== track.uri) {
      audio.src = track.uri;
      audio.load();
    }

    audio.play().then(() => {
      setIsPlaying(true);
      // Increment play count asynchronously
      apiRequest(`/music/${track._id}/play`, { method: 'POST' }).catch(() => {});
    }).catch((err) => {
      console.warn('Play prevented:', err);
    });
  };

  const togglePlay = () => {
    if (!currentTrack && allTracks.length > 0) {
      playTrack(allTracks[0], allTracks);
      return;
    }
    initWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const playNext = (isAuto = false) => {
    if (queue.length === 0) return;
    let nextIdx;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') {
          nextIdx = 0;
        } else {
          if (isAuto) return;
          nextIdx = 0;
        }
      }
    }
    setQueueIndex(nextIdx);
    playTrack(queue[nextIdx], null);
  };

  const playPrev = () => {
    const audio = audioRef.current;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    setQueueIndex(prevIdx);
    playTrack(queue[prevIdx], null);
  };

  const seekTo = (percent) => {
    const audio = audioRef.current;
    if (audio.duration && !isNaN(audio.duration)) {
      audio.currentTime = percent * audio.duration;
    }
  };

  const setVolume = (val) => {
    setVolumeState(val);
    audioRef.current.volume = val;
    setIsMuted(val === 0);
    localStorage.setItem('groovify_volume', val.toString());
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
      audio.volume = volume || 0.8;
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const next = !prev;
      showToast(next ? 'Shuffle On' : 'Shuffle Off', 'info');
      return next;
    });
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') {
        showToast('Repeat All', 'info');
        return 'all';
      }
      if (prev === 'all') {
        showToast('Repeat Track', 'info');
        return 'track';
      }
      showToast('Repeat Off', 'info');
      return 'off';
    });
  };

  // Likes handling
  const toggleLike = async (trackId, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      showToast('Please log in to save songs to your library', 'info');
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }

    const wasLiked = likedTrackIds.has(trackId);
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(trackId);
      else next.add(trackId);
      return next;
    });

    try {
      const res = await apiRequest(`/music/${trackId}/like`, { method: 'POST' });
      showToast(res.message, 'success');
    } catch (err) {
      // Revert on error
      setLikedTrackIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(trackId);
        else next.delete(trackId);
        return next;
      });
      showToast('Failed to update favorite', 'error');
    }
  };

  // Auth methods
  const login = async (username, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('groovify_token', res.token);
    setAuthModalOpen(false);
    showToast(`Welcome back, ${res.user.username}!`, 'success');
    fetchInitialData();
  };

  const register = async (username, email, password, role) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role }),
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('groovify_token', res.token);
    setAuthModalOpen(false);
    showToast('Account created successfully!', 'success');
    fetchInitialData();
  };

  const logout = (showNotice = true) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('groovify_token');
    setLikedTrackIds(new Set());
    apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    if (showNotice) showToast('Logged out successfully', 'info');
  };

  // In-app navigation history stack
  const [historyStack, setHistoryStack] = useState([{ view: 'home', params: {}, searchQuery: '' }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigateTo = (view, params = {}) => {
    setCurrentView(view);
    if (params.albumId) setCurrentAlbumId(params.albumId);
    if (params.query !== undefined) setSearchQuery(params.query);

    setHistoryStack((prev) => {
      const currentEntry = prev[historyIndex];
      const newQuery = params.query !== undefined ? params.query : (view === 'search' ? searchQuery : '');
      const isSame =
        currentEntry &&
        currentEntry.view === view &&
        (currentEntry.params?.albumId || null) === (params.albumId || null) &&
        (currentEntry.searchQuery || '') === newQuery;

      if (isSame) return prev;

      const newStack = prev.slice(0, historyIndex + 1);
      newStack.push({ view, params, searchQuery: newQuery });
      setHistoryIndex(newStack.length - 1);
      return newStack;
    });
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      const target = historyStack[targetIdx];
      setHistoryIndex(targetIdx);
      setCurrentView(target.view);
      if (target.params?.albumId) {
        setCurrentAlbumId(target.params.albumId);
      }
      if (target.view === 'search' || target.searchQuery !== undefined) {
        setSearchQuery(target.searchQuery || '');
      }
    }
  };

  const goForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const targetIdx = historyIndex + 1;
      const target = historyStack[targetIdx];
      setHistoryIndex(targetIdx);
      setCurrentView(target.view);
      if (target.params?.albumId) {
        setCurrentAlbumId(target.params.albumId);
      }
      if (target.view === 'search' || target.searchQuery !== undefined) {
        setSearchQuery(target.searchQuery || '');
      }
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  return (
    <MusicContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        currentTrack,
        isPlaying,
        playTrack,
        togglePlay,
        playNext,
        playPrev,
        queue,
        queueIndex,
        isShuffle,
        toggleShuffle,
        repeatMode,
        toggleRepeat,
        currentTime,
        duration,
        seekTo,
        volume,
        setVolume,
        isMuted,
        toggleMute,
        likedTrackIds,
        toggleLike,
        currentView,
        navigateTo,
        goBack,
        goForward,
        canGoBack,
        canGoForward,
        currentAlbumId,
        setCurrentAlbumId,
        searchQuery,
        setSearchQuery,
        feedData,
        allTracks,
        allAlbums,
        setAllTracks,
        setAllAlbums,
        fetchInitialData,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        queueDrawerOpen,
        setQueueDrawerOpen,
        fullscreenOpen,
        setFullscreenOpen,
        toasts,
        showToast,
        analyserRef,
        dataArrayRef,
        apiRequest,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};
