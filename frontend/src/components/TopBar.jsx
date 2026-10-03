import React from 'react';
import { useMusic } from '../context/MusicContext';
import { ChevronLeft, ChevronRight, Search as SearchIcon, LogOut } from 'lucide-react';

export const TopBar = () => {
  const {
    user,
    logout,
    currentView,
    navigateTo,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    searchQuery,
    setSearchQuery,
    setAuthModalOpen,
    setAuthModalTab,
  } = useMusic();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentView !== 'search') {
      navigateTo('search', { query: e.target.value });
    }
  };

  const handleProfileClick = () => {
    if (window.confirm(`Logged in as ${user.username} (${user.role}). Do you want to log out?`)) {
      logout(true);
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div className="history-buttons">
          <button
            className={`history-btn ${!canGoBack ? 'disabled' : ''}`}
            onClick={goBack}
            disabled={!canGoBack}
            title={canGoBack ? "Go back" : ""}
            style={{
              opacity: canGoBack ? 1 : 0.35,
              cursor: canGoBack ? 'pointer' : 'not-allowed',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className={`history-btn ${!canGoForward ? 'disabled' : ''}`}
            onClick={goForward}
            disabled={!canGoForward}
            title={canGoForward ? "Go forward" : ""}
            style={{
              opacity: canGoForward ? 1 : 0.35,
              cursor: canGoForward ? 'pointer' : 'not-allowed',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dynamic Search Bar */}
        <div className="top-search-wrapper" style={{ display: currentView === 'search' ? 'block' : 'none' }}>
          <SearchIcon size={18} className="search-icon-inside" />
          <input
            type="text"
            className="top-search-input"
            placeholder="What do you want to play?"
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus={currentView === 'search'}
          />
        </div>
      </div>

      <div className="top-bar-right">
        {user ? (
          <div className="user-chip" onClick={handleProfileClick} title="Click to log out">
            <div className="user-avatar">
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="user-name-text">{user.username}</span>
            <span className={`role-badge ${user.role === 'artist' ? 'artist' : ''}`}>
              {user.role}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={() => {
                setAuthModalTab('register');
                setAuthModalOpen(true);
              }}
            >
              Sign up
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setAuthModalTab('login');
                setAuthModalOpen(true);
              }}
            >
              Log in
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
