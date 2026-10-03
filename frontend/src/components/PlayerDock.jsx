import React, { useRef, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Maximize2,
} from 'lucide-react';

export const PlayerDock = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    playNext,
    playPrev,
    currentTime,
    duration,
    seekTo,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    likedTrackIds,
    toggleLike,
    queueDrawerOpen,
    setQueueDrawerOpen,
    fullscreenOpen,
    setFullscreenOpen,
    analyserRef,
    dataArrayRef,
  } = useMusic();

  const canvasRef = useRef(null);

  // Mini Visualizer Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      animationId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const barWidth = 4;
        let x = 0;
        const count = 8;
        const step = Math.floor(dataArrayRef.current.length / count);

        for (let i = 0; i < count; i++) {
          const val = dataArrayRef.current[i * step] || 0;
          const barHeight = Math.max((val / 255) * canvas.height, 3);
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#1db954');
          gradient.addColorStop(1, '#1ed760');
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 3;
        }
      } else {
        const resting = [4, 6, 8, 5, 7, 4, 6, 3];
        let x = 0;
        resting.forEach((h) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(x, canvas.height - h, 4, h);
          x += 7;
        });
      }
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, analyserRef, dataArrayRef]);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleScrubberClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    seekTo(percent);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const isLiked = currentTrack && likedTrackIds.has(currentTrack._id);

  return (
    <footer className="player-dock">
      {/* Player Left: Current Track Details */}
      <div className="player-left">
        <img
          src={
            currentTrack?.coverImage ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
          }
          className="player-thumb"
          alt="Artwork"
        />
        <div className="player-track-info">
          <span className="player-track-title">{currentTrack?.title || 'Select a track'}</span>
          <span className="player-track-artist">
            {currentTrack?.artist?.username || 'Groovify Music'}
          </span>
        </div>
        {currentTrack && (
          <button
            className={`heart-action-btn ${isLiked ? 'active' : ''}`}
            onClick={(e) => toggleLike(currentTrack._id, e)}
            title="Save to Liked Songs"
          >
            <Heart size={18} fill={isLiked ? '#1db954' : 'none'} />
          </button>
        )}
      </div>

      {/* Player Center: Controls & Progress */}
      <div className="player-center">
        <div className="player-buttons">
          <button
            className={`control-btn ${isShuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            title="Shuffle"
          >
            <Shuffle size={18} />
          </button>

          <button className="control-btn" onClick={playPrev} title="Previous Track">
            <SkipBack size={20} />
          </button>

          <button className="play-pause-btn" onClick={togglePlay} title="Play / Pause">
            {isPlaying ? (
              <Pause size={18} fill="#000" color="#000" />
            ) : (
              <Play size={18} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
            )}
          </button>

          <button className="control-btn" onClick={() => playNext(false)} title="Next Track">
            <SkipForward size={20} />
          </button>

          <button
            className={`control-btn ${repeatMode !== 'off' ? 'active' : ''}`}
            onClick={toggleRepeat}
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat size={18} />
          </button>
        </div>

        {/* Scrubber */}
        <div className="scrubber-wrapper">
          <span className="time-stamp">{formatTime(currentTime)}</span>
          <div className="progress-bar-container" onClick={handleScrubberClick}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }}>
                <div className="progress-handle"></div>
              </div>
            </div>
          </div>
          <span className="time-stamp">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Player Right: Visualizer, Queue, Volume, Fullscreen */}
      <div className="player-right">
        {/* Real-time mini audio visualizer canvas */}
        <canvas
          ref={canvasRef}
          className="visualizer-canvas-mini"
          width="70"
          height="24"
          title="Live Audio Visualizer"
        />

        <button
          className="control-btn"
          onClick={() => setQueueDrawerOpen(!queueDrawerOpen)}
          title="Play Queue"
        >
          <ListMusic size={18} />
        </button>

        <div className="volume-wrapper">
          <button className="control-btn" onClick={toggleMute} title="Mute / Unmute">
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="progress-bar-container" style={{ flex: 1 }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--spotify-green)', cursor: 'pointer' }}
            />
          </div>
        </div>

        <button
          className="control-btn"
          onClick={() => setFullscreenOpen(!fullscreenOpen)}
          title="Fullscreen Mode"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </footer>
  );
};
