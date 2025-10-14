import { Cloud, HardDrive, Upload, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { getStoredUserInfo, getStoredProjectInfo, getStoredRoles } from '../../pages/logic/Login';
import '../../components/style/SideBar.css';

export default function SideBar() {
  const user = getStoredUserInfo();
  const project = getStoredProjectInfo();
  const roles = getStoredRoles() || [];

  const username = user?.username || 'Guest';
  const projectName = project?.name || 'No Project';
  const role = roles.includes('admin') ? 'admin' : 'user';

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

        <div className="sidebar-info">
          <div>
            <label>Role</label>
            <p className="value">{role}</p>
          </div>
          <div>
            <label>User</label>
            <p className="highlight">{username}</p>
          </div>
          <div>
            <label>Project</label>
            <p className="value">{projectName}</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="section-title">Storage</div>
        <a href="#" className="nav-link">
          <HardDrive size={18} />
          <span>Containers</span>
        </a>
        <a href="#" className="nav-link">
          <Upload size={18} />
          <span>Upload</span>
        </a>

        {role === 'admin' && (
          <>
            <div className="section-title">Administration</div>
            <a href="#" className="nav-link">
              <Users size={18} />
              <span>Quản lý Users</span>
            </a>
            <a href="#" className="nav-link">
              <BarChart3 size={18} />
              <span>Thống kê</span>
            </a>
            <a href="#" className="nav-link">
              <Settings size={18} />
              <span>Cấu hình</span>
            </a>
          </>
        )}
      </nav>

    </div>
  );
}
