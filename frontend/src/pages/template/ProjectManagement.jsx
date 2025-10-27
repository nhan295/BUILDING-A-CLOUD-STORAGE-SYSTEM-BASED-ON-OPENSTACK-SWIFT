// ProjectManager.jsx
import { useState,useEffect } from 'react';
import { FolderKanban, Plus, Settings, Users, HardDrive, Search, X, Trash2 } from 'lucide-react';
import '../style/ProjectManagement.css';
import {getProjects,createProject,deleteProject} from '../logic/ProjectManagement.js';
export default function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    quota: 10
  });

  const [quotaEdit, setQuotaEdit] = useState({
    quota: 0
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects();

        if (res && res.length > 0) {
          const formatted = res.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '(Không có mô tả)',
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

  const handleCreateProject = async() => {
    try {
    const projectName = newProject.name.trim();
    const description = newProject.description.trim();
    const quota_bytes = newProject.quota * 1024 * 1024 * 1024; // GB → bytes

    if (!projectName) {
      alert("Tên project không được để trống!");
      return;
    }

    const res = await createProject(projectName, quota_bytes, description);

    if (res.success) {
      
      alert("Tạo project thành công!");
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', quota: 100 });
     const newProj = {
    id: res.project?.id || Date.now(), // hoặc dùng id trả về từ backend
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
      alert(res.message || "Không thể tạo project");
    }
  } catch (error) {
    console.error("Error creating project:", error);
    alert("Đã xảy ra lỗi khi tạo project.");
  }
  };

  const handleUpdateQuota = () => {
    const updated = projects.map(p => 
      p.id === selectedProject.id 
        ? { ...p, quota: quotaEdit.quota * 1024 * 1024 * 1024 }
        : p
    );
    setProjects(updated);
    setShowQuotaModal(false);
    setSelectedProject(null);
  };

  const handleDeleteProject = async(projectId) => {
    if (!confirm('Are you sure you want to delete this project?'))
      return;
    try {
    const res = await deleteProject(projectId);
    if (res && res.success) {
      alert('Project deleted successfully!');
      setProjects(projects.filter(p => p.id !== projectId));
    } else {
      alert('Failed to delete project.');
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    alert('An error occurred while deleting the project.');
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
            placeholder="Tìm kiếm project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setShowCreateModal(true)} className="pm-btn pm-btn-primary">
          <Plus size={20} />
          Tạo Project
        </button>
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
                {((project.used / project.quota) * 100).toFixed(1)}% sử dụng
              </div>
            </div>

            {/* Actions */}
            <div className="pm-card-footer">
              <button onClick={() => openQuotaModal(project)} className="pm-btn pm-btn-secondary">
                <Settings size={16} />
                Quota
              </button>
              <button onClick={() => handleDeleteProject(project.id)} className="pm-btn pm-btn-danger">
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
              <h2 className="pm-modal-title">Tạo Project Mới</h2>
              <button onClick={() => setShowCreateModal(false)} className="pm-close-button">
                <X />
              </button>
            </div>

            <div className="pm-modal-content">
              <div className="pm-input-group">
                <label className="pm-input-label">Tên Project *</label>
                <input
                  type="text"
                  className="pm-text-input"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="vd: Production-Main"
                />
              </div>

               <div className="pm-input-group">
                <label className="pm-input-label">Mô tả</label>
                <textarea
                  className="pm-textarea-input"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Mô tả về project..."
                  rows={3}
                />
              </div>

              <div className="pm-input-group">
                <label className="pm-input-label">Storage Quota (GB) *</label>
                <input
                  type="number"
                  className="pm-text-input"
                  value={newProject.quota}
                  onChange={(e) => setNewProject({...newProject, quota: parseInt(e.target.value) || 0})}
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>

            <div className="pm-modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="pm-btn pm-btn-outline">
                Hủy
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name || !newProject.quota}
                className="pm-btn pm-btn-primary"
              >
                Tạo Project
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
              <h2 className="pm-modal-title">Cập nhật Quota</h2>
              <button onClick={() => setShowQuotaModal(false)} className="pm-close-button">
                <X />
              </button>
            </div>

            <div className="pm-info-box">
              <p className="pm-info-line">Project: <strong className="pm-info-value">{selectedProject.name}</strong></p>
              <p className="pm-info-line">Đang sử dụng: <strong className="pm-info-value">{formatSize(selectedProject.used)}</strong></p>
            </div>

            <div className="pm-modal-content">
              <div className="pm-input-group">
                <label className="pm-input-label">Storage Quota (GB) *</label>
                <input
                  type="number"
                  className="pm-text-input"
                  value={quotaEdit.quota}
                  onChange={(e) => setQuotaEdit({quota: parseInt(e.target.value) || 0})}
                  min="1"
                />
                <small className="pm-input-hint">Quota mới: {quotaEdit.quota} GB</small>
              </div>

              {quotaEdit.quota * 1024 * 1024 * 1024 < selectedProject.used && (
                <div className="pm-alert pm-alert-danger">
                  <p className="pm-alert-text">⚠️ Quota mới nhỏ hơn dung lượng đang sử dụng!</p>
                </div>
              )}
            </div>

            <div className="pm-modal-actions">
              <button onClick={() => setShowQuotaModal(false)} className="pm-btn pm-btn-outline">
                Hủy
              </button>
              <button
                onClick={handleUpdateQuota}
                disabled={!quotaEdit.quota}
                className="pm-btn pm-btn-primary"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}