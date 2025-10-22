import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  FolderOpen,
  RefreshCw,
  Download,
  Upload
} from "lucide-react";
import "../style/ContainerManagement.css";
import { getStoredRoles } from "../../pages/logic/Login";
import { getContainers, createContainer, uploadFile, delContainer } from "../../pages/logic/ContainerManagement";

export default function SwiftContainerList() {
  const [containers, setContainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContainerName, setNewContainerName] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingContainer, setUploadingContainer] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const roles = getStoredRoles() || [];
  const isAdmin = roles.includes("admin");

  // Load danh sách container
  useEffect(() => {
    const fetchContainer = async () => {
      try {
        const data = await getContainers();
        console.log("API trả về containers:", data);

        const list = data.map((item) => ({
          name: item.name,
          object: item.objects,
          bytes: item.bytes,
          lastModified: new Date(item.last_modified).toISOString().split("T")[0],
        }));

        setContainers(list);
      } catch (error) {
        console.error("Lỗi khi load container:", error);
      }
    };

    fetchContainer();
  }, []);

  // Format dung lượng
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
  };

  // Lọc theo từ khóa tìm kiếm
  const filteredContainers = containers.filter(
    (container) =>
      container.name &&
      container.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenUploadModal = (containerName) => {
    setUploadingContainer(containerName);
    setShowUploadModal(true);
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !uploadingContainer) {
      alert("Vui lòng chọn file để tải lên");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadFile(uploadingContainer, selectedFile,setUploadProgress);

      if (result.success) {
        alert(`✅ Upload file "${selectedFile.name}" thành công!`);
        
        // Refresh container list
        const data = await getContainers();
        const list = data.map((name) => ({
          name,
          count: 0,
          bytes: 0,
          lastModified: new Date().toISOString().split("T")[0],
        }));
        setContainers(list);

        // Reset modal
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadingContainer(null);
      } else {
        alert(`❌ Upload thất bại: ${result.message}`);
      }
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Có lỗi xảy ra khi upload file!");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSelectContainer = (containerName) => {
    setSelectedContainers((prev) =>
      prev.includes(containerName)
        ? prev.filter((name) => name !== containerName)
        : [...prev, containerName]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedContainers(filteredContainers.map((c) => c.name));
    } else {
      setSelectedContainers([]);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleCreateContainer = async () => {
    const name = newContainerName.trim();
    if (!name) return;

    try {
      const res = await createContainer(name);

      if (res.success) {
        const newContainer = {
          name,
          object: 0,
          bytes: 0,
          lastModified: new Date().toISOString().split("T")[0],
        };

        setContainers((prev) => [...prev, newContainer]);
        alert(`Tạo container "${name}" thành công!`);
      } else {
        alert(`Không thể tạo container: ${res.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      alert('Tạo container thất bại! Vui lòng thử lại.');
      console.error('Lỗi khi tạo container:', error);
    } finally {
      setNewContainerName("");
      setShowCreateModal(false);
    }
  };

  const handleDeleteContainer = async(containerName)=>{
    if(!window.confirm(`Bạn có chắc muốn xóa container "${containerName}" không?`))
      return;
    try{
      const response = await delContainer(containerName);
      if(response?.success){
        alert(`Xóa container "${containerName}" thành công!`);
        setContainers(containers.filter(c=>c.name !== containerName));
      }else{
        alert(`❌ Xóa thất bại: ${response?.message || "Không xác định"}`);
      }
    }catch(error){
      console.error("Loi khi xoa container",error);
      alert("Có lỗi xảy ra khi xóa container!");
    }
  }

  const handleDeleteSelected = () => {
    if (
      window.confirm(`Bạn có chắc muốn xóa ${selectedContainers.length} container?`)
    ) {
      setContainers(
        containers.filter((c) => !selectedContainers.includes(c.name))
      );
      setSelectedContainers([]);
    }
  };

  return (
    <div className="swift-container">
      <div className="header">
        <h1>OpenStack Swift - Container Management</h1>
        <p className="subtitle">Quản lý Object Storage Containers</p>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm container..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Tạo Container
          </button>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <RefreshCw size={18} className={isLoading ? "rotating" : ""} />
            Làm mới
          </button>
          {selectedContainers.length > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteSelected}>
              <Trash2 size={18} />
              Xóa ({selectedContainers.length})
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Tổng Containers:</span>
            <span className="stat-value">{containers.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tổng Objects:</span>
            <span className="stat-value">
              {containers
                .reduce((acc, c) => acc + (c.object || 0), 0)
                .toLocaleString()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tổng Dung lượng:</span>
            <span className="stat-value">
              {formatBytes(
                containers.reduce((acc, c) => acc + (c.bytes || 0), 0)
              )}
            </span>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="container-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    selectedContainers.length === filteredContainers.length &&
                    filteredContainers.length > 0
                  }
                />
              </th>
              <th>Tên Container</th>
              <th>Số Objects</th>
              <th>Ngày cập nhật</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredContainers.map((container) => (
              <tr
                key={container.name}
                className={
                  selectedContainers.includes(container.name) ? "selected" : ""
                }
              >
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedContainers.includes(container.name)}
                    onChange={() => handleSelectContainer(container.name)}
                  />
                </td>
                <td>
                  <div className="container-name">
                    <FolderOpen size={18} className="folder-icon" />
                    {container.name}
                  </div>
                </td>
                <td>{(container.object || 0).toLocaleString()}</td>
                <td>{container.lastModified}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="icon-btn" 
                      title="Tải lên"
                      onClick={() => handleOpenUploadModal(container.name)}
                    >
                      <Upload size={16} />
                    </button>
                    <button className="icon-btn" title="Tải xuống">
                      <Download size={16} />
                    </button>
                    {isAdmin && (
                      <button 
                      className="icon-btn danger"
                      title="Xóa"
                      onClick={()=>handleDeleteContainer(container.name)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContainers.length === 0 && (
          <div className="empty-state">
            <FolderOpen size={48} />
            <p>Không tìm thấy container nào</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tạo Container Mới</h2>
            <input
              type="text"
              placeholder="Nhập tên container..."
              value={newContainerName}
              onChange={(e) => setNewContainerName(e.target.value)}
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateContainer}
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tải lên file vào container "{uploadingContainer}"</h2>

            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="modal-input"
            />

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUploadFile}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? `Đang tải lên... (${uploadProgress}%)` : "Tải lên"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}