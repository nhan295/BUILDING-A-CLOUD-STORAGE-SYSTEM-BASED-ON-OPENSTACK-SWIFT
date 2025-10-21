import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Bell, HelpCircle, ChevronDown } from 'lucide-react';
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
  const role = roles.includes('admin') ? 'Admin' : 'Member';

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
        <div className="header-title">
          <h2>Welcome back, {username}</h2>
        </div>
      </div>

      <div className="header-right">
        
        {/* Profile */}
        <div className="header-icon-wrapper" ref={profileRef}>
          <button
            className="profile-btn"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className="profile-avatar">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">{username}</span>
              <span className="profile-role">{role}</span>
            </div>
            <ChevronDown size={16} className={`chevron-icon ${showProfileDropdown ? 'rotate' : ''}`} />
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="user-info">
                  <div className="user-avatar">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name">{username}</div>
                    <div className="user-email">Project: {projectName}</div>
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-menu">
                <button className="dropdown-item">
                  <User size={18} />
                  <span>My Profile</span>
                </button>
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