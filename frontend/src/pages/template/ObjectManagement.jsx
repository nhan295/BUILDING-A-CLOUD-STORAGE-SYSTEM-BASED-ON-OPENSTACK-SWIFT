import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Trash2, Search, FolderOpen, Download, Eye } from 'lucide-react';
import '../style/ObjectManagement.css';
import { getObject, uploadFile, deleteObject, downloadObject } from '../logic/ObjectManagement.js';
import { getStoredRoles } from "../../pages/logic/Login"; // added this line

export default function ObjectManagement() {
  const [objects, setObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { containerName } = useParams();

  // 🔐 Get role from localStorage or context
  const roles = getStoredRoles() || [];
  const isAdmin = roles.includes("admin");

  // 🔹 Fetch object list from Swift API
  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const data = await getObject(containerName);
        const list = data.map((obj, index) => ({
          id: index + 1,
          name: obj.name,
          size: (obj.size / (1024 * 1024)).toFixed(2) + ' MB',
          upload_at: new Date(obj.upload_at).toISOString().split('T')[0],
          type: obj.name.split('.').pop(),
        }));
        setObjects(list);
      } catch (error) {
        console.error('❌ Failed to fetch objects:', error);
      }
    };
    fetchObjects();
  }, [containerName]);

  // 📤 Upload file
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadProgress(0);
      const response = await uploadFile(containerName, file, setUploadProgress);

      if (response.success) {
        alert('✅ File uploaded successfully!');
      } else {
        if (response.message?.includes('already exists')) {
          const confirmReplace = window.confirm(
            `⚠️ File "${file.name}" already exists in "${containerName}".\nDo you want to overwrite it?`
          );
          if (confirmReplace) {
            const replaceRes = await uploadFile(containerName, file, setUploadProgress, true);
            if (replaceRes.success) {
              alert('✅ File overwritten successfully!');
            } else {
              alert('❌ Overwrite failed: ' + replaceRes.message);
            }
          }
        } else {
          alert('❌ Upload failed: ' + response.message);
        }
      }

      const updatedData = await getObject(containerName);
      const updatedList = updatedData.map((obj, index) => ({
        id: index + 1,
        name: obj.name,
        size: (obj.size / (1024 * 1024)).toFixed(2) + ' MB',
        upload_at: new Date(obj.upload_at).toISOString().split('T')[0],
        type: obj.name.split('.').pop(),
      }));
      setObjects(updatedList);
    } catch (error) {
      console.error('Error while uploading file:', error);
      alert('Upload failed.');
    }
  };

  // 🗑️ Delete file
  const handleDeleteObject = async (containerName, objectName) => {
    if (!window.confirm(`Are you sure you want to delete the file "${objectName}"?`)) return;
    try {
      const response = await deleteObject(containerName, objectName);
      if (response?.success) {
        alert(`File "${objectName}" deleted successfully!`);
        setObjects(objects.filter(o => o.name !== objectName));
      } else {
        alert(`❌ Delete failed: ${response?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("An error occurred while deleting the file!");
    }
  };

  const handleDownload = async (containerName, objectName) => {
    try {
      await downloadObject(containerName, objectName);
      console.log(`Downloading file: ${objectName}`);
    } catch (error) {
      console.error("Error while downloading container:", error);
      alert("Failed to download container!");
    }
  };

  const handleView = (file) => setSelectedFile(file);

  const filteredFiles = objects.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    return '📁';
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

        <label className="fm-upload-btn">
          <Upload size={20} />
          <span>Upload File</span>
          <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {uploadProgress > 0 && (
        <div className="fm-upload-progress">
          {/* you can add progress bar display here */}
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
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className={selectedFile?.id === file.id ? 'fm-selected' : ''}>
                    <td>
                      <div className="fm-file-info">
                        <span className="fm-file-icon">{getFileIcon(file.type)}</span>
                        <span className="fm-file-name">{file.name}</span>
                      </div>
                    </td>
                    <td>{file.size}</td>
                    <td>{file.upload_at}</td>
                    <td>
                      <div className="fm-actions">
                        <button className="fm-action-btn view" onClick={() => handleView(file)}>
                          <Eye size={18} />
                        </button>
                        <button
                          className="fm-action-btn download"
                          onClick={() => handleDownload(containerName, file.name)}>
                          <Download size={18} />
                        </button>
                        {/* ✅ Only show delete button if user is admin */}
                        {isAdmin && (
                          <button className="fm-action-btn delete" onClick={() => handleDeleteObject(containerName, file.name)}>
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
              <button className="fm-close-btn" onClick={() => setSelectedFile(null)}>×</button>
            </div>
            <div className="fm-preview-content">
              <div className="fm-preview-icon">{getFileIcon(selectedFile.type)}</div>
              <div className="fm-preview-details">
                <div className="fm-detail-row"><span className="label">File Name:</span><span>{selectedFile.name}</span></div>
                <div className="fm-detail-row"><span className="label">Size:</span><span>{selectedFile.size}</span></div>
                <div className="fm-detail-row"><span className="label">Type:</span><span>{selectedFile.type}</span></div>
                <div className="fm-detail-row"><span className="label">Upload Date:</span><span>{selectedFile.upload_at}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
