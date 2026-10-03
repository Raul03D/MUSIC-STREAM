import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { PlayerDock } from './components/PlayerDock';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { AlbumView } from './components/AlbumView';
import { LikedView } from './components/LikedView';
import { StudioView } from './components/StudioView';
import { AuthModal } from './components/AuthModal';
import { QueueDrawer } from './components/QueueDrawer';
import { FullscreenModal } from './components/FullscreenModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const AppContent = () => {
  const { currentView, currentTrack, toasts } = useMusic();

  const getAmbientGlow = (genre) => {
    const colors = {
      hindi: 'radial-gradient(circle at 40% 10%, rgba(255, 123, 0, 0.38) 0%, transparent 70%)',
      bengali: 'radial-gradient(circle at 40% 10%, rgba(230, 57, 70, 0.38) 0%, transparent 70%)',
      english: 'radial-gradient(circle at 40% 10%, rgba(0, 180, 216, 0.38) 0%, transparent 70%)',
      bollywood: 'radial-gradient(circle at 40% 10%, rgba(217, 4, 41, 0.38) 0%, transparent 70%)',
      synthwave: 'radial-gradient(circle at 40% 10%, rgba(140, 82, 255, 0.35) 0%, transparent 70%)',
      electronic: 'radial-gradient(circle at 40% 10%, rgba(45, 115, 255, 0.35) 0%, transparent 70%)',
      lofi: 'radial-gradient(circle at 40% 10%, rgba(255, 179, 71, 0.3) 0%, transparent 70%)',
      pop: 'radial-gradient(circle at 40% 10%, rgba(255, 77, 109, 0.35) 0%, transparent 70%)',
      rock: 'radial-gradient(circle at 40% 10%, rgba(230, 57, 70, 0.35) 0%, transparent 70%)',
      ambient: 'radial-gradient(circle at 40% 10%, rgba(29, 185, 84, 0.3) 0%, transparent 70%)',
    };
    const key = (genre || 'synthwave').toLowerCase().replace(/[^a-z]/g, '');
    return colors[key] || colors.synthwave;
  };

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Viewport */}
      <main className="main-content" id="mainContent">
        <div
          className="ambient-glow"
          style={{ background: getAmbientGlow(currentTrack?.genre) }}
        />

        <TopBar />

        <div className="view-container">
          {currentView === 'home' && <HomeView />}
          {currentView === 'search' && <SearchView />}
          {currentView === 'album' && <AlbumView />}
          {currentView === 'liked' && <LikedView />}
          {currentView === 'studio' && <StudioView />}
        </div>
      </main>

      {/* Persistent Bottom Player Dock */}
      <PlayerDock />

      {/* Modals & Overlays */}
      <AuthModal />
      <QueueDrawer />
      <FullscreenModal />

      {/* Toast Notifications Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.type === 'success' && <CheckCircle2 size={18} color="#1db954" />}
            {toast.type === 'error' && <AlertCircle size={18} color="#ff4d6d" />}
            {toast.type === 'info' && <Info size={18} color="#1db954" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
}
