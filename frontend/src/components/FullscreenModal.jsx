import React, { useRef, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { X, Play, Pause, SkipBack, SkipForward, Heart } from 'lucide-react';

export const FullscreenModal = () => {
  const {
    fullscreenOpen,
    setFullscreenOpen,
    currentTrack,
    isPlaying,
    togglePlay,
    playNext,
    playPrev,
    likedTrackIds,
    toggleLike,
    analyserRef,
    dataArrayRef,
  } = useMusic();

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!fullscreenOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      animationId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const count = 32;
        const barWidth = canvas.width / count - 2;
        let x = 0;
        const step = Math.floor(dataArrayRef.current.length / count);

        for (let i = 0; i < count; i++) {
          const val = dataArrayRef.current[i * step] || 0;
          const barHeight = Math.max((val / 255) * canvas.height, 4);

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, 'rgba(29, 185, 84, 0.8)');
          gradient.addColorStop(0.5, 'rgba(140, 82, 255, 0.8)');
          gradient.addColorStop(1, 'rgba(45, 115, 255, 0.8)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 2;
        }
      }
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [fullscreenOpen, isPlaying, analyserRef, dataArrayRef]);

  if (!fullscreenOpen) return null;

  const isLiked = currentTrack && likedTrackIds.has(currentTrack._id);

  return (
    <div className="fullscreen-overlay">
      <button
        className="history-btn"
        style={{ position: 'absolute', top: '28px', right: '28px', zIndex: 10, width: '44px', height: '44px' }}
        onClick={() => setFullscreenOpen(false)}
      >
        <X size={22} />
      </button>

      <div className="fullscreen-content">
        <img
          src={
            currentTrack?.coverImage ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
          }
          className="fullscreen-art"
          alt="Artwork"
        />

        <div style={{ textAlign: 'center' }}>
          <h1 className="fullscreen-title">{currentTrack?.title || 'Groovify Track'}</h1>
          <p className="fullscreen-artist">{currentTrack?.artist?.username || 'Artist'}</p>
        </div>

        {/* Live Audio Spectrum */}
        <canvas
          ref={canvasRef}
          width="400"
          height="60"
          style={{ borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}
        />

        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '12px' }}>
          <button className="control-btn" onClick={playPrev} title="Previous">
            <SkipBack size={24} />
          </button>

          <button
            className="play-pause-btn"
            style={{ width: '48px', height: '48px' }}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={22} fill="#000" color="#000" /> : <Play size={22} fill="#000" color="#000" style={{ marginLeft: '2px' }} />}
          </button>

          <button className="control-btn" onClick={() => playNext(false)} title="Next">
            <SkipForward size={24} />
          </button>

          {currentTrack && (
            <button
              className={`heart-action-btn ${isLiked ? 'active' : ''}`}
              onClick={(e) => toggleLike(currentTrack._id, e)}
              style={{ marginLeft: '8px' }}
            >
              <Heart size={22} fill={isLiked ? '#1db954' : 'none'} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
