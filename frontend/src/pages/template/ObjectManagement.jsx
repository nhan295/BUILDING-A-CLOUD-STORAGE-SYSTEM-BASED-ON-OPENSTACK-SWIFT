import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Upload,
  Trash2,
  Search,
  FolderOpen,
  Download,
  Eye,
  X,
  Move,
} from "lucide-react";
import "../style/ObjectManagement.css";
import {
  getObject,
  uploadFile,
  deleteObject,
  downloadObject,
  moveObject,
  getContainers,
} from "../logic/ObjectManagement.js";
import { getStoredRoles } from "../../pages/logic/Login";
import { toast } from "react-toastify";

export default function ObjectManagement() {
  const [objects, setObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [destContainer, setDestContainer] = useState("");
  const [containers, setContainers] = useState([]);
  const { containerName } = useParams();

  const roles = getStoredRoles() || [];
  const isAdmin = roles.includes("admin");
  const isMember = roles.includes("member");
  const isPrivileged = isAdmin || isMember;

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const data = await getObject(containerName);
        const list = data.map((obj, index) => ({
          id: index + 1,
          name: obj.name,
          size: (obj.size / (1024 * 1024)).toFixed(2) + " MB",
          upload_at: new Date(obj.upload_at).toISOString().split("T")[0],
          type: obj.name.split(".").pop(),
          owner: obj.upload_by || "unknown",
        }));
        setObjects(list);
      } catch (error) {
        console.error("Failed to fetch objects:", error);
      }
    };
    fetchObjects();
  }, [containerName]);

  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const data = await getContainers();
        if (data.success && data.containers) {
          const containerNames = data.containers.map(c => c.name);
          setContainers(containerNames);
        } else {
          toast.error("Failed to load containers list.");
        }
      } catch (error) {
        console.error("Failed to fetch containers:", error);
        toast.error("Failed to load containers list: " + error.message);
      }
    };
    fetchContainers();
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      
      const fileList = files.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        progress: 0,
        status: 'uploading'
      }));
      setUploadingFiles(fileList);

      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(file => {
            if (file.status === 'uploading' && file.progress < 90) {
              return { ...file, progress: Math.min(file.progress + 10, 90) };
            }
            return file;
          })
        );
      }, 300);

      const response = await uploadFile(containerName, files, () => {});
      clearInterval(progressInterval);

      if (!response.success) {
        toast.error("Upload failed: " + response.message);
        setUploadingFiles(prev =>
          prev.map(file => ({ ...file, progress: 100, status: 'error' }))
        );
        setIsUploading(false);
        setTimeout(() => setUploadingFiles([]), 1500);
        return;
      }

      const duplicateFiles = response.results?.filter(
        r => !r.success && r.message?.includes('already exists')
      ) || [];

      if (duplicateFiles.length > 0) {
        const fileNames = duplicateFiles.map(f => f.name).join('\n');
        const confirmReplace = window.confirm(
          `The following file(s) already exist:\n${fileNames}\n\nDo you want to overwrite them?`
        );

        if (confirmReplace) {
          setUploadingFiles(prev =>
            prev.map(file => {
              const isDuplicate = duplicateFiles.some(d => d.name === file.name);
              return isDuplicate 
                ? { ...file, progress: 0, status: 'uploading' }
                : { ...file, progress: 100, status: 'success' };
            })
          );

          const filesToReplace = files.filter(file =>
            duplicateFiles.some(d => d.name === file.name)
          );

          const retryInterval = setInterval(() => {
            setUploadingFiles(prev =>
              prev.map(file => {
                const isDuplicate = duplicateFiles.some(d => d.name === file.name);
                if (isDuplicate && file.status === 'uploading' && file.progress < 90) {
                  return { ...file, progress: Math.min(file.progress + 10, 90) };
                }
                return file;
              })
            );
          }, 300);

          const replaceRes = await uploadFile(containerName, filesToReplace, () => {}, true);
          clearInterval(retryInterval);

          if (replaceRes.success) {
            toast.success('File(s) overwritten successfully!');
            setUploadingFiles(prev =>
              prev.map(file => {
                const replaceResult = replaceRes.results?.find(r => r.name === file.name && r.success);
                if (replaceResult) {
                  return { ...file, progress: 100, status: 'success' };
                }
                return file;
              })
            );
          } else {
            toast.error('Overwrite failed: ' + replaceRes.message);
            setUploadingFiles(prev =>
              prev.map(file => {
                const isDuplicate = duplicateFiles.some(d => d.name === file.name);
                return isDuplicate
                  ? { ...file, progress: 100, status: 'error' }
                  : file;
              })
            );
          }
        } else {
          toast.info('Overwrite canceled.');
          setUploadingFiles(prev =>
            prev.map(file => {
              const isDuplicate = duplicateFiles.some(d => d.name === file.name);
              const successFile = response.results?.find(r => r.name === file.name && r.success);
              return isDuplicate
                ? { ...file, progress: 100, status: 'error' }
                : { ...file, progress: 100, status: successFile ? 'success' : 'error' };
            })
          );
        }
      } else {
        toast.success("Files uploaded successfully!");
        setUploadingFiles(prev =>
          prev.map(file => ({ ...file, progress: 100, status: 'success' }))
        );
      }

      setIsUploading(false);
      setTimeout(() => setUploadingFiles([]), 1500);

      const updatedData = await getObject(containerName);
      setObjects(
        updatedData.map((obj, index) => ({
          id: index + 1,
          name: obj.name,
          size: (obj.size / (1024 * 1024)).toFixed(2) + " MB",
          upload_at: new Date(obj.upload_at).toISOString().split("T")[0],
          type: obj.name.split(".").pop(),
          owner: obj.upload_by || "unknown",
        }))
      );

    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Upload failed.");
      setUploadingFiles(prev =>
        prev.map(file => ({ ...file, status: 'error', progress: 100 }))
      );
      setIsUploading(false);
      setTimeout(() => setUploadingFiles([]), 2000);
    }
  };

  const handleDeleteObject = async (containerName, objectName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the file "${objectName}"?`
      )
    )
      return;
    try {
      const response = await deleteObject(containerName, objectName);
      if (response?.success) {
        toast.success(`File "${objectName}" deleted successfully!`);
        setObjects(objects.filter((o) => o.name !== objectName));
      } else {
        toast.error(`Delete failed: ${response?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("An error occurred while deleting the file!");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedObjects.length === 0) {
      toast.warn("Please select files to delete.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedObjects.length} file(s)?`
      )
    )
      return;

    try {
      let successCount = 0;
      let failCount = 0;

      for (const objectName of selectedObjects) {
        try {
          const response = await deleteObject(containerName, objectName);
          if (response?.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error deleting ${objectName}:`, error);
          failCount++;
        }
      }

      setObjects((prev) =>
        prev.filter((obj) => !selectedObjects.includes(obj.name))
      );
      setSelectedObjects([]);

      if (successCount > 0) {
        toast.success(`Deleted ${successCount} file(s) successfully!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} file(s).`);
      }
    } catch (error) {
      console.error("Error deleting files:", error);
      toast.error("An error occurred while deleting files!");
    }
  };

  const handleOpenMoveModal = () => {
    if (selectedObjects.length === 0) {
      toast.warn("Please select files to move.");
      return;
    }
    setShowMoveModal(true);
  };

  // Hàm move với xử lý overwrite
  const handleMoveObjects = async () => {
    if (!destContainer) {
      toast.warn("Please select a destination container.");
      return;
    }

    if (destContainer === containerName) {
      toast.warn("Cannot move to the same container.");
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;
      const conflictFiles = []; // Lưu các file bị conflict

      // Bước 1: Thử move tất cả file (overwrite = false)
      for (const objectName of selectedObjects) {
        try {
          const response = await moveObject(
            containerName,
            objectName,
            destContainer,
            null, // giữ nguyên tên
            false // không overwrite
          );

          if (response?.success) {
            successCount++;
          } else if (response?.fileExists) {
            // File bị trùng, lưu lại để xử lý sau
            conflictFiles.push(objectName);
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error moving ${objectName}:`, error);
          failCount++;
        }
      }

      // Bước 2: Nếu có file conflict, hỏi user
      if (conflictFiles.length > 0) {
        const fileNames = conflictFiles.join('\n');
        const confirmOverwrite = window.confirm(
          `The following ${conflictFiles.length} file(s) already exist in "${destContainer}":\n\n${fileNames}\n\nDo you want to overwrite them?`
        );

        if (confirmOverwrite) {
          // Move lại các file conflict với overwrite = true
          for (const objectName of conflictFiles) {
            try {
              const response = await moveObject(
                containerName,
                objectName,
                destContainer,
                null,
                true // overwrite = true
              );

              if (response?.success) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (error) {
              console.error(`Error overwriting ${objectName}:`, error);
              failCount++;
            }
          }
        } else {
          // User không muốn overwrite
          toast.info(`${conflictFiles.length} file(s) were not moved (already exist).`);
          failCount += conflictFiles.length;
        }
      }

      // Bước 3: Cập nhật UI
      // Xóa các file đã move thành công khỏi danh sách
      const movedFiles = selectedObjects.filter(
        name => !conflictFiles.includes(name) || 
        (conflictFiles.includes(name) && successCount > 0)
      );

      setObjects((prev) =>
        prev.filter((obj) => !movedFiles.includes(obj.name))
      );
      
      setSelectedObjects([]);
      setShowMoveModal(false);
      setDestContainer("");

      // Hiển thị kết quả
      if (successCount > 0) {
        toast.success(`Moved ${successCount} file(s) to "${destContainer}" successfully!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to move ${failCount} file(s).`);
      }

    } catch (error) {
      console.error("Error moving files:", error);
      toast.error("An error occurred while moving files!");
    }
  };

  const handleDownload = async (containerName, objectName) => {
    try {
      await downloadObject(containerName, objectName);
      console.log(`Downloading file: ${objectName}`);
    } catch (error) {
      console.error("Error while downloading container:", error);
      toast.error("Failed to download container!");
    }
  };

  const handleView = (file) => setSelectedFile(file);

  const handleSelectObject = (objectName) => {
    setSelectedObjects((prev) =>
      prev.includes(objectName)
        ? prev.filter((name) => name !== objectName)
        : [...prev, objectName]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedObjects(filteredFiles.map((obj) => obj.name));
    } else {
      setSelectedObjects([]);
    }
  };

  const filteredFiles = objects.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("excel") || type.includes("sheet")) return "📊";
    if (type.includes("powerpoint") || type.includes("presentation"))
      return "📊";
    return "📁";
  };

  return (
    <div className="fm-container">
      <div className="fm-toolbar">
        <div className="fm-search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="fm-toolbar-actions">
          {isPrivileged && (
            <>
              <label className="fm-upload-btn">
                <Upload size={20} />
                <span>Upload File</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>

              {selectedObjects.length > 0 && (
                <>
                  <button
                    className="fm-move-selected-btn"
                    onClick={handleOpenMoveModal}
                  >
                    <Move size={20} />
                    <span>Move ({selectedObjects.length})</span>
                  </button>

                  <button
                    className="fm-delete-selected-btn"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 size={20} />
                    <span>Delete ({selectedObjects.length})</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Progress Toast */}
      {isUploading && (
        <div className="fm-upload-toast">
          <div className="fm-toast-header">
            <div className="fm-toast-title">
              <Upload size={16} />
              <span>Uploading {uploadingFiles.length} file(s)</span>
            </div>
            <button
              className="fm-toast-close"
              onClick={() => {
                setIsUploading(false);
                setUploadingFiles([]);
              }}
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="fm-upload-files-list">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="fm-upload-file-item">
                <div className="fm-upload-file-info">
                  <span className="fm-upload-file-name">{file.name}</span>
                  <span className={`fm-upload-status fm-status-${file.status}`}>
                    {file.status === 'uploading' && '⏳'}
                    {file.status === 'success' && '✓'}
                    {file.status === 'error' && '✗'}
                  </span>
                </div>
                <div className="fm-progress-container">
                  <div
                    className={`fm-progress-bar fm-progress-${file.status}`}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
                <div className="fm-progress-text">{file.progress}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fm-modal-overlay" onClick={() => setShowMoveModal(false)}>
          <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fm-modal-header">
              <h3>Move {selectedObjects.length} file(s)</h3>
              <button
                className="fm-modal-close"
                onClick={() => setShowMoveModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="fm-modal-body">
              <label>Select destination container:</label>
              <select
                value={destContainer}
                onChange={(e) => setDestContainer(e.target.value)}
                className="fm-select"
              >
                <option value="">-- Select Container --</option>
                {containers
                  .filter((c) => c !== containerName)
                  .map((container) => (
                    <option key={container} value={container}>
                      {container}
                    </option>
                  ))}
              </select>
              
              <div className="fm-selected-files">
                <p>Files to move:</p>
                <ul>
                  {selectedObjects.map((obj) => (
                    <li key={obj}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="fm-modal-footer">
              <button
                className="fm-btn-cancel"
                onClick={() => setShowMoveModal(false)}
              >
                Cancel
              </button>
              <button
                className="fm-btn-confirm"
                onClick={handleMoveObjects}
                disabled={!destContainer}
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fm-content">
        <div className="fm-file-list">
          {filteredFiles.length === 0 ? (
            <div className="fm-empty-state">
              <FolderOpen size={64} />
              <p>No files found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  {isPrivileged && (
                    <th className="fm-checkbox-col">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          selectedObjects.length === filteredFiles.length &&
                          filteredFiles.length > 0
                        }
                      />
                    </th>
                  )}
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className={
                      selectedFile?.id === file.id ? "fm-selected" : ""
                    }
                  >
                    {isPrivileged && (
                      <td className="fm-checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedObjects.includes(file.name)}
                          onChange={() => handleSelectObject(file.name)}
                        />
                      </td>
                    )}
                    <td>
                      <div className="fm-file-info">
                        <span className="fm-file-icon">
                          {getFileIcon(file.type)}
                        </span>
                        <span className="fm-file-name">{file.name}</span>
                      </div>
                    </td>
                    <td>{file.size}</td>
                    <td>{file.upload_at}</td>
                    <td>
                      <div className="fm-actions">
                        <button
                          className="fm-action-btn view"
                          onClick={() => handleView(file)}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="fm-action-btn download"
                          onClick={() =>
                            handleDownload(containerName, file.name)
                          }
                        >
                          <Download size={18} />
                        </button>
                        {isPrivileged && (
                          <button
                            className="fm-action-btn delete"
                            onClick={() =>
                              handleDeleteObject(containerName, file.name)
                            }
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedFile && (
          <div className="fm-file-preview">
            <div className="fm-preview-header">
              <h3>File Details</h3>
              <button
                className="fm-close-btn"
                onClick={() => setSelectedFile(null)}
              >
                ×
              </button>
            </div>
            <div className="fm-preview-content">
              <div className="fm-preview-icon">
                {getFileIcon(selectedFile.type)}
              </div>
              <div className="fm-preview-details">
                <div className="fm-detail-row">
                  <span className="label">File Name:</span>
                  <span>{selectedFile.name}</span>
                </div>
                <div className="fm-detail-row">
                  <span className="label">Size:</span>
                  <span>{selectedFile.size}</span>
                </div>
                <div className="fm-detail-row">
                  <span className="label">Type:</span>
                  <span>{selectedFile.type}</span>
                </div>
                <div className="fm-detail-row">
                  <span className="label">Upload Date:</span>
                  <span>{selectedFile.upload_at}</span>
                </div>
                <div className="fm-detail-row">
                  <span className="label">Upload By:</span>
                  <span>{selectedFile.owner}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}