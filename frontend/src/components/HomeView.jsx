import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Heart } from 'lucide-react';

export const HomeView = () => {
  const {
    feedData,
    allTracks,
    allAlbums,
    playTrack,
    currentTrack,
    isPlaying,
    likedTrackIds,
    toggleLike,
    navigateTo,
    setSearchQuery,
  } = useMusic();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const trending = feedData?.trendingTracks || allTracks.slice(0, 8);
  const albums = feedData?.featuredAlbums || allAlbums;
  const quickPicks = trending.slice(0, 6);

  const getDefaultCover = (genre) => {
    const genreMap = {
      hindi: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
      bengali: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
      english: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      bollywood: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
      synthwave: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      electronic: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      lofi: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      pop: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      rock: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      ambient: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    };
    return genreMap[(genre || 'synthwave').toLowerCase()] || genreMap.synthwave;
  };

  const genres = [
    { name: 'Hindi', color: '#ff7b00', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80' },
    { name: 'Bengali', color: '#e63946', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80' },
    { name: 'English', color: '#00b4d8', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80' },
    { name: 'Bollywood', color: '#d90429', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80' },
    { name: 'Pop', color: '#e91e63', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80' },
    { name: 'Lo-Fi', color: '#ba5d2c', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80' },
    { name: 'Synthwave', color: '#8c52ff', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80' },
    { name: 'Electronic', color: '#2d73ff', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80' },
  ];

  const formatTime = (secs) => {
    const mins = Math.floor((secs || 180) / 60);
    const s = Math.floor((secs || 180) % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <>
      {/* Hero Greeting & Quick Picks */}
      <section>
        <h1 className="section-title" style={{ fontSize: '32px', marginBottom: '20px' }}>
          {getGreeting()}
        </h1>
        <div className="quick-picks-grid">
          {quickPicks.map((track) => (
            <div
              key={track._id}
              className="quick-pick-card"
              onClick={() => playTrack(track, allTracks)}
            >
              <img
                src={track.coverImage || getDefaultCover(track.genre)}
                className="quick-pick-thumb"
                alt={track.title}
              />
              <span className="quick-pick-title">{track.title}</span>
              <button
                className="quick-pick-play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  playTrack(track, allTracks);
                }}
              >
                <Play size={20} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Albums */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Featured Albums</h2>
          <span className="section-link" onClick={() => navigateTo('search')}>
            Show all
          </span>
        </div>
        <div className="media-grid">
          {albums.map((album) => (
            <div
              key={album._id}
              className="media-card"
              onClick={() => navigateTo('album', { albumId: album._id })}
            >
              <div className="media-card-artwork">
                <img
                  src={album.coverImage || getDefaultCover(album.genre)}
                  className="media-card-img"
                  alt={album.title}
                />
                <button
                  className="media-card-play-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo('album', { albumId: album._id });
                  }}
                >
                  <Play size={22} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
                </button>
              </div>
              <div className="media-card-title">{album.title}</div>
              <div className="media-card-subtitle">
                {album.description || album.artist?.username || 'Groovify Collection'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Tracks */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Trending Tracks</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-sub)', fontWeight: '600' }}>
            Updated Hourly
          </span>
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
            {trending.map((track, idx) => {
              const isCurrent = currentTrack?._id === track._id;
              const isLiked = likedTrackIds.has(track._id);
              return (
                <tr
                  key={track._id}
                  className={`track-row ${isCurrent ? 'active' : ''}`}
                  onClick={() => playTrack(track, trending)}
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
                        src={track.coverImage || getDefaultCover(track.genre)}
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
      </section>

      {/* Popular Genres */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Popular Genres</h2>
        </div>
        <div className="genre-grid">
          {genres.map((g) => (
            <div
              key={g.name}
              className="genre-card"
              style={{ background: g.color }}
              onClick={() => {
                navigateTo('search', { query: g.name });
              }}
            >
              <h3>{g.name}</h3>
              <img src={g.img} className="genre-card-art" alt={g.name} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
