import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Heart } from 'lucide-react';

export const LikedView = () => {
  const {
    user,
    playTrack,
    currentTrack,
    isPlaying,
    likedTrackIds,
    toggleLike,
    setAuthModalOpen,
    setAuthModalTab,
    apiRequest,
  } = useMusic();

  const [likedTracks, setLikedTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiRequest('/music/liked/all')
      .then((data) => {
        setLikedTracks(data.musics || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [user, likedTrackIds]);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Sign in to view Liked Songs</h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: '24px' }}>
          Save your favorite tracks to listen whenever you want.
        </p>
        <button
          className="btn-primary"
          onClick={() => {
            setAuthModalTab('login');
            setAuthModalOpen(true);
          }}
        >
          Log In
        </button>
      </div>
    );
  }

  if (loading && likedTracks.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <span style={{ color: 'var(--spotify-green)', fontSize: '16px', fontWeight: '700' }}>
          Loading your liked tracks...
        </span>
      </div>
    );
  }

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
        <div
          className="album-hero-cover"
          style={{
            background: 'linear-gradient(135deg, #450af5 0%, #c4efd9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart size={80} fill="#fff" color="#fff" />
        </div>
        <div className="album-hero-details">
          <span className="album-hero-tag">Playlist</span>
          <h1 className="album-hero-title">Liked Songs</h1>
          <div className="album-hero-meta">
            <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{user.username}</span>
            <span className="bullet">•</span>
            <span>{likedTracks.length} songs</span>
          </div>
        </div>
      </div>

      {likedTracks.length > 0 ? (
        <>
          <div className="album-actions-bar">
            <button
              className="album-big-play-btn"
              onClick={() => playTrack(likedTracks[0], likedTracks)}
              title="Play Liked Songs"
            >
              <Play size={26} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
            </button>
          </div>

          <table className="track-table">
            <thead>
              <tr>
                <th className="th-num">#</th>
                <th>Title</th>
                <th>Genre</th>
                <th>Plays</th>
                <th className="th-time">Time</th>
                <th className="th-actions"></th>
              </tr>
            </thead>
            <tbody>
              {likedTracks.map((track, idx) => {
                const isCurrent = currentTrack?._id === track._id;
                const isLiked = likedTrackIds.has(track._id);
                return (
                  <tr
                    key={track._id}
                    className={`track-row ${isCurrent ? 'active' : ''}`}
                    onClick={() => playTrack(track, likedTracks)}
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
                        <img
                          src={track.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
                          className="track-thumb-img"
                          alt={track.title}
                        />
                        <div className="track-meta">
                          <span className="track-title-text">{track.title}</span>
                          <span className="track-artist-text">
                            {track.artist?.username || 'Groovify Artist'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-sub)', fontSize: '13px' }}>{track.genre}</td>
                    <td className="track-plays-text">{formatNumber(track.plays || 0)}</td>
                    <td className="track-duration-text">{formatTime(track.duration)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`heart-action-btn ${isLiked ? 'active' : ''}`}
                        onClick={(e) => toggleLike(track._id, e)}
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
      ) : (
        <div style={{ padding: '48px 0', color: 'var(--text-sub)' }}>
          <h3>Songs you like will appear here</h3>
          <p style={{ marginTop: '6px', fontSize: '13px' }}>
            Save songs by clicking the heart icon on any track.
          </p>
        </div>
      )}
    </>
  );
};
