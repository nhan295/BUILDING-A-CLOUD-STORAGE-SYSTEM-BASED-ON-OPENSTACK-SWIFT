import React, { useState } from 'react';
import { Cloud, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { handleLogin, getAvailableDomains } from '../logic/Login.js';
import '../style/Login.css';

export default function LoginPage() {

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('Default');
  const [project, setProject] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  

  // Domains
  const availableDomains = getAvailableDomains();

  // Handlers
  const handleUsernameChange = (value) => {
    setUsername(value);
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

  const handleLoginClick = async (e) => {
    e.preventDefault?.();
    setError('');
    setLoading(true);

    const result = await handleLogin(username, password, project, domain);

    if (result.success) {
      setUsername('');
      setPassword('');
      setProject('');
      
    } else {
      setError(result.message);
    }

    setLoading(false);
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
          <p className="header-subtitle">Cloud Storage System</p>
        </div>

        {/* Login Form */}
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
                  className="form-input form-input-password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Project */}
            <div className="form-group">
              <label className="form-label">Project</label>
              <div className="form-input-wrapper">
                <Cloud className="form-input-icon" />
                <input
                  type="text"
                  value={project}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  placeholder="Nhập tên project"
                  className="form-input"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLoginClick}
              disabled={loading || !username || !password || !project}
              className="btn btn-primary"
            >
              {loading && (
                <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.25"></circle>
                  <path
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    fill="currentColor"
                    opacity="0.75"
                  ></path>
                </svg>
              )}
              {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>OpenStack Keystone v3 • API</p>
        </div>
      </div>
    </div>
  );
}