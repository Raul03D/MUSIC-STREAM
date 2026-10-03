import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { X, Headphones, Mic } from 'lucide-react';

export const AuthModal = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    showToast,
  } = useMusic();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authModalTab === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password, role);
      }
    } catch (err) {
      showToast(err.message || 'Authentication error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoUsername, demoPassword) => {
    setLoading(true);
    try {
      await login(demoUsername, demoPassword);
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close-btn" onClick={() => setAuthModalOpen(false)}>
          <X size={18} />
        </button>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${authModalTab === 'login' ? 'active' : ''}`}
            onClick={() => setAuthModalTab('login')}
          >
            Log In
          </button>
          <button
            className={`auth-tab ${authModalTab === 'register' ? 'active' : ''}`}
            onClick={() => setAuthModalTab('register')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label>Username or Email *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label>Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {authModalTab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. user@groovify.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Type</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">Music Listener (Browse & Stream)</option>
                  <option value="artist">Artist & Producer (Upload Songs & Albums)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : authModalTab === 'login'
              ? 'Log In'
              : 'Create Account'}
          </button>
        </form>

        {/* Quick 1-Click Demo Accounts */}
        <div className="quick-demo-container">
          <span className="demo-title">⚡ Instant 1-Click Demo Accounts</span>
          <div className="demo-btn-row">
            <button
              className="demo-chip-btn"
              onClick={() => handleQuickDemo('demo_listener', 'password123')}
              disabled={loading}
            >
              <Headphones size={14} color="#1db954" />
              <span>Demo Listener</span>
            </button>
            <button
              className="demo-chip-btn"
              onClick={() => handleQuickDemo('demo_artist', 'password123')}
              disabled={loading}
            >
              <Mic size={14} color="#8c52ff" />
              <span>Demo Artist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
