import { useState, useEffect } from 'react';
import { Container, Upload, HardDrive, Users, TrendingUp, Activity, Database, FileText, Folder } from 'lucide-react';
import '../style/Dashboard.css';
import { getStoredRoles } from '../../pages/logic/Login';
import {totalContainer,totalProjectUser, projectSize} from '../../pages/logic/Dashboard';

export default function SwiftDashboard() {
  const [stats, setStats] = useState({
    totalStorage: 0,
    usedStorage: 0,
    containers: 0,
    objects: 0,
    activeUsers: 0
  });
  const roles = getStoredRoles() || [];
  const role = roles.includes('admin') ? 'admin' : 'member'
  

  const [recentActivities, setRecentActivities] = useState([]);

useEffect(() => {
    const fetchData = async () => {
      try {
        const totalCont = await totalContainer();
        const totalUsers = await totalProjectUser();
        const {bytes_used, quota_bytes} = await projectSize();
        console.log('Total containers từ API:', totalCont);
        
        // Nếu muốn lấy tổng objects, cần loop qua tất cả containers
        // Hoặc tạm thời dùng giá trị cố định
        
        setStats({
          totalStorage: quota_bytes,
          usedStorage: bytes_used,
          containers: totalCont, // ✅ Giá trị từ API
          objects: 15847, // Tạm thời dùng số cố định
          activeUsers: 28,
          users: totalUsers //  Giá trị từ API
        });
        
        console.log('Stats sau khi set:', { containers: totalCont });
      } catch(error) {
        console.error('Lỗi khi fetch data:', error);
      }
    };
    
    
    fetchData(); // Gọi hàm ở đây

    setRecentActivities([
      { id: 1, type: 'upload', user: 'admin@project.com', file: 'backup-2025.tar.gz', time: '5 phút trước', size: '2.4 GB' },
      { id: 2, type: 'delete', user: 'user1@project.com', file: 'old-logs.zip', time: '12 phút trước', size: '856 MB' },
      { id: 3, type: 'download', user: 'dev@project.com', file: 'database-dump.sql', time: '28 phút trước', size: '1.2 GB' },
      { id: 4, type: 'upload', user: 'admin@project.com', file: 'images-archive.zip', time: '1 giờ trước', size: '3.8 GB' },
      { id: 5, type: 'create', user: 'user2@project.com', file: 'new-container', time: '2 giờ trước', size: '-' }
    ]);
  }, []);

  const formatSize = (bytes) => {
    if (!bytes) return '0 GB';
    const gb = bytes / (1024 ** 3); // chuyển từ bytes → gigabytes
    if (gb >= 1000) return `${(gb / 1024).toFixed(2)} TB`;
    return `${gb.toFixed(2)} GB`;
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'upload': return <Upload className="activity-icon upload" />;
      case 'download': return <TrendingUp className="activity-icon download" />;
      case 'delete': return <FileText className="activity-icon delete" />;
      case 'create': return <Folder className="activity-icon create" />;
      default: return <Activity className="activity-icon" />;
    }
  };

  return (
  <div>
    {role === 'admin' &&(
    <div className="swift-dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Dung lượng sử dụng</p>
              <p className="stat-value">{formatSize(stats.usedStorage)}</p>
              <p className="stat-sublabel">/ {formatSize(stats.totalStorage)} tổng</p>
            </div>
            <div className="stat-icon blue">
              <HardDrive />
            </div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(stats.usedStorage / stats.totalStorage) * 100}%` }}
              />
            </div>
            <p className="progress-text">
              {((stats.usedStorage / stats.totalStorage) * 100).toFixed(1)}% đã sử dụng
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Containers</p>
              <p className="stat-value">{stats.containers}</p>
              <p className="stat-sublabel">{stats.objects} objects</p>
            </div>
            <div className="stat-icon purple">
              <Container />
            </div>
          </div>
        </div>

          <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Users</p>
              <p className="stat-value">{stats.users}</p>
            </div>
            <div className="stat-icon purple">
              <Users />
            </div>
          </div>
        </div>

      
      </div>

      <div className="content-grid">
        {/* Recent Activities */}
        <div className="content-card">
          <div className="card-header">
            <h2>Hoạt động gần đây</h2>
          </div>
          <div className="card-body">
            <div className="activities-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon-wrapper">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-details">
                    <p className="activity-file">{activity.file}</p>
                    <p className="activity-user">{activity.user}</p>
                  </div>
                  <div className="activity-meta">
                    <p className="activity-size">{activity.size}</p>
                    <p className="activity-time">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Containers */}
        
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Thao tác nhanh</h2>
        <div className="actions-grid">
          <button className="action-button">
            <Upload className="action-icon" />
            <span>Upload File</span>
          </button>
          <button className="action-button">
            <Container className="action-icon" />
            <span>Tạo Container</span>
          </button>
          <button className="action-button">
            <Users className="action-icon" />
            <span>Quản lý User</span>
          </button>
          <button className="action-button">
            <Activity className="action-icon" />
            <span>Xem Logs</span>
          </button>
        </div>
      </div>
    </div>
    )}
    </div>
  );
}