import React, { useState, useEffect } from 'react';
import {useParams} from 'react-router-dom'
import { Upload, Trash2, Search, FolderOpen, Download, Eye } from 'lucide-react';
import '../style/ObjectManagement.css';
import { getObject } from '../logic/ObjectManagement.js'; // API call lấy danh sách object

export default function ObjectManagement ()  {
  const [objects, setObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const {containerName} = useParams();

  // 🔹 Fetch danh sách object từ API Swift
  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const data = await getObject(containerName); // Truyền containerName
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

  // 📤 Upload file giả lập (có thể thay bằng API upload thật)
  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);

    uploadedFiles.forEach((file) => {
      const newFile = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type,
        upload_at: new Date().toISOString().split('T')[0],
      };

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setObjects((prev) => [...prev, newFile]);
          setTimeout(() => setUploadProgress(0), 500);
        }
      }, 100);
    });
  };

  // 🗑️ Xóa file khỏi danh sách
  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa file này?')) {
      setObjects(objects.filter((file) => file.id !== id));
      if (selectedFile?.id === id) setSelectedFile(null);
    }
  };

  // 👁️ Xem chi tiết file
  const handleView = (file) => setSelectedFile(file);

  // 🔍 Lọc file theo tên
  const filteredFiles = objects.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🧩 Icon cho từng loại file
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
      {/* Toolbar */}
      <div className="fm-toolbar">
        <div className="fm-search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm file..."
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

      {/* Upload progress bar */}
      {uploadProgress > 0 && (
        <div className="fm-upload-progress">
          <div className="fm-progress-bar">
            <div className="fm-progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
          <span className="fm-progress-text">{uploadProgress}%</span>
        </div>
      )}

      {/* Main content */}
      <div className="fm-content">
        <div className="fm-file-list">
          {filteredFiles.length === 0 ? (
            <div className="fm-empty-state">
              <FolderOpen size={64} />
              <p>Không tìm thấy file nào</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tên File</th>
                  <th>Kích Thước</th>
                  <th>Ngày Upload</th>
                  <th>Thao Tác</th>
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
                        <button className="fm-action-btn download">
                          <Download size={18} />
                        </button>
                        <button className="fm-action-btn delete" onClick={() => handleDelete(file.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* File preview */}
        {selectedFile && (
          <div className="fm-file-preview">
            <div className="fm-preview-header">
              <h3>Chi Tiết File</h3>
              <button className="fm-close-btn" onClick={() => setSelectedFile(null)}>×</button>
            </div>
            <div className="fm-preview-content">
              <div className="fm-preview-icon">{getFileIcon(selectedFile.type)}</div>
              <div className="fm-preview-details">
                <div className="fm-detail-row"><span className="label">Tên file:</span><span>{selectedFile.name}</span></div>
                <div className="fm-detail-row"><span className="label">Kích thước:</span><span>{selectedFile.size}</span></div>
                <div className="fm-detail-row"><span className="label">Loại:</span><span>{selectedFile.type}</span></div>
                <div className="fm-detail-row"><span className="label">Ngày upload:</span><span>{selectedFile.upload_at}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

