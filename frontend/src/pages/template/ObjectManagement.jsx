import React, { useState, useEffect } from 'react';
import {useParams} from 'react-router-dom'
import { Upload, Trash2, Search, FolderOpen, Download, Eye } from 'lucide-react';
import '../style/ObjectManagement.css';
import { getObject,uploadFile,deleteObject,downloadObject } from '../logic/ObjectManagement.js';
import { getStoredRoles } from "../../pages/logic/Login"; // thêm dòng này


export default function ObjectManagement ()  {
  const [objects, setObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const {containerName} = useParams();

  // 🔐 Lấy role từ localStorage hoặc context
  const roles = getStoredRoles() || [];
  const isAdmin = roles.includes("admin");

  // 🔹 Fetch danh sách object từ API Swift
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
        alert('✅ Upload file thành công!');
      } else {
        if (response.message?.includes('already exists')) {
          const confirmReplace = window.confirm(
            `⚠️ File "${file.name}" đã tồn tại trong "${containerName}".\nBạn có muốn ghi đè không?`
          );
          if (confirmReplace) {
            const replaceRes = await uploadFile(containerName, file, setUploadProgress, true);
            if (replaceRes.success) {
              alert('✅ Đã ghi đè file thành công!');
            } else {
              alert('❌ Ghi đè thất bại: ' + replaceRes.message);
            }
          }
        } else {
          alert('❌ Upload thất bại: ' + response.message);
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
      console.error('Lỗi khi upload file:', error);
      alert('Upload thất bại.');
    }
  };

  // 🗑️ Xóa file
  const handleDeleteObject = async(containerName,objectName)=>{
    if(!window.confirm(`Bạn có chắc muốn xóa file "${objectName}" không?`))
      return;
    try{
      const response = await deleteObject(containerName,objectName);
      if(response?.success){
        alert(`Xóa file "${objectName}" thành công!`);
        setObjects(objects.filter(o=>o.name !== objectName));
      }else{
        alert(`❌ Xóa thất bại: ${response?.message || "Không xác định"}`);
      }
    }catch(error){
      console.error("Loi khi xoa file",error);
      alert("Có lỗi xảy ra khi xóa file!");
    }
  }

  const handleDownload = async(containerName,objectName)=>{
    try {
      await downloadObject(containerName,objectName);
      console.log(`Đang tải file: ${objectName}`);
    } catch (error) {
      console.error("Lỗi khi tải container:", error);
      alert("Không thể tải container!");
    }
  }

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

      {uploadProgress > 0 && (
        <div className="fm-upload-progress">
          
        </div>
      )}

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
                        <button 
                          className="fm-action-btn download"
                          onClick={()=>handleDownload(containerName,file.name)}>
                          <Download size={18} />
                        </button>
                        {/* ✅ Chỉ hiển thị nút xóa nếu là admin */}
                        {isAdmin && (
                          <button className="fm-action-btn delete" onClick={() => handleDeleteObject(containerName,file.name)}>
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