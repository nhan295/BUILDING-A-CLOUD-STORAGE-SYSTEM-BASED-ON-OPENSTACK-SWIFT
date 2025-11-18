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
} from "lucide-react";
import "../style/ObjectManagement.css";
import {
  getObject,
  uploadFile,
  deleteObject,
  downloadObject,
} from "../logic/ObjectManagement.js";
import { getStoredRoles } from "../../pages/logic/Login";
import { toast } from "react-toastify";

export default function ObjectManagement() {
  const [objects, setObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [selectedObjects, setSelectedObjects] = useState([]); // Danh sách object được chọn
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadFileName(file.name);
      setUploadProgress(0);

      const response = await uploadFile(containerName, file, setUploadProgress);

      if (response.success) {
        toast.success("File uploaded successfully!");
        setIsUploading(false);
        setUploadProgress(0);
      } else {
        if (response.message?.includes("already exists")) {
          const confirmReplace = window.confirm(
            `File "${file.name}" already exists in "${containerName}".\nDo you want to overwrite it?`
          );
          if (confirmReplace) {
            setUploadProgress(0);
            const replaceRes = await uploadFile(
              containerName,
              file,
              setUploadProgress,
              true
            );
            if (replaceRes.success) {
              toast.success("File overwritten successfully!");
            } else {
              toast.error("Overwrite failed: " + replaceRes.message);
            }
          }
          setIsUploading(false);
        } else {
          toast.error("Upload failed: " + response.message);
          setIsUploading(false);
        }
      }

      const updatedData = await getObject(containerName);
      const updatedList = updatedData.map((obj, index) => ({
        id: index + 1,
        name: obj.name,
        size: (obj.size / (1024 * 1024)).toFixed(2) + " MB",
        upload_at: new Date(obj.upload_at).toISOString().split("T")[0],
        type: obj.name.split(".").pop(),
        owner: obj.upload_by || "unknown",
      }));
      setObjects(updatedList);
    } catch (error) {
      console.error("Error while uploading file:", error);
      toast.error("Upload failed.");
      setIsUploading(false);
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

  // Xóa nhiều file cùng lúc
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

      // Xóa từng file
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

      // Cập nhật danh sách objects
      setObjects((prev) =>
        prev.filter((obj) => !selectedObjects.includes(obj.name))
      );
      setSelectedObjects([]);

      // Hiển thị kết quả
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

  // Chọn/bỏ chọn 1 object
  const handleSelectObject = (objectName) => {
    setSelectedObjects((prev) =>
      prev.includes(objectName)
        ? prev.filter((name) => name !== objectName)
        : [...prev, objectName]
    );
  };

  // Chọn/bỏ chọn tất cả
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
                <button
                  className="fm-delete-selected-btn"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 size={20} />
                  <span>Delete ({selectedObjects.length})</span>
                </button>
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
              <span>Uploading</span>
            </div>
            <button
              className="fm-toast-close"
              onClick={() => setIsUploading(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="fm-toast-filename">{uploadFileName}</div>
          <div className="fm-progress-container">
            <div
              className="fm-progress-bar"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="fm-progress-text">{uploadProgress}%</div>
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