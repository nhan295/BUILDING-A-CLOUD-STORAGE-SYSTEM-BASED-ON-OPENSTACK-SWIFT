import { useState, useEffect } from 'react';
import { Container, Upload, HardDrive, Users, TrendingUp, Activity, Database, FileText, Folder } from 'lucide-react';
import '../style/Dashboard.css';
import { getStoredRoles } from '../../pages/logic/Login';

export default function SwiftDashboard() {
  const [stats, setStats] = useState({
    totalStorage: 0,
    usedStorage: 0,
    containers: 0,
    objects: 0,
    bandwidth: 0,
    activeUsers: 0
  });
  const roles = getStoredRoles() || [];
  const role = roles.includes('admin') ? 'admin' : 'member'


  const [recentActivities, setRecentActivities] = useState([]);
  const [topContainers, setTopContainers] = useState([]);

  useEffect(() => {
    // Simulate fetching data
    setStats({
      totalStorage: 5000,
      usedStorage: 3247,
      containers: 42,
      objects: 15847,
      bandwidth: 2.3,
      activeUsers: 28
    });

    setRecentActivities([
      { id: 1, type: 'upload', user: 'admin@project.com', file: 'backup-2025.tar.gz', time: '5 phút trước', size: '2.4 GB' },
      { id: 2, type: 'delete', user: 'user1@project.com', file: 'old-logs.zip', time: '12 phút trước', size: '856 MB' },
      { id: 3, type: 'download', user: 'dev@project.com', file: 'database-dump.sql', time: '28 phút trước', size: '1.2 GB' },
      { id: 4, type: 'upload', user: 'admin@project.com', file: 'images-archive.zip', time: '1 giờ trước', size: '3.8 GB' },
      { id: 5, type: 'create', user: 'user2@project.com', file: 'new-container', time: '2 giờ trước', size: '-' }
    ]);

    setTopContainers([
      { name: 'backups', size: 1247, objects: 3421, usage: 85 },
      { name: 'media-files', size: 892, objects: 8934, usage: 65 },
      { name: 'logs', size: 634, objects: 2156, usage: 48 },
      { name: 'databases', size: 474, objects: 1336, usage: 35 }
    ]);
  }, []);

  const formatSize = (gb) => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    return `${gb} GB`;
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
      <div className="dashboard-header">
        <h1>OpenStack Swift Dashboard</h1>
        <p>Quản lý Object Storage - Project Scope</p>
      </div>

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
              <p className="stat-sublabel">{stats.objects.toLocaleString()} objects</p>
            </div>
            <div className="stat-icon purple">
              <Container />
            </div>
          </div>
          <div className="stat-footer">
            <Database className="footer-icon" />
            <span>Trung bình {Math.round(stats.objects / stats.containers)} objects/container</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Băng thông</p>
              <p className="stat-value">{stats.bandwidth} GB/s</p>
              <p className="stat-sublabel">{stats.activeUsers} người dùng hoạt động</p>
            </div>
            <div className="stat-icon green">
              <Activity />
            </div>
          </div>
          <div className="stat-footer">
            <Users className="footer-icon" />
            <span>Đang online</span>
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
        <div className="content-card">
          <div className="card-header">
            <h2>Containers lớn nhất</h2>
          </div>
          <div className="card-body">
            <div className="containers-list">
              {topContainers.map((container, index) => (
                <div key={index} className="container-item">
                  <div className="container-header">
                    <div className="container-name">
                      <Container className="container-icon" />
                      <span>{container.name}</span>
                    </div>
                    <span className="container-size">{formatSize(container.size)}</span>
                  </div>
                  <div className="container-info">
                    <span>{container.objects.toLocaleString()} objects</span>
                    <span>{container.usage}%</span>
                  </div>
                  <div className="container-progress">
                    <div 
                      className={`container-progress-fill ${
                        container.usage > 70 ? 'danger' : 
                        container.usage > 50 ? 'warning' : 
                        'success'
                      }`}
                      style={{ width: `${container.usage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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