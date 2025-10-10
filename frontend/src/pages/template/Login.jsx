import React, { useState } from 'react';
import { Cloud, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { validateLogin, getAvailableProjects, getAvailableDomains } from '../logic/Login.js';
import '../style/Login.css';

export default function App() {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('Default');
  const [project, setProject] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Logged in state
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Dynamic data
  const availableProjects = getAvailableProjects(username);
  const availableDomains = getAvailableDomains();

  // Handlers
  const handleUsernameChange = (value) => {
    setUsername(value);
    setProject('');
    setError('');
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setError('');
  };

  const handleDomainChange = (value) => {
    setDomain(value);
    setError('');
  };

  const handleProjectChange = (value) => {
    setProject(value);
    setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault?.();
    setError('');
    setSuccess('');
    setLoading(true);

    setTimeout(() => {
      const result = validateLogin(username, password, domain, project);

      if (result.success) {
        setSuccess(result.message);
        setLoggedInUser(result.user);
        setUsername('');
        setPassword('');
        setProject('');
      } else {
        setError(result.message);
      }

      setLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setSuccess('');
    setError('');
    setUsername('');
    setPassword('');
    setProject('');
    setShowPassword(false);
  };

  return (
    <div className="app-container">
      {/* Background blobs */}
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>

      {/* Content */}
      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <div className="header-icon">
            <div className="header-icon-box">
              <Cloud />
            </div>
          </div>
          <h1 className="header-title">OpenStack</h1>
          <p className="header-subtitle">Keystone Identity Service</p>
        </div>

        {/* Login Form */}
        {!loggedInUser ? (
          <div className="card">
            {/* Error Message */}
            {error && (
              <div className="message error-message">
                <AlertCircle className="message-icon" />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Domain */}
              <div className="form-group">
                <label className="form-label">Domain</label>
                <select
                  value={domain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  className="form-select"
                >
                  {availableDomains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Username */}
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="form-input-wrapper">
                  <Mail className="form-input-icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Nhập username"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="form-input-wrapper">
                  <Lock className="form-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Nhập password"
                    className={`form-input form-input-password`}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Project */}
              <div className="form-group">
                <label className="form-label">
                  Project {availableProjects.length > 0 && (
                    <span className="form-label-highlight">({availableProjects.length})</span>
                  )}
                </label>
                {username && !availableProjects.length ? (
                  <div className="form-disabled">User không tồn tại</div>
                ) : availableProjects.length > 0 ? (
                  <select
                    value={project}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Chọn project --</option>
                    {availableProjects.map((proj) => (
                      <option key={proj} value={proj}>
                        {proj}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="form-disabled">
                    {username ? 'Vui lòng nhập username trước' : 'Chọn username trước'}
                  </div>
                )}
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading || !username || !password || !project}
                className="btn btn-primary"
              >
                {loading && (
                  <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.25"></circle>
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" opacity="0.75"></path>
                  </svg>
                )}
                {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
              </button>
            </div>
          </div>
        ) : (
          /* Logged In Screen */
          <div className="card">
            {/* Success Message */}
            <div className="message success-message">
              <CheckCircle className="message-icon" />
              <span>{success}</span>
            </div>

            <div className="logged-in-container">
              {/* Username */}
              <div className="info-card">
                <div className="info-card-label">👤 Người dùng</div>
                <div className={`info-card-value info-card-cyan`}>
                  {loggedInUser.username}
                </div>
              </div>

              {/* Project and Role */}
              <div className="info-card-grid">
                <div className="info-card">
                  <div className="info-card-label">📁 Project</div>
                  <div className="info-card-value">{loggedInUser.project}</div>
                </div>
                <div className="info-card">
                  <div className="info-card-label">🔐 Role</div>
                  <div className={`info-card-value info-card-blue`}>
                    {loggedInUser.role}
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="info-card">
                <div className="info-card-label">⏰ Thời gian đăng nhập</div>
                <div className={`info-card-value info-card-small`}>
                  {loggedInUser.timestamp}
                </div>
              </div>

              {/* Domain */}
              <div className="info-card">
                <div className="info-card-label">🌐 Domain</div>
                <div className="info-card-value">{loggedInUser.domain}</div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="btn btn-logout"
                style={{ marginTop: '1.5rem' }}
              >
                <LogOut size={20} />
                Đăng Xuất
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <p>OpenStack Keystone v3</p>
        </div>
      </div>
    </div>
  );
}