import { useState, useEffect } from 'react';
import { Container, Upload, HardDrive, Users, TrendingUp, Activity, Database, FileText, Folder, FolderKanban, Server } from 'lucide-react';
import '../style/Dashboard.css';
import { getStoredRoles, getStoredProjectInfo } from '../../pages/logic/Login';
import { totalContainer, totalProjectUser, projectSize, getSysProjects } from '../../pages/logic/Dashboard';

export default function SwiftDashboard() {
  const [stats, setStats] = useState({
    totalStorage: 0,
    usedStorage: 0,
    containers: 0,
    objects: 0,
    users: 0
  });

  const [systemStats, setSystemStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalStorage: 0,
    usedStorage: 0,
    activeProjects: 0
  });

  const [topProjects, setTopProjects] = useState([]);

  const roles = getStoredRoles() || [];
  const role = roles.includes('admin') ? 'admin' : 'member';
  const projectInfo = getStoredProjectInfo();
  const projectName = projectInfo?.name || 'Unknown Project';
  
  const isSuperAdmin = role === 'admin' && projectName.toLowerCase() === 'admin';

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isSuperAdmin) {
          const sysData = await getSysProjects();
          const projects = Array.isArray(sysData?.projects) ? sysData.projects : [];

          const totalProjects = typeof sysData?.total === 'number' ? sysData.total : projects.length;
          const totalUsers = projects.reduce((sum, p) => sum + (Number(p.user_count) || 0), 0);
          const totalUsedBytes = projects.reduce((sum, p) => sum + (Number(p.swift_quota?.bytes_used) || 0), 0);

          setSystemStats(prev => ({
            ...prev,
            totalProjects,
            totalUsers,
            usedStorage: totalUsedBytes,
            totalStorage: 50 * 1024 * 1024 * 1024 // assume 50GB total
          }));

          if (projects.length > 0) {
            const formatted = projects.map((p) => ({
              id: p.id,
              name: p.name,
              storage: Number(p.swift_quota?.bytes_used) || 0,
              containers: p.swift_quota?.container_count || 0,
              users: p.user_count || 0,
              quota:
                p.swift_quota?.quota_bytes === 'unlimited'
                  ? Infinity
                  : Number(p.swift_quota?.quota_bytes || 0),
            }));

            const top = formatted.sort((a, b) => b.storage - a.storage).slice(0, 5);
            setTopProjects(top);
          } else {
            setTopProjects([]);
          }

          setRecentActivities([
            { id: 1, type: 'create', user: 'System', file: 'Project "Marketing" created', time: '10 minutes ago', size: '-' },
            { id: 2, type: 'upload', user: 'project-dev', file: 'Large dataset uploaded', time: '25 minutes ago', size: '15.2 GB' },
            { id: 3, type: 'create', user: 'admin@company.com', file: 'New user registered', time: '1 hour ago', size: '-' },
            { id: 4, type: 'delete', user: 'project-old', file: 'Project "Test2023" deleted', time: '2 hours ago', size: '-' },
            { id: 5, type: 'upload', user: 'project-backup', file: 'System backup completed', time: '3 hours ago', size: '42.8 GB' }
          ]);
        } else {
          const containersData = await totalContainer();
          const totalContainers = containersData.length;
          const totalObjects = containersData.reduce((sum, c) => sum + (c.objects || c.count || 0), 0);
          const totalBytes = containersData.reduce((sum, c) => sum + (c.bytes || 0), 0);
          const totalUsers = await totalProjectUser();
          const { quota_bytes } = await projectSize();

          setStats({
            totalStorage: quota_bytes,
            usedStorage: totalBytes,
            containers: totalContainers,
            objects: totalObjects,
            users: totalUsers
          });

          setRecentActivities([
            { id: 1, type: 'upload', user: 'admin@project.com', file: 'backup-2025.tar.gz', time: '5 minutes ago', size: '2.4 GB' },
            { id: 2, type: 'delete', user: 'user1@project.com', file: 'old-logs.zip', time: '12 minutes ago', size: '856 MB' },
            { id: 3, type: 'download', user: 'dev@project.com', file: 'database-dump.sql', time: '28 minutes ago', size: '1.2 GB' },
            { id: 4, type: 'upload', user: 'admin@project.com', file: 'images-archive.zip', time: '1 hour ago', size: '3.8 GB' },
            { id: 5, type: 'create', user: 'user2@project.com', file: 'new-container', time: '2 hours ago', size: '-' }
          ]);
        }
      } catch (error) {
        console.error("Error while fetching dashboard data:", error);
      }
    };

    fetchData();
  }, [isSuperAdmin]);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload': return <Upload className="activity-icon upload" />;
      case 'download': return <TrendingUp className="activity-icon download" />;
      case 'delete': return <FileText className="activity-icon delete" />;
      case 'create': return <Folder className="activity-icon create" />;
      default: return <Activity className="activity-icon" />;
    }
  };

  if (isSuperAdmin) {
    return (
      <div className="swift-dashboard">
        <div className="dashboard-header">
          <h1>System Administration Dashboard</h1>
          <p>Overview of the entire OpenStack Storage system</p>
        </div>

        {/* System Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Total System Capacity</p>
                <p className="stat-value">{formatSize(systemStats.usedStorage)}</p>
                <p className="stat-sublabel">/ {formatSize(systemStats.totalStorage)} total</p>
              </div>
              <div className="stat-icon blue">
                <Database />
              </div>
            </div>
            <div className="stat-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(systemStats.usedStorage / systemStats.totalStorage) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Projects</p>
                <p className="stat-value">{systemStats.totalProjects}</p>
                <p className="stat-sublabel">{systemStats.activeProjects} active</p>
              </div>
              <div className="stat-icon purple">
                <FolderKanban />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Total Users</p>
                <p className="stat-value">{systemStats.totalUsers}</p>
                <p className="stat-sublabel">Across all projects</p>
              </div>
              <div className="stat-icon green">
                <Users />
              </div>
            </div>
          </div>

        </div>

        <div className="content-grid">
          {/* Recent System Activities */}
          <div className="content-card">
            <div className="card-header">
              <h2>Recent System Activities</h2>
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

          {/* Top Projects by Resource Usage */}
          <div className="content-card">
            <div className="card-header">
              <h2>Top Projects by Resource Usage</h2>
            </div>
            <div className="card-body">
              <div className="top-projects-list">
                {topProjects.map((project, index) => (
                  <div key={project.id} className="project-usage-item">
                    <div className="project-rank">#{index + 1}</div>
                    <div className="project-info">
                      <div className="project-name-row">
                        <h3 className="project-name">{project.name}</h3>
                        <span className="project-storage-value">{formatSize(project.storage)}</span>
                      </div>
                      <div className="project-stats-row">
                        <span className="project-stat">
                          <Container size={14} />
                          {project.containers} containers
                        </span>
                        
                        <span className="project-stat">
                          <Users size={14} />
                          {project.users} users
                        </span>
                      </div>
                      <div className="project-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ 
                              width: `${(project.storage / project.quota) * 100}%`,
                              backgroundColor: (project.storage / project.quota) > 0.8 ? '#ef4444' : 
                                              (project.storage / project.quota) > 0.6 ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                        <span className="project-quota-label">
                          {((project.storage / project.quota) * 100).toFixed(1)}% of {formatSize(project.quota)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Super Admin Quick Actions */}
        <div className="quick-actions">
          <h2>System Administration</h2>
          <div className="actions-grid">
            <button className="action-button" onClick={() => window.location.href = '/projects'}>
              <FolderKanban className="action-icon" />
              <span>Manage Projects</span>
            </button>
            <button className="action-button" onClick={() => window.location.href = '/user-manager'}>
              <Users className="action-icon" />
              <span>Manage Users</span>
            </button>
            <button className="action-button">
              <Database className="action-icon" />
              <span>System Storage</span>
            </button>
            <button className="action-button">
              <Activity className="action-icon" />
              <span>System Logs</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Project Admin Dashboard
  return (
    <div>
      {role === 'admin' && (
        <div className="swift-dashboard">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-info">
                  <p className="stat-label">Storage Usage</p>
                  <p className="stat-value">{formatSize(stats.usedStorage)}</p>
                  <p className="stat-sublabel">/ {formatSize(stats.totalStorage)} total</p>
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
                <h2>Recent Activities</h2>
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
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <button className="action-button">
                <Upload className="action-icon" />
                <span>Upload File</span>
              </button>
              <button className="action-button">
                <Container className="action-icon" />
                <span>Create Container</span>
              </button>
              <button className="action-button">
                <Users className="action-icon" />
                <span>Manage Users</span>
              </button>
              <button className="action-button">
                <Activity className="action-icon" />
                <span>View Logs</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
