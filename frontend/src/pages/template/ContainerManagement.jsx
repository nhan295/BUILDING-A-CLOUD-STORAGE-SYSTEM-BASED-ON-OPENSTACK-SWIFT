import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  FolderOpen,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../style/ContainerManagement.css";
import { getStoredRoles } from "../../pages/logic/Login";
import {
  getContainers,
  createContainer,
  uploadFile,
  delContainer,
  downloadContainer,
} from "../../pages/logic/ContainerManagement";

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
  const [isCreating, setIsCreating] = useState(false);

  const roles = getStoredRoles() || [];
  const isAdmin = roles.includes("admin");
  const isMember = roles.includes("member");
  //const isReader = roles.includes("reader");

  const isPrivileged = isAdmin || isMember; // Admins and Members have full access on containers
  const navigate = useNavigate();

  // 🔹 Load container list
  useEffect(() => {
    const fetchContainer = async () => {
      try {
        const data = await getContainers();
        console.log("Containers from API:", data);

        const list = data.map((item) => {
          let lastModified = "N/A";
          try {
            if (item.last_modified) {
              lastModified = new Date(item.last_modified)
                .toISOString()
                .split("T")[0];
            }
          } catch {
            lastModified = "N/A";
          }

          return {
            name: item.name,
            object: item.objects || 0,
            bytes: item.bytes || 0,
            lastModified,
          };
        });
        setContainers(list);
      } catch (error) {
        console.error("Error loading containers:", error);
      }
    };

    fetchContainer();
  }, []);

  //  Format bytes into readable units
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
  };

  //  Filter containers by name
  const filteredContainers = containers.filter(
    (container) =>
      container.name &&
      container.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenUploadModal = (containerName) => {
    setUploadingContainer(containerName);
    setShowUploadModal(true);
  };

  //  Upload file
  const handleUploadFile = async () => {
    if (!selectedFile || !uploadingContainer) {
      toast.warn("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // First upload attempt (no overwrite)
      const result = await uploadFile(
        uploadingContainer,
        selectedFile,
        setUploadProgress
      );

      if (result.success) {
        toast.success(`File "${selectedFile.name}" uploaded successfully!`);
      } else {
        // If server reports file already exists
        if (result.message.includes("already exists")) {
          const confirmReplace = window.confirm(
            `File "${selectedFile.name}" already exists in container "${uploadingContainer}".\nDo you want to overwrite it?`
          );

          if (confirmReplace) {
            // Retry upload with replace=true
            const retry = await uploadFile(
              uploadingContainer,
              selectedFile,
              setUploadProgress,
              true
            );
            if (retry.success) {
              toast.success(`File "${selectedFile.name}" overwritten successfully!`);
            } else {
              toast.error(`Upload failed: ${retry.message}`);
            }
          } else {
            toast.info("Overwrite canceled.");
          }
        } else {
          toast.error(`Upload failed: ${result.message}`);
        }
      }

      // Refresh container list after upload
      const data = await getContainers();
      const list = data.map((item) => ({
        name: item.name,
        object: item.objects,
        bytes: item.bytes,
        lastModified: new Date(item.last_modified).toISOString().split("T")[0],
      }));
      setContainers(list);

      // Reset modal
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadingContainer(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred during file upload!");
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
  if (!name) {
    toast.error("Please enter a container name.");
    return;
  }

  if (containers.some((c) => c.name === name)) {
    toast.info(`Container "${name}" already exists.`);
    setNewContainerName("");
    setShowCreateModal(false);
    return;
  }

  try {
    setIsCreating(true); // Khóa nút Create khi bắt đầu request
    const res = await createContainer(name);

    if (res.success) {
      const newContainer = {
        name,
        object: 0,
        bytes: 0,
        lastModified: new Date().toISOString().split("T")[0],
      };
      setContainers((prev) => [...prev, newContainer]);
      toast.success(`Container "${name}" created successfully!`);
    } else if (res.message?.toLowerCase().includes("exists")) {
      toast.info(`Container "${name}" already exists.`);
    } else {
      toast.error(`Failed to create container: ${res.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error creating container:", error);
    toast.error("Failed to create container. Please try again.");
  } finally {
    setIsCreating(false); // Mở lại nút sau khi hoàn tất
    setNewContainerName("");
    setShowCreateModal(false);
  }
};

  //  Delete single container
  const handleDeleteContainer = async (containerName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete container "${containerName}"?`
      )
    )
      return;
    try {
      const response = await delContainer(containerName);
      if (response?.success) {
        toast.success(`Container "${containerName}" deleted successfully!`);
        setContainers(containers.filter((c) => c.name !== containerName));
      } else {
        toast.error(`Delete failed: ${response?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting container:", error);
      toast.error("An error occurred while deleting the container!");
    }
  };

  // Delete multiple containers
  // Delete multiple containers
const handleDeleteSelected = async () => {
  if (
    !window.confirm(
      `Are you sure you want to delete ${selectedContainers.length} container(s)?`
    )
  )
    return;

  try {
    let successCount = 0;
    let failCount = 0;

    // Dùng vòng lặp để xóa từng container
    for (const containerName of selectedContainers) {
      try {
        const response = await delContainer(containerName);
        if (response?.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to delete ${containerName}:`, response?.message);
        }
      } catch (error) {
        failCount++;
        console.error(`Error deleting ${containerName}:`, error);
      }
    }

    // Hiển thị thông báo kết quả
    if (successCount > 0) {
      toast.success(`Deleted ${successCount} container(s) successfully!`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} container(s)!`);
    }

    // Cập nhật lại danh sách containers trong UI
    // Chỉ loại bỏ những container đã xóa thành công
    const data = await getContainers();
    const list = data.map((item) => ({
      name: item.name,
      object: item.objects || 0,
      bytes: item.bytes || 0,
      lastModified: item.last_modified 
        ? new Date(item.last_modified).toISOString().split("T")[0]
        : "N/A",
    }));
    setContainers(list);
    setSelectedContainers([]);

  } catch (error) {
    console.error("Error deleting selected containers:", error);
    toast.error("An error occurred while deleting containers!");
  }
};


  //  Download container
  const handleDownloadContainer = async (containerName) => {
    try {
      await downloadContainer(containerName);
      console.log(`Downloading container: ${containerName}`);
    } catch (error) {
      console.error("Error downloading container:", error);
      toast.error("Failed to download container!");
    }
  };

  //  Navigate to container details
  const handleClick = (container) => {
    navigate(`/container/${container.name}`, {
      state: { containerName: container.name },
    });
  };

  return (
    <div className="swift-container">
      <div className="header">
        <h1>OpenStack Swift - Container Management</h1>
        <p className="subtitle">Manage your Object Storage Containers</p>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search containers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

         <div className="actions">
          {(isPrivileged) && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              Create Container
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <RefreshCw size={18} className={isLoading ? "rotating" : ""} />
            Refresh
          </button>
          {(isPrivileged) && selectedContainers.length > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteSelected}>
              <Trash2 size={18} />
              Delete ({selectedContainers.length})
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Total Containers:</span>
            <span className="stat-value">{containers.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Objects:</span>
            <span className="stat-value">
              {containers
                .reduce((acc, c) => acc + (c.object || 0), 0)
                .toLocaleString()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Storage:</span>
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
              {isPrivileged && (
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
              )}
              <th>Container Name</th>
              <th>Object Count</th>
              <th>Last Modified</th>
              <th>Actions</th>
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
                {isPrivileged && (
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedContainers.includes(container.name)}
                      onChange={() => handleSelectContainer(container.name)}
                    />
                  </td>
                )}
                <td>
                  <div
                    className="container-name"
                    onClick={() => handleClick(container)}
                    style={{ cursor: "pointer" }}
                  >
                    <FolderOpen size={18} className="folder-icon" />
                    {container.name}
                  </div>
                </td>
                <td>{(container.object || 0).toLocaleString()}</td>
                <td>{container.lastModified}</td>
                <td>
                  <div className="action-buttons">
                    {isPrivileged && (
                       <button
                      className="icon-btn"
                      title="Upload"
                      onClick={() => handleOpenUploadModal(container.name)}
                    >
                      <Upload size={16} />
                    </button>
                    )}
                   
                    <button
                      className="icon-btn"
                      title="Download"
                      onClick={() => handleDownloadContainer(container.name)}
                    >
                      <Download size={16} />
                    </button>
                    {isPrivileged && (
                      <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={() => handleDeleteContainer(container.name)}
                      >
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
            <p>No containers found</p>
          </div>
        )}
      </div>

      {/* Create container modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Container</h2>
            <input
              type="text"
              placeholder="Enter container name..."
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
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateContainer}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload file to container "{uploadingContainer}"</h2>

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
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUploadFile}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? `Uploading... (${uploadProgress}%)` : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
