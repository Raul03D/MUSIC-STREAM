import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Play, Heart, ArrowLeft, Disc, Music as MusicIcon } from 'lucide-react';

export const SearchView = () => {
  const {
    searchQuery,
    setSearchQuery,
    allTracks,
    allAlbums,
    playTrack,
    currentTrack,
    isPlaying,
    likedTrackIds,
    toggleLike,
    navigateTo,
  } = useMusic();

  const [showAllTracks, setShowAllTracks] = useState(false);

  const getDefaultCover = (genre) => {
    const genreMap = {
      hindi: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
      bengali: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
      english: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      bollywood: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
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

  const formatPlays = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const trimmed = searchQuery.trim().toLowerCase();

  // If no search query, show the Browse all genre cards grid
  if (!trimmed) {
    return (
      <section>
        <h1 className="section-title" style={{ marginBottom: '24px' }}>
          Browse all
        </h1>
        <div className="genre-grid">
          {genres.map((g) => (
            <div
              key={g.name}
              className="genre-card"
              style={{ background: g.color }}
              onClick={() => navigateTo('search', { query: g.name })}
            >
              <h3>{g.name}</h3>
              <img src={g.img} className="genre-card-art" alt={g.name} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Check if current search matches a specific Genre Card
  const matchedGenre = genres.find(
    (g) => g.name.toLowerCase() === trimmed || g.name.toLowerCase().replace(/[^a-z]/g, '') === trimmed.replace(/[^a-z]/g, '')
  );

  const matchingTracks = allTracks.filter((t) => {
    if (matchedGenre) {
      return (t.genre || '').toLowerCase().replace(/[^a-z]/g, '') === matchedGenre.name.toLowerCase().replace(/[^a-z]/g, '');
    }
    const titleMatch = (t.title || '').toLowerCase().includes(trimmed);
    const genreMatch = (t.genre || '').toLowerCase().includes(trimmed);
    const artistMatch = t.artist && t.artist.username && t.artist.username.toLowerCase().includes(trimmed);
    return titleMatch || genreMatch || artistMatch;
  });

  const matchingAlbums = allAlbums.filter((a) => {
    if (matchedGenre) {
      return (a.genre || '').toLowerCase().replace(/[^a-z]/g, '') === matchedGenre.name.toLowerCase().replace(/[^a-z]/g, '');
    }
    const titleMatch = (a.title || '').toLowerCase().includes(trimmed);
    const genreMatch = (a.genre || '').toLowerCase().includes(trimmed);
    return titleMatch || genreMatch;
  });

  // No results found
  if (matchingTracks.length === 0 && matchingAlbums.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>
          No results found for "{searchQuery}"
        </h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '14px', marginBottom: '20px' }}>
          Please make sure your words are spelled correctly or browse our genre categories.
        </p>
        <button
          className="btn-secondary"
          onClick={() => navigateTo('search', { query: '' })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Browse All
        </button>
      </div>
    );
  }

  // ------------------ DEDICATED GENRE EXPERIENCE VIEW (100 SONGS) ------------------
  if (matchedGenre) {
    return (
      <div className="genre-view-container">
        {/* Back Link */}
        <button
          className="btn-ghost"
          onClick={() => navigateTo('search', { query: '' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-sub)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px',
            padding: '4px 0',
          }}
        >
          <ArrowLeft size={16} /> Back to All Categories
        </button>

        {/* Rich Hero Banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${matchedGenre.color} 0%, rgba(18, 18, 18, 0.95) 85%)`,
            borderRadius: 'var(--radius-lg)',
            padding: '36px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <img
            src={matchedGenre.img}
            alt={matchedGenre.name}
            style={{
              width: '160px',
              height: '160px',
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1 }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                color: '#fff',
                opacity: 0.9,
              }}
            >
              Curated Genre Playlist
            </span>
            <h1
              style={{
                fontSize: 'clamp(36px, 6vw, 64px)',
                fontWeight: 900,
                letterSpacing: '-1.5px',
                lineHeight: 1,
                color: '#fff',
              }}
            >
              {matchedGenre.name}
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', fontWeight: 500 }}>
              {matchingTracks.length} Unique Songs • {matchingAlbums.length} Curated Albums • Verified Audio Previews
            </p>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                className="btn-primary"
                onClick={() => matchingTracks.length > 0 && playTrack(matchingTracks[0], matchingTracks)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '15px',
                  fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(29, 185, 84, 0.4)',
                }}
              >
                <Play size={20} fill="#000" color="#000" /> Play All {matchingTracks.length} Songs
              </button>
            </div>
          </div>
        </div>

        {/* Curated Albums in this Genre */}
        {matchingAlbums.length > 0 && (
          <section style={{ marginBottom: '36px' }}>
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Disc size={20} color="var(--spotify-green)" /> {matchedGenre.name} Albums
              </h2>
            </div>
            <div className="media-grid">
              {matchingAlbums.map((album) => (
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
                  <div className="media-card-subtitle">{album.description || album.artist?.username || 'Album'}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All 100 Songs in this Genre */}
        <section>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MusicIcon size={20} color="var(--spotify-green)" /> All {matchedGenre.name} Songs ({matchingTracks.length})
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
              100% Unique Songs • No Duplicates
            </span>
          </div>

          <table className="track-table">
            <thead>
              <tr>
                <th className="th-num">#</th>
                <th>Title</th>
                <th>Album</th>
                <th>Plays</th>
                <th className="th-time">Time</th>
                <th className="th-actions"></th>
              </tr>
            </thead>
            <tbody>
              {matchingTracks.map((track, idx) => {
                const isCurrent = currentTrack?._id === track._id;
                const isLiked = likedTrackIds.has(track._id);
                return (
                  <tr
                    key={track._id}
                    className={`track-row ${isCurrent ? 'active' : ''}`}
                    onClick={() => playTrack(track, matchingTracks)}
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
                          loading="lazy"
                        />
                        <div className="track-meta">
                          <span className="track-title-text">{track.title}</span>
                          <span className="track-artist-text">
                            {track.artist?.username || 'Groovify Artist'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-sub)', fontSize: '13px' }}>
                      {track.album?.title || `${matchedGenre.name} Collection`}
                    </td>
                    <td className="track-plays-text">{formatPlays(track.plays || 0)}</td>
                    <td className="track-duration-text">{formatTime(track.duration)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`heart-action-btn ${isLiked ? 'active' : ''}`}
                        onClick={(e) => toggleLike(track._id, e)}
                        title={isLiked ? 'Remove from Liked' : 'Add to Liked'}
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
      </div>
    );
  }

  // ------------------ GENERAL SEARCH VIEW (SEARCH BY KEYWORD) ------------------
  const topTrack = matchingTracks[0];
  const displayedTracks = showAllTracks ? matchingTracks : matchingTracks.slice(0, 5);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '24px', marginBottom: '32px' }}>
        {topTrack && (
          <div>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
              Top Result
            </h2>
            <div
              className="media-card"
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
              onClick={() => playTrack(topTrack, matchingTracks)}
            >
              <img
                src={topTrack.coverImage || getDefaultCover(topTrack.genre)}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                }}
                alt={topTrack.title}
              />
              <div>
                <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
                  {topTrack.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
                    {topTrack.artist?.username || 'Groovify Artist'}
                  </span>
                  <span className="role-badge" style={{ fontSize: '10px' }}>
                    {topTrack.genre || 'Song'}
                  </span>
                </div>
              </div>
              <button
                className="quick-pick-play-btn"
                style={{ opacity: 1, transform: 'none', width: '48px', height: '48px', marginTop: 'auto' }}
                onClick={(e) => {
                  e.stopPropagation();
                  playTrack(topTrack, matchingTracks);
                }}
              >
                <Play size={22} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
              </button>
            </div>
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="section-title">Songs</h2>
            {matchingTracks.length > 5 && (
              <button
                onClick={() => setShowAllTracks(!showAllTracks)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-sub)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {showAllTracks ? 'Show less' : `See all ${matchingTracks.length} songs`}
              </button>
            )}
          </div>

          <table className="track-table">
            <tbody>
              {displayedTracks.map((track, idx) => {
                const isCurrent = currentTrack?._id === track._id;
                const isLiked = likedTrackIds.has(track._id);
                return (
                  <tr
                    key={track._id}
                    className={`track-row ${isCurrent ? 'active' : ''}`}
                    onClick={() => playTrack(track, matchingTracks)}
                  >
                    <td className="track-num-cell" style={{ width: '32px' }}>
                      {isCurrent && isPlaying ? (
                        <span style={{ color: 'var(--spotify-green)', fontWeight: 700 }}>▶</span>
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
                    <td className="track-duration-text">{formatTime(track.duration)}</td>
                    <td style={{ textAlign: 'center', width: '40px' }}>
                      <button
                        className={`heart-action-btn ${isLiked ? 'active' : ''}`}
                        onClick={(e) => toggleLike(track._id, e)}
                      >
                        <Heart size={16} fill={isLiked ? '#1db954' : 'none'} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {matchingAlbums.length > 0 && (
        <section>
          <h2 className="section-title" style={{ marginBottom: '16px' }}>
            Albums
          </h2>
          <div className="media-grid">
            {matchingAlbums.map((album) => (
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
                <div className="media-card-subtitle">{album.artist?.username || 'Artist'}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
};
