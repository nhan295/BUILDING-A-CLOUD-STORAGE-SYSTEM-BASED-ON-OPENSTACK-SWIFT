import { useState, useEffect } from 'react';
import { Cloud, HardDrive, Upload, Users, BarChart3, Settings, Clock, FolderKanban } from 'lucide-react';
import { getStoredRoles, getStoredProjectInfo } from '../../pages/logic/Login';
import '../../components/style/SideBar.css';

export default function SideBar() {
  const roles = getStoredRoles() || [];
  const role = roles.includes('admin') ? 'admin' : 'member';
  const projectInfo = getStoredProjectInfo();
  const projectName = projectInfo?.name || 'Unknown Project';
  
  // Kiểm tra xem có phải super admin không (admin role + admin project)
  const isSuperAdmin = role === 'admin' && projectName.toLowerCase() === 'admin';
  
  // Lấy active link từ URL hoặc set mặc định
  const [activeLink, setActiveLink] = useState(() => {
    const path = window.location.pathname;
    if (path === '/project-manager') return 'project-manager';
    if (path === '/container-manager') return 'container-manager';
    if (path === '/upload') return 'upload';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/user-manager') return 'user-manager';
    if (path === '/activity-logs') return 'activity-logs';
    
    // Mặc định khi mới login
    if (isSuperAdmin) return 'project-manager';
    return role === 'admin' ? 'dashboard' : 'container-manager';
  });

  // Cập nhật activeLink khi URL thay đổi
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/project-manager') setActiveLink('project-manager');
      else if (path === '/container-manager') setActiveLink('container-manager');
      else if (path === '/upload') setActiveLink('upload');
      else if (path === '/dashboard') setActiveLink('dashboard');
      else if (path === '/user-manager') setActiveLink('user-manager');
      else if (path === '/activity-logs') setActiveLink('activity-logs');
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleLinkClick = (linkName, href) => {
    setActiveLink(linkName);
    window.location.href = href;
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
        {/* {sys admin UI} */}
        {isSuperAdmin ? (
          <>
            <div className="section-title">System Administration</div>
            
            <a 
              href="/project-manager" 
              className={`nav-link ${activeLink === 'project-manager' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('project-manager', '/project-manager');
              }}
            >
              <FolderKanban size={18} />
              <span>Projects</span>
            </a>

            <a 
              href="/dashboard" 
              className={`nav-link ${activeLink === 'dashboard' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('dashboard', '/dashboard');
              }}
            >
              <BarChart3 size={18} />
              <span>Dashboard</span>
            </a>
            
            <a 
              href="/user-manager" 
              className={`nav-link ${activeLink === 'user-manager' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('user-manager', '/user-manager');
              }}
            >
              <Users size={18} />
              <span>User Management</span>
            </a>
          </>
        ) : (
          // {regular admin/member UI}
          <>
            <div className="section-title">Storage</div>
            
            <a 
              href="/container-manager" 
              className={`nav-link ${activeLink === 'container-manager' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('container-manager', '/container-manager');
              }}
            >
              <HardDrive size={18} />
              <span>Containers</span>
            </a>
            
            <a 
              href="/upload" 
              className={`nav-link ${activeLink === 'upload' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('upload', '/upload');
              }}
            >
              <Upload size={18} />
              <span>Upload</span>
            </a>

            {role === 'admin' && (
              <>
                <div className="section-title">Administration</div>

                <a 
                  href="/dashboard" 
                  className={`nav-link ${activeLink === 'dashboard' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('dashboard', '/dashboard');
                  }}
                >
                  <BarChart3 size={18} />
                  <span>Statitic</span>
                </a>
                
                <a 
                  href="/user-manager" 
                  className={`nav-link ${activeLink === 'user-manager' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('user-manager', '/user-manager');
                  }}
                >
                  <Users size={18} />
                  <span>Users Management</span>
                </a>
                
                <a 
                  href="/activity-logs" 
                  className={`nav-link ${activeLink === 'activity-logs' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('activity-logs', '/activity-logs');
                  }}
                >
                  <Clock size={18} />
                  <span>Activity Log</span>
                </a>
              </>
            )}
          </>
        )}
      </nav>
    </div>
  );
}