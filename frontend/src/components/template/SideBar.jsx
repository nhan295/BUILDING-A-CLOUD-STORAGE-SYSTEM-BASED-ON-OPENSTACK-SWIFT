import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud, HardDrive, Upload, Users, BarChart3, Clock, FolderKanban
} from 'lucide-react';
import { getStoredRoles, getStoredProjectInfo } from '../../pages/logic/Login';
import '../../components/style/SideBar.css';

export default function SideBar() {
  const roles = getStoredRoles() || [];
  const role = roles.includes('admin') ? 'admin' : 'member';
  const projectInfo = getStoredProjectInfo();
  const projectName = projectInfo?.name || 'Unknown Project';

  const isSuperAdmin = role === 'admin' && projectName.toLowerCase() === 'admin';

  const navigate = useNavigate();

  // Xác định active link ban đầu
  const [activeLink, setActiveLink] = useState(() => {
    const path = window.location.pathname;
    if (path === '/project-manager') return 'project-manager';
    if (path === '/container-manager') return 'container-manager';
    if (path === '/upload') return 'upload';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/user-manager') return 'user-manager';
    if (path === '/activity-logs') return 'activity-logs';
    return isSuperAdmin ? 'project-manager' : role === 'admin' ? 'dashboard' : 'container-manager';
  });

  // Theo dõi thay đổi URL (trường hợp điều hướng bằng Link từ nơi khác)
  useEffect(() => {
    const handlePop = () => {
      setActiveLink(window.location.pathname.replace('/', '') || 'dashboard');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const handleLinkClick = (linkName, href) => {
    setActiveLink(linkName);
    navigate(href);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <div className="icon-box">
            <Cloud size={24} className="text-white" />
          </div>
          <div>
            <h1>OpenStack</h1>
            <p>Storage</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isSuperAdmin ? (
          <>
            <div className="section-title">System Administration</div>

            <button
              className={`nav-link ${activeLink === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleLinkClick('dashboard', '/dashboard')}
            >
              <BarChart3 size={18} />
              <span>Dashboard</span>
            </button>

            <button
              className={`nav-link ${activeLink === 'project-manager' ? 'active' : ''}`}
              onClick={() => handleLinkClick('project-manager', '/project-manager')}
            >
              <FolderKanban size={18} />
              <span>Projects</span>
            </button>

            <button
              className={`nav-link ${activeLink === 'user-manager' ? 'active' : ''}`}
              onClick={() => handleLinkClick('user-manager', '/user-manager')}
            >
              <Users size={18} />
              <span>User Management</span>
            </button>
          </>
        ) : (
          <>
            <div className="section-title">Storage</div>

            <button
              className={`nav-link ${activeLink === 'container-manager' ? 'active' : ''}`}
              onClick={() => handleLinkClick('container-manager', '/container-manager')}
            >
              <HardDrive size={18} />
              <span>Containers</span>
            </button>

            {role === 'admin' && (
              <>
                <div className="section-title">Administration</div>

                <button
                  className={`nav-link ${activeLink === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleLinkClick('dashboard', '/dashboard')}
                >
                  <BarChart3 size={18} />
                  <span>Dashboard</span>
                </button>

                <button
                  className={`nav-link ${activeLink === 'user-manager' ? 'active' : ''}`}
                  onClick={() => handleLinkClick('user-manager', '/user-manager')}
                >
                  <Users size={18} />
                  <span>Users Management</span>
                </button>

                <button
                  className={`nav-link ${activeLink === 'activity-logs' ? 'active' : ''}`}
                  onClick={() => handleLinkClick('activity-logs', '/activity-logs')}
                >
                  <Clock size={18} />
                  <span>Activity Logs</span>
                </button>


              </>
            )}
          </>
        )}
      </nav>
    </div>
  );
}
