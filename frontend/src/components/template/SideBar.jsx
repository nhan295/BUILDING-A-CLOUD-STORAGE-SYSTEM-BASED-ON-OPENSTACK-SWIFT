import { useState, useEffect } from 'react';
import { Cloud, HardDrive, Upload, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { getStoredRoles } from '../../pages/logic/Login';
import '../../components/style/SideBar.css';

export default function SideBar() {
  const roles = getStoredRoles() || [];
  const role = roles.includes('admin') ? 'admin' : 'member';
  
  // Lấy active link từ URL hoặc set mặc định là 'dashboard'
  const [activeLink, setActiveLink] = useState(() => {
    const path = window.location.pathname;
    if (path === '/container-manager') return 'container-manager';
    if (path === '/upload') return 'upload';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/user-manager') return 'user-manager';
    if (path === '/settings') return 'settings';
    // Mặc định khi mới login
    return role === 'admin' ? 'dashboard' : 'container-manager';
  });

  // Cập nhật activeLink khi URL thay đổi
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/container-manager') setActiveLink('container-manager');
      else if (path === '/upload') setActiveLink('upload');
      else if (path === '/dashboard') setActiveLink('dashboard');
      else if (path === '/user-manager') setActiveLink('user-manager');
      else if (path === '/settings') setActiveLink('settings');
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleLinkClick = (linkName, href) => {
    setActiveLink(linkName);
    // Nếu sử dụng React Router, thay bằng navigate()
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
              <span>Thống kê</span>
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
              <span>Quản lý Users</span>
            </a>
            
            <a 
              href="/settings" 
              className={`nav-link ${activeLink === 'settings' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('settings', '/settings');
              }}
            >
              <Settings size={18} />
              <span>Cấu hình</span>
            </a>
          </>
        )}
      </nav>
    </div>
  );
}