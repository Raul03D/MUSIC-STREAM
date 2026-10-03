import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Upload, Disc, Music } from 'lucide-react';

export const StudioView = () => {
  const {
    user,
    allAlbums,
    setAllTracks,
    setAllAlbums,
    playTrack,
    navigateTo,
    showToast,
    apiRequest,
    setAuthModalOpen,
    setAuthModalTab,
  } = useMusic();

  const isArtist = user && user.role === 'artist';

  // Upload track state
  const [selectedFile, setSelectedFile] = useState(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackGenre, setTrackGenre] = useState('Synthwave');
  const [trackDuration, setTrackDuration] = useState('180');
  const [trackCover, setTrackCover] = useState('');
  const [trackAlbumId, setTrackAlbumId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Create album state
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumGenre, setAlbumGenre] = useState('Synthwave');
  const [albumYear, setAlbumYear] = useState('2026');
  const [albumCover, setAlbumCover] = useState('');
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!isArtist) {
      showToast('Artist privileges required. Please switch to Demo Artist.', 'error');
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }

    if (!selectedFile) {
      showToast('Please select an audio file', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('music', selectedFile);
    formData.append('title', trackTitle.trim());
    formData.append('genre', trackGenre);
    formData.append('duration', trackDuration || 180);
    if (trackCover.trim()) formData.append('coverImage', trackCover.trim());
    if (trackAlbumId) formData.append('albumId', trackAlbumId);

    setIsUploading(true);

    try {
      const res = await apiRequest('/music/upload', {
        method: 'POST',
        body: formData,
      });

      showToast('Track published successfully!', 'success');
      if (res.music) {
        setAllTracks((prev) => [res.music, ...prev]);
        playTrack(res.music);
      }
      setSelectedFile(null);
      setTrackTitle('');
      setTrackCover('');
      navigateTo('home');
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAlbumSubmit = async (e) => {
    e.preventDefault();
    if (!isArtist) {
      showToast('Artist privileges required. Please switch to Demo Artist.', 'error');
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }

    setIsCreatingAlbum(true);

    try {
      const res = await apiRequest('/music/album', {
        method: 'POST',
        body: JSON.stringify({
          title: albumTitle.trim(),
          description: albumDesc.trim(),
          genre: albumGenre,
          releaseYear: Number(albumYear) || 2026,
          coverImage: albumCover.trim(),
        }),
      });

      showToast('Album created successfully!', 'success');
      if (res.album) {
        setAllAlbums((prev) => [res.album, ...prev]);
        navigateTo('album', { albumId: res.album._id });
      }
      setAlbumTitle('');
      setAlbumDesc('');
      setAlbumCover('');
    } catch (err) {
      showToast('Album creation failed: ' + err.message, 'error');
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '32px' }}>
            Artist Studio
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '14px', marginTop: '4px' }}>
            Upload your original soundscapes and publish full albums.
          </p>
        </div>
        {!isArtist && (
          <div
            style={{
              background: 'rgba(140,82,255,0.15)',
              border: '1px solid rgba(140,82,255,0.4)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: '#c4a4ff',
            }}
          >
            Listener Mode active. Switch to <strong>Demo Artist</strong> to upload tracks and create albums.
          </div>
        )}
      </div>

      <div className="studio-container">
        {/* Upload Track Card */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-icon">
              <Upload size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Upload New Track</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                Supported formats: MP3, WAV, AAC (up to 50MB)
              </p>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label>Audio File *</label>
              <div
                className="file-dropzone"
                onClick={() => document.getElementById('reactAudioFileInput').click()}
              >
                <Music size={32} />
                <p>
                  <span className="highlight">Choose audio file</span> or drag & drop here
                </p>
                {selectedFile && (
                  <span style={{ fontSize: '12px', color: 'var(--spotify-green)', fontWeight: 600 }}>
                    Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                )}
                <input
                  type="file"
                  id="reactAudioFileInput"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label>Track Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Midnight Horizon"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>Genre</label>
                <select
                  className="form-select"
                  value={trackGenre}
                  onChange={(e) => setTrackGenre(e.target.value)}
                >
                  <option value="Synthwave">Synthwave</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Lo-Fi">Lo-Fi</option>
                  <option value="Pop">Pop</option>
                  <option value="Rock">Rock</option>
                  <option value="Ambient">Ambient</option>
                </select>
              </div>

              <div className="form-group">
                <label>Est. Duration (sec)</label>
                <input
                  type="number"
                  className="form-input"
                  value={trackDuration}
                  onChange={(e) => setTrackDuration(e.target.value)}
                  min="10"
                  max="1800"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label>Cover Artwork URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={trackCover}
                onChange={(e) => setTrackCover(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label>Assign to Album (Optional)</label>
              <select
                className="form-select"
                value={trackAlbumId}
                onChange={(e) => setTrackAlbumId(e.target.value)}
              >
                <option value="">-- Standalone Single --</option>
                {allAlbums.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading Audio & Publishing...' : 'Publish Track to Groovify'}
            </button>
          </form>
        </div>

        {/* Create Album Card */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-icon" style={{ background: 'rgba(140,82,255,0.15)', color: 'var(--accent-purple)' }}>
              <Disc size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Create Album Collection</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                Publish a thematic release with high-resolution artwork
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateAlbumSubmit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label>Album Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Cyberpunk Odyssey Vol. 2"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label>Album Description</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Tell listeners the story behind this collection..."
                value={albumDesc}
                onChange={(e) => setAlbumDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>Genre</label>
                <select
                  className="form-select"
                  value={albumGenre}
                  onChange={(e) => setAlbumGenre(e.target.value)}
                >
                  <option value="Synthwave">Synthwave</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Lo-Fi">Lo-Fi</option>
                  <option value="Pop">Pop</option>
                  <option value="Rock">Rock</option>
                  <option value="Ambient">Ambient</option>
                </select>
              </div>

              <div className="form-group">
                <label>Release Year</label>
                <input
                  type="number"
                  className="form-input"
                  value={albumYear}
                  onChange={(e) => setAlbumYear(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label>Album Artwork URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={albumCover}
                onChange={(e) => setAlbumCover(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', background: 'var(--accent-purple)' }}
              disabled={isCreatingAlbum}
            >
              {isCreatingAlbum ? 'Creating Album...' : 'Create Album Collection'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
