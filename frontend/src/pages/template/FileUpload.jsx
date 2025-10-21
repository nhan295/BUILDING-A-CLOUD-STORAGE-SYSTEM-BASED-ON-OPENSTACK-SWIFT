import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import {
  formatFileSize,
  processFiles,
  handleDragEvent,
  handleDropEvent,
  handleFileInputChange,
  removeFileFromList,
  uploadAllFiles,
  getContainersAPI
} from '../logic/FileUpload.js';
import '../style/FileUpload.css';

export default function FileUpload ()  {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [container, setContainer] = useState('');
  const [containers, setContainers] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      const data = await getContainersAPI();
      setContainers(data);
    } catch (error) {
      console.error('Error loading containers:', error);
    }
  };

  const addFiles = (newFiles) => {
    const filesWithMetadata = processFiles(newFiles);
    setFiles(prev => [...prev, ...filesWithMetadata]);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'uploading':
        return <Loader className="icon-spin status-icon uploading" />;
      case 'success':
        return <CheckCircle className="status-icon success" />;
      case 'error':
        return <AlertCircle className="status-icon error" />;
      default:
        return <File className="status-icon pending" />;
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1 className="title">Upload Files</h1>
        <p className="subtitle">Tải lên files vào OpenStack Swift Storage</p>
      </div>

      <div className="container-select-card">
        <label className="label">Chọn Container</label>
        <select 
          className="select-input"
          value={container}
          onChange={(e) => setContainer(e.target.value)}
        >
          <option value="">-- Chọn container --</option>
          {containers.map(c => (
            <option key={c.name} value={c.name}>{c.label}</option>
          ))}
        </select>
      </div>

      <div 
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={(e) => handleDragEvent(e, setDragActive, true)}
        onDragLeave={(e) => handleDragEvent(e, setDragActive, false)}
        onDragOver={(e) => handleDragEvent(e, setDragActive, true)}
        onDrop={(e) => handleDropEvent(e, setDragActive, addFiles)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileInputChange(e, addFiles)}
          className="file-input"
        />
        <Upload className="upload-icon" />
        <h3 className="dropzone-title">Kéo thả files vào đây</h3>
        <p className="dropzone-text">hoặc click để chọn files</p>
        <p className="dropzone-hint">Hỗ trợ tất cả các loại file</p>
      </div>

      {files.length > 0 && (
        <div className="files-list">
          <div className="files-header">
            <h3>Files đã chọn ({files.length})</h3>
            {files.some(f => f.status === 'pending') && (
              <button 
                className="btn-upload" 
                onClick={() => uploadAllFiles(files, container, setFiles)}
              >
                <Upload className="btn-icon" />
                Upload All
              </button>
            )}
          </div>

          <div className="files-items">
            {files.map(fileData => (
              <div key={fileData.id} className="file-item">
                <div className="file-info">
                  {getStatusIcon(fileData.status)}
                  <div className="file-details">
                    <div className="file-name">{fileData.name}</div>
                    <div className="file-size">{formatFileSize(fileData.size)}</div>
                  </div>
                </div>

                {fileData.status === 'uploading' && (
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar"
                      style={{ width: `${fileData.progress}%` }}
                    />
                  </div>
                )}

                {fileData.status === 'pending' && (
                  <button 
                    className="btn-remove"
                    onClick={() => removeFileFromList(fileData.id, files, setFiles)}
                  >
                    <X className="icon-sm" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

