import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Upload,
  HardDrive,
  Users,
  TrendingUp,
  Activity,
  Database,
  FileText,
  Folder,
  FolderKanban,
  Server,
} from "lucide-react";
import "../style/Dashboard.css";
import { getStoredRoles, getStoredProjectInfo } from "../../pages/logic/Login";
import {
  totalContainer,
  totalProjectUser,
  projectSize,
  getSysProjects,
  activityLogger,
} from "../../pages/logic/Dashboard";

export default function SwiftDashboard() {
  const [stats, setStats] = useState({
    totalStorage: 0,
    usedStorage: 0,
    containers: 0,
    objects: 0,
    users: 0,
  });

  const [systemStats, setSystemStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalStorage: 0,
    usedStorage: 0,
    activeProjects: 0,
  });

  const [topProjects, setTopProjects] = useState([]);

  const roles = getStoredRoles() || [];
  const role = roles.includes("admin") ? "admin" : "member";
  const projectInfo = getStoredProjectInfo();
  const projectName = projectInfo?.name || "Unknown Project";
  const projectId = projectInfo?.id;

  const isSuperAdmin =
    role === "admin" && projectName.toLowerCase() === "admin";

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isSuperAdmin) {
          const sysData = await getSysProjects();
          const projects = Array.isArray(sysData?.projects)
            ? sysData.projects
            : [];

          const totalProjects =
            typeof sysData?.total === "number"
              ? sysData.total
              : projects.length;
          const totalUsers = projects.reduce(
            (sum, p) => sum + (Number(p.user_count) || 0),
            0
          );
          const totalUsedBytes = projects.reduce(
            (sum, p) => sum + (Number(p.swift_quota?.bytes_used) || 0),
            0
          );

          setSystemStats((prev) => ({
            ...prev,
            totalProjects,
            totalUsers,
            usedStorage: totalUsedBytes,
            totalStorage: 50 * 1024 * 1024 * 1024, // assume 50GB total
          }));

          if (projects.length > 0) {
            const formatted = projects.map((p) => ({
              id: p.id,
              name: p.name,
              storage: Number(p.swift_quota?.bytes_used) || 0,
              containers: p.swift_quota?.container_count || 0,
              users: p.user_count || 0,
              quota:
                p.swift_quota?.quota_bytes === "unlimited"
                  ? Infinity
                  : Number(p.swift_quota?.quota_bytes || 0),
            }));

            const top = formatted
              .sort((a, b) => b.storage - a.storage)
              .slice(0, 5);
            setTopProjects(top);
          } else {
            setTopProjects([]);
          }
        } else {
          const containersData = await totalContainer();
          const totalContainers = containersData.length;
          const totalObjects = containersData.reduce(
            (sum, c) => sum + (c.objects || c.count || 0),
            0
          );
          const totalBytes = containersData.reduce(
            (sum, c) => sum + (c.bytes || 0),
            0
          );
          const totalUsers = await totalProjectUser();
          const { quota_bytes } = await projectSize();

          setStats({
            totalStorage: quota_bytes,
            usedStorage: totalBytes,
            containers: totalContainers,
            objects: totalObjects,
            users: totalUsers,
          });

          //  Lấy activity thật cho project member/admin
          const logs = await activityLogger();
          const projectLogs = logs.filter(
          (log) => log.projectId === projectId
        );
        
        const formattedLogs = projectLogs
          .slice(0, 5) // Giới hạn 5 logs gần nhất
          .map((log, index) => ({
            id: index + 1,
            projectId: log.projectId,
            type: mapActionToType(log.action),
            user: log.username,
            file: log.details,
            time: new Date(log.time).toLocaleString(),
            timestamp: new Date(log.time),
            size: '-',
          }));
        
        setRecentActivities(formattedLogs);
        }
      } catch (error) {
        console.error("Error while fetching dashboard data:", error);
      }
    };

    fetchData();
  }, [isSuperAdmin]);

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
  };

  const mapActionToType = (action) => {
    const a = action.toLowerCase();
    if (a.includes("upload")) return "upload";
    if (a.includes("download")) return "download";
    if (a.includes("delete")) return "delete";
    if (a.includes("create")) return "create";
    return "other";
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "upload":
        return <Upload className="activity-icon upload" />;
      case "download":
        return <TrendingUp className="activity-icon download" />;
      case "delete":
        return <FileText className="activity-icon delete" />;
      case "create":
        return <Folder className="activity-icon create" />;
      default:
        return <Activity className="activity-icon" />;
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
                <p className="stat-value">
                  {formatSize(systemStats.usedStorage)}
                </p>
                <p className="stat-sublabel">
                  / {formatSize(systemStats.totalStorage)} total
                </p>
              </div>
              <div className="stat-icon blue">
                <Database />
              </div>
            </div>
            <div className="stat-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      (systemStats.usedStorage / systemStats.totalStorage) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Projects</p>
                <p className="stat-value">{systemStats.totalProjects}</p>
                <p className="stat-sublabel">
                   active
                </p>
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
                        <span className="project-storage-value">
                          {formatSize(project.storage)}
                        </span>
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
                              width: `${
                                (project.storage / project.quota) * 100
                              }%`,
                              backgroundColor:
                                project.storage / project.quota > 0.8
                                  ? "#ef4444"
                                  : project.storage / project.quota > 0.6
                                  ? "#f59e0b"
                                  : "#10b981",
                            }}
                          />
                        </div>
                        <span className="project-quota-label">
                          {((project.storage / project.quota) * 100).toFixed(1)}
                          % of {formatSize(project.quota)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Project Admin Dashboard
  return (
    <div>
      {role === "admin" && (
        <div className="swift-dashboard">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-info">
                  <p className="stat-label">Storage Usage</p>
                  <p className="stat-value">{formatSize(stats.usedStorage)}</p>
                  <p className="stat-sublabel">
                    / {formatSize(stats.totalStorage)} total
                  </p>
                </div>
                <div className="stat-icon blue">
                  <HardDrive />
                </div>
              </div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        (stats.usedStorage / stats.totalStorage) * 100
                      }%`,
                    }}
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
      <h2>
        {projectName
          ? `Recent Activities - ${projectName}`
          : "Recent Activities"}
      </h2>
    </div>

    <div className="card-body">
      <div className="activities-list">
        {recentActivities
          .map((activity) => (
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

    <div>
      <Link to="/activity-logs" className="dropdown-item">
        <span>See more...</span>
      </Link>
    </div>
  </div>
</div>

        </div>
      )}
    </div>
  );
}
