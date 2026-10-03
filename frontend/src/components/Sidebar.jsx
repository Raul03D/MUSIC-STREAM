import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Home, Search, Heart, Sparkles, Disc, Plus } from 'lucide-react';

export const Sidebar = () => {
  const { currentView, navigateTo, allAlbums, likedTrackIds } = useMusic();

  const getDefaultCover = (genre) => {
    const genreMap = {
      synthwave: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      electronic: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      lofi: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      pop: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      rock: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      ambient: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    };
    return genreMap[(genre || 'synthwave').toLowerCase()] || genreMap.synthwave;
  };

  return (
    <aside className="sidebar">
      {/* Top Nav Panel */}
      <div className="sidebar-nav-panel">
        <div className="brand-logo" onClick={() => navigateTo('home')}>
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span>Groovify</span>
        </div>

        <ul className="nav-list">
          <li>
            <div
              className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => navigateTo('home')}
            >
              <Home size={22} />
              <span>Home</span>
            </div>
          </li>
          <li>
            <div
              className={`nav-item ${currentView === 'search' ? 'active' : ''}`}
              onClick={() => navigateTo('search')}
            >
              <Search size={22} />
              <span>Search</span>
            </div>
          </li>
          <li>
            <div
              className={`nav-item ${currentView === 'liked' ? 'active' : ''}`}
              onClick={() => navigateTo('liked')}
            >
              <Heart size={22} />
              <span>Liked Songs</span>
            </div>
          </li>
          <li>
            <div
              className={`nav-item ${currentView === 'studio' ? 'active' : ''}`}
              onClick={() => navigateTo('studio')}
            >
              <Sparkles size={22} />
              <span>Artist Studio</span>
            </div>
          </li>
        </ul>
      </div>

      {/* Library Panel */}
      <div className="sidebar-library-panel">
        <div className="library-header">
          <div className="library-title" onClick={() => navigateTo('home')}>
            <Disc size={22} />
            <span>Your Library</span>
          </div>
          <div className="library-actions">
            <button
              className="icon-button"
              onClick={() => navigateTo('studio')}
              title="Create Album or Track"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="library-filters">
          <button className="pill-filter active" onClick={() => navigateTo('home')}>
            Playlists
          </button>
          <button className="pill-filter" onClick={() => navigateTo('search')}>
            Albums
          </button>
          <button className="pill-filter" onClick={() => navigateTo('studio')}>
            Artists
          </button>
        </div>

        <div className="library-list">
          {/* Liked Songs Entry */}
          <div
            className={`library-item ${currentView === 'liked' ? 'active' : ''}`}
            onClick={() => navigateTo('liked')}
          >
            <div className="library-item-thumb liked-badge">
              <Heart size={20} fill="#fff" color="#fff" />
            </div>
            <div className="library-item-info">
              <span className="library-item-title">Liked Songs</span>
              <span className="library-item-subtitle">Playlist • {likedTrackIds.size} songs</span>
            </div>
          </div>

          {/* Albums list */}
          {allAlbums.map((album) => (
            <div
              key={album._id}
              className={`library-item ${currentView === 'album' ? 'active' : ''}`}
              onClick={() => navigateTo('album', { albumId: album._id })}
            >
              <img
                src={album.coverImage || getDefaultCover(album.genre)}
                className="library-item-thumb"
                alt={album.title}
              />
              <div className="library-item-info">
                <span className="library-item-title">{album.title}</span>
                <span className="library-item-subtitle">
                  Album • {album.artist?.username || 'Artist'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="artist-promo-box">
          <h4>Are you a Music Creator?</h4>
          <p>Upload your tracks, create studio albums, and reach listeners worldwide.</p>
          <button
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px', alignSelf: 'flex-start', marginTop: '4px' }}
            onClick={() => navigateTo('studio')}
          >
            Open Studio
          </button>
        </div>
      </div>
    </aside>
  );
};
