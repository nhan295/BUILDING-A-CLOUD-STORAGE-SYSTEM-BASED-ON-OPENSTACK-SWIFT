import { useState, useEffect } from 'react';
import { FolderKanban, Plus, Settings, Users, HardDrive, Search, X, Trash2 } from 'lucide-react';
import { toast } from "react-toastify";
import '../style/ProjectManagement.css';
import { getProjects, createProject, deleteProject, updateQuota } from '../logic/ProjectManagement.js';

export default function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    quota: 10
  });

  const [quotaEdit, setQuotaEdit] = useState({
    quota: 0
  });

  // Hằng số giới hạn tổng quota (GB)
  const MAX_TOTAL_QUOTA_GB = 50;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects();

        if (res && res.length > 0) {
          const formatted = res.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '(No description)',
            quota:
              p.swift_quota?.quota_bytes === 'unlimited'
                ? Infinity
                : parseInt(p.swift_quota?.quota_bytes || 0),
            used: parseInt(p.swift_quota?.bytes_used || 0),
            containers: p.swift_quota?.container_count || 0,
            users: p.user_count || 0,
            createdAt: p.links?.self ? new Date().toISOString().split('T')[0] : '-'
          }));

          setProjects(formatted);
        }
      } catch (err) {
        console.error('Fetch project error:', err);
      }
    };

    fetchProjects();
  }, []);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  // Hàm tính tổng quota hiện tại
  const getTotalQuotaGB = () => {
    const totalBytes = projects.reduce((sum, p) => sum + p.quota, 0);
    return totalBytes / (1024 * 1024 * 1024);
  };

  // Hàm tính quota khả dụng
  const getAvailableQuotaGB = () => {
    return MAX_TOTAL_QUOTA_GB - getTotalQuotaGB();
  };

  const handleCreateProject = async () => {
  setLoading(true);
  
  try {
    const projectName = newProject.name.trim();
    const description = newProject.description.trim();
    const quota_bytes = newProject.quota * 1024 * 1024 * 1024; // GB → bytes

    // Optional: Frontend validation for better UX
    if (!projectName) {
      toast.error("Project name cannot be empty!");
      setLoading(false);
      return;
    }

    if (newProject.quota <= 0) {
      toast.error("Quota must be greater than 0!");
      setLoading(false);
      return;
    }

    // Check total quota limit
    const totalCurrentQuotaGB = getTotalQuotaGB();
    const newQuotaGB = newProject.quota;
    const totalAfterCreate = totalCurrentQuotaGB + newQuotaGB;

    if (totalAfterCreate > MAX_TOTAL_QUOTA_GB) {
      toast.error(
        `Cannot create project! Total quota would be ${totalAfterCreate.toFixed(2)}GB (maximum: ${MAX_TOTAL_QUOTA_GB}GB).`
      );
      setLoading(false);
      return;
    }

    // Call API - backend will validate everything
    const res = await createProject(projectName, quota_bytes, description);

    if (res?.success) {
      toast.success(res.message); // Backend message: "Project 'Production' created successfully."
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', quota: 10 });

      const newProj = {
        id: res.project?.id || Date.now(),
        name: projectName,
        description,
        quota: quota_bytes,
        used: 0,
        containers: 0,
        users: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setProjects(prev => [...prev, newProj]);
    } else {
      toast.error(res?.message || "Failed to create project.");
    }
  } catch (error) {
    console.error("Error creating project:", error);
    toast.error("An error occurred while creating the project.");
  } finally {
    setLoading(false);
  }
};

  const isQuotaUpdateValid = () => {
  if (!quotaEdit.quota) return false;
  
  // Kiểm tra quota nhỏ hơn usage hiện tại
  if (quotaEdit.quota * 1024 * 1024 * 1024 < selectedProject.used) {
    return false;
  }
  
  // Kiểm tra vượt quá tổng quota
  const otherProjectsQuotaGB = projects
    .filter(p => p.id !== selectedProject.id)
    .reduce((sum, p) => sum + p.quota, 0) / (1024 * 1024 * 1024);
  
  if (otherProjectsQuotaGB + quotaEdit.quota > MAX_TOTAL_QUOTA_GB) {
    return false;
  }
  
  return true;
};

  const handleUpdateQuota = async () => {
  if (!selectedProject) return;
  
  setLoading(true);
  
  try {
    const quota_bytes = quotaEdit.quota * 1024 * 1024 * 1024;

    const response = await updateQuota(selectedProject.id, quota_bytes);
    
    if (response.success) {
      toast.success('Quota updated successfully!');
      setProjects(projects.map(p =>
        p.id === selectedProject.id ? { ...p, quota: quota_bytes } : p
      ));
      setShowQuotaModal(false);
      setSelectedProject(null);
    } else {
      toast.error('Failed to update quota: ' + response.message);
    }
  } catch (error) {
    console.error('Error updating quota:', error);
    toast.error('An error occurred while updating quota');
  } finally {
    setLoading(false);
  }
};

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?'))
      return;
    try {
      const res = await deleteProject(projectId);
      if (res && res.success) {
        toast.success('Project deleted successfully!');
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        toast.error('Failed to delete project.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('An error occurred while deleting the project.');
    }
  };

  const openQuotaModal = (project) => {
    setSelectedProject(project);
    setQuotaEdit({ quota: project.quota / (1024 * 1024 * 1024) });
    setShowQuotaModal(true);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (used, quota) => {
    const percentage = used / quota;
    if (percentage > 0.8) return '#ef4444';
    if (percentage > 0.6) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="pm-wrapper">

      {/* Actions Bar */}
      <div className="pm-toolbar">
        <div className="pm-search-box">
          <Search className="pm-search-icon" size={20} />
          <input
            type="text"
            className="pm-search-input"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="pm-btn pm-btn-primary"
            disabled={getAvailableQuotaGB() <= 0}
          >
            <Plus size={20} />
            Create Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="pm-projects-grid">
        {filteredProjects.map((project) => (
          <div key={project.id} className="pm-project-card">
            <div className="pm-card-top">
              <div className="pm-project-icon">
                <FolderKanban size={20} />
              </div>
              <div className="pm-project-details">
                <h3 className="pm-project-name">{project.name}</h3>
                <p className="pm-project-desc">{project.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="pm-project-stats">
              <div className="pm-stat-item">
                <HardDrive size={16} />
                <span className="pm-stat-text">{project.containers} containers</span>
              </div>
              <div className="pm-stat-item">
                <Users size={16} />
                <span className="pm-stat-text">{project.users} users</span>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="pm-storage-section">
              <div className="pm-storage-header">
                <span className="pm-storage-label">Storage</span>
                <span className="pm-storage-values">
                  {formatSize(project.used)} / {formatSize(project.quota)}
                </span>
              </div>
              <div className="pm-progress-track">
                <div
                  className="pm-progress-fill"
                  style={{
                    width: `${(project.used / project.quota) * 100}%`,
                    backgroundColor: getProgressColor(project.used, project.quota)
                  }}
                />
              </div>
              <div className="pm-usage-text">
                {((project.used / project.quota) * 100).toFixed(1)}% used
              </div>
            </div>

            {/* Actions */}
            <div className="pm-card-footer">
              <button onClick={() => openQuotaModal(project)} className="pm-btn pm-btn-secondary">
                <Settings size={16} />
                Quota
              </button>
              <button 
             onClick={() => handleDeleteProject(project.id)} 
                className="pm-btn pm-btn-danger"
                disabled={project.name.toLowerCase() === 'admin'}
                style={{
                  opacity: project.name.toLowerCase() === 'admin' ? 0.5 : 1,
                  cursor: project.name.toLowerCase() === 'admin' ? 'not-allowed' : 'pointer',
                  pointerEvents: project.name.toLowerCase() === 'admin' ? 'none' : 'auto'
                }}

              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="pm-modal-backdrop">
          <div className="pm-modal-container">
            <div className="pm-modal-top">
              <h2 className="pm-modal-title">Create New Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="pm-close-button">
                <X />
              </button>
            </div>

            <div className="pm-info-box" style={{ marginBottom: '16px', backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
              <p className="pm-info-line">
                Available Quota: <strong className="pm-info-value" style={{ color: '#10b981' }}>
                  {getAvailableQuotaGB().toFixed(2)}GB
                </strong>
              </p>
              <p className="pm-info-line" style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Total: {getTotalQuotaGB().toFixed(2)}GB / {MAX_TOTAL_QUOTA_GB}GB
              </p>
            </div>

            <div className="pm-modal-content">
              <div className="pm-input-group">
                <label className="pm-input-label">Project Name *</label>
                <input
                  type="text"
                  className="pm-text-input"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. Production-Main"
                />
              </div>

              <div className="pm-input-group">
                <label className="pm-input-label">Description</label>
                <textarea
                  className="pm-textarea-input"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe the project..."
                  rows={3}
                />
              </div>

              <div className="pm-input-group">
                <label className="pm-input-label">Storage Quota (GB) *</label>
                <input
                  type="number"
                  className="pm-text-input"
                  value={newProject.quota}
                  onChange={(e) => setNewProject({ ...newProject, quota: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                  min="1"
                  max={getAvailableQuotaGB()}
                />
                <small className="pm-input-hint">
                  Maximum available: {getAvailableQuotaGB().toFixed(2)}GB
                </small>
              </div>

              {newProject.quota > getAvailableQuotaGB() && (
                <div className="pm-alert pm-alert-danger">
                  <p className="pm-alert-text">
                    Quota exceeds available limit! Available: {getAvailableQuotaGB().toFixed(2)}GB
                  </p>
                </div>
              )}
            </div>

            <div className="pm-modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="pm-btn pm-btn-outline">
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name || !newProject.quota || loading || newProject.quota > getAvailableQuotaGB()}
                className="pm-btn pm-btn-primary"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quota Modal */}
      {showQuotaModal && selectedProject && (
        <div className="pm-modal-backdrop">
          <div className="pm-modal-container">
            <div className="pm-modal-top">
              <h2 className="pm-modal-title">Update Quota</h2>
              <button onClick={() => setShowQuotaModal(false)} className="pm-close-button">
                <X />
              </button>
            </div>

            <div className="pm-info-box">
              <p className="pm-info-line">Project: <strong className="pm-info-value">{selectedProject.name}</strong></p>
              <p className="pm-info-line">Used: <strong className="pm-info-value">{formatSize(selectedProject.used)}</strong></p>
              <p className="pm-info-line">Current Quota: <strong className="pm-info-value">{(selectedProject.quota / (1024 * 1024 * 1024)).toFixed(2)}GB</strong></p>
            </div>

            <div className="pm-info-box" style={{ marginTop: '12px', backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
              <p className="pm-info-line">
                Available Quota (excluding this project): <strong className="pm-info-value" style={{ color: '#10b981' }}>
                  {(MAX_TOTAL_QUOTA_GB - (getTotalQuotaGB() - (selectedProject.quota / (1024 * 1024 * 1024)))).toFixed(2)}GB
                </strong>
              </p>
            </div>

            <div className="pm-modal-content">
              <div className="pm-input-group">
                <label className="pm-input-label">Storage Quota (GB) *</label>
                <input
                  type="number"
                  className="pm-text-input"
                  value={quotaEdit.quota}
                  onChange={(e) => setQuotaEdit({ quota: parseInt(e.target.value) || 0 })}
                  min="1"
                />
                <small className="pm-input-hint">New quota: {quotaEdit.quota} GB</small>
              </div>

              {quotaEdit.quota * 1024 * 1024 * 1024 < selectedProject.used && (
                <div className="pm-alert pm-alert-danger">
                  <p className="pm-alert-text">New quota is smaller than current usage!</p>
                </div>
              )}

              {(() => {
                const otherProjectsQuotaGB = projects
                  .filter(p => p.id !== selectedProject.id)
                  .reduce((sum, p) => sum + p.quota, 0) / (1024 * 1024 * 1024);
                const totalAfter = otherProjectsQuotaGB + quotaEdit.quota;
                return totalAfter > MAX_TOTAL_QUOTA_GB && (
                  <div className="pm-alert pm-alert-danger">
                    <p className="pm-alert-text">
                      Total quota would be {totalAfter.toFixed(2)}GB (maximum: {MAX_TOTAL_QUOTA_GB}GB)!
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="pm-modal-actions">
              <button onClick={() => setShowQuotaModal(false)} className="pm-btn pm-btn-outline">
                Cancel
              </button>
              <button
                onClick={handleUpdateQuota}
                disabled={!isQuotaUpdateValid() || loading}
                className="pm-btn pm-btn-primary"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}