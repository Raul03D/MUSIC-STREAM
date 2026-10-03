import React from 'react';
import { useMusic } from '../context/MusicContext';
import { X } from 'lucide-react';

export const QueueDrawer = () => {
  const {
    queueDrawerOpen,
    setQueueDrawerOpen,
    queue,
    queueIndex,
    playTrack,
    currentTrack,
  } = useMusic();

  if (!queueDrawerOpen) return null;

  return (
    <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: '16px' }}>
      <div
        className="modal-box"
        style={{
          maxWidth: '440px',
          height: '82vh',
          display: 'flex',
          flexDirection: 'column',
          margin: 0,
        }}
      >
        <button className="modal-close-btn" onClick={() => setQueueDrawerOpen(false)}>
          <X size={18} />
        </button>

        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Play Queue</h2>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {queue.length === 0 ? (
            <p style={{ color: 'var(--text-sub)', fontSize: '14px', padding: '20px 0' }}>
              No tracks in queue
            </p>
          ) : (
            queue.map((track, idx) => {
              const isCurrent = idx === queueIndex;
              return (
                <div
                  key={`${track._id}-${idx}`}
                  className={`library-item ${isCurrent ? 'active' : ''}`}
                  onClick={() => playTrack(track, queue)}
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-sub)', width: '20px' }}>
                    {idx + 1}
                  </span>
                  <img
                    src={track.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'}
                    className="library-item-thumb"
                    style={{ width: '38px', height: '38px' }}
                    alt={track.title}
                  />
                  <div className="library-item-info">
                    <span
                      className="library-item-title"
                      style={isCurrent ? { color: 'var(--spotify-green)' } : {}}
                    >
                      {track.title}
                    </span>
                    <span className="library-item-subtitle">
                      {track.artist?.username || 'Artist'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
