import { useState, useRef, useEffect } from 'react';
import { Search, User, Settings, LogOut, HelpCircle } from 'lucide-react';
import '../../components/style/Header.css';
import { handleLogout } from '../../components/logic/Header';
import { useNavigate } from 'react-router-dom';
import { getStoredUserInfo, getStoredProjectInfo, getStoredRoles } from '../../pages/logic/Login';

export default function Header() {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const user = getStoredUserInfo();
  const project = getStoredProjectInfo();
  const roles = getStoredRoles() || [];

  const username = user?.username || 'Guest';
  const projectName = project?.name || 'No Project';
  const role = roles.includes('admin') ? 'admin' : 'member';

  const profileRef = useRef(null);
    const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = async () => {
    await handleLogout();
    setShowProfileDropdown(false);
    navigate('/');

  };

  return (
    <div className="page-header">
      <div className="header-left">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search in OpenStack..."
            className="search-input"
          />
        </div>
      </div>

      <div className="header-right">
        {/* Profile */}
        <div className="header-icon-wrapper" ref={profileRef}>
          <button
            className="header-icon-btn"
            title="Profile"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <User size={20} />
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name">{username}</div>
                    <div className="user-email">Project: {projectName}</div>
                    <div className="user-email">Role: {role}</div>
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-menu">
                <button className="dropdown-item">
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-menu">
                <button className="dropdown-item logout-item" onClick={handleLogoutClick}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}