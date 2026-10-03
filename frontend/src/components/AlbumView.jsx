import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Heart } from 'lucide-react';

export const AlbumView = () => {
  const {
    currentAlbumId,
    playTrack,
    currentTrack,
    isPlaying,
    likedTrackIds,
    toggleLike,
    navigateTo,
    apiRequest,
  } = useMusic();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentAlbumId) {
      navigateTo('home');
      return;
    }
    setLoading(true);
    apiRequest(`/music/albums/${currentAlbumId}`)
      .then((data) => {
        setAlbum(data.album);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [currentAlbumId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <span style={{ color: 'var(--spotify-green)', fontSize: '16px', fontWeight: '700' }}>
          Loading album...
        </span>
      </div>
    );
  }

  if (!album) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Album not found</h2>
        <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => navigateTo('home')}>
          Back to Home
        </button>
      </div>
    );
  }

  const tracks = album.musics || [];
  const totalSec = tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
  const totalMins = Math.floor(totalSec / 60);

  const formatTime = (secs) => {
    const mins = Math.floor((secs || 180) / 60);
    const s = Math.floor((secs || 180) % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <>
      <div className="album-hero">
        <img src={album.coverImage} className="album-hero-cover" alt={album.title} />
        <div className="album-hero-details">
          <span className="album-hero-tag">Album</span>
          <h1 className="album-hero-title">{album.title}</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-sub)', marginTop: '4px' }}>
            {album.description}
          </p>
          <div className="album-hero-meta">
            <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>
              {album.artist?.username || 'Groovify Artist'}
            </span>
            <span className="bullet">•</span>
            <span>{album.releaseYear || 2025}</span>
            <span className="bullet">•</span>
            <span>
              {tracks.length} songs, approx. {totalMins} min
            </span>
          </div>
        </div>
      </div>

      <div className="album-actions-bar">
        <button
          className="album-big-play-btn"
          onClick={() => {
            if (tracks.length > 0) {
              playTrack(tracks[0], tracks);
            }
          }}
          title="Play album"
        >
          <Play size={26} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
        </button>
      </div>

      <table className="track-table">
        <thead>
          <tr>
            <th className="th-num">#</th>
            <th>Title</th>
            <th>Plays</th>
            <th className="th-time">Time</th>
            <th className="th-actions"></th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, idx) => {
            const isCurrent = currentTrack?._id === track._id;
            const isLiked = likedTrackIds.has(track._id);
            return (
              <tr
                key={track._id}
                className={`track-row ${isCurrent ? 'active' : ''}`}
                onClick={() => playTrack(track, tracks)}
              >
                <td className="track-num-cell">
                  {isCurrent && isPlaying ? (
                    <div className="equalizer-anim">
                      <div className="eq-bar"></div>
                      <div className="eq-bar"></div>
                      <div className="eq-bar"></div>
                      <div className="eq-bar"></div>
                    </div>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </td>
                <td>
                  <div className="track-title-cell">
                    <div className="track-meta">
                      <span className="track-title-text">{track.title}</span>
                      <span className="track-artist-text">
                        {track.artist?.username || album.artist?.username || 'Artist'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="track-plays-text">{formatNumber(track.plays || 0)}</td>
                <td className="track-duration-text">{formatTime(track.duration)}</td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className={`heart-action-btn ${isLiked ? 'active' : ''}`}
                    onClick={(e) => toggleLike(track._id, e)}
                    title="Save to favorites"
                  >
                    <Heart size={18} fill={isLiked ? '#1db954' : 'none'} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};
