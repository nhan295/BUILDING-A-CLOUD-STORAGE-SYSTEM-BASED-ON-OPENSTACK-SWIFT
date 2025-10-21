// uploadLogic.js - Tách logic xử lý upload

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const createFileMetadata = (file) => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    file: file,
    name: file.name,
    size: file.size,
    status: 'pending',
    progress: 0
  };
};

export const processFiles = (newFiles) => {
  return newFiles.map(file => createFileMetadata(file));
};

export const handleDragEvent = (e, setDragActive, isDragEnter) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(isDragEnter);
};

export const handleDropEvent = (e, setDragActive, addFilesCallback) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
  
  const droppedFiles = Array.from(e.dataTransfer.files);
  addFilesCallback(droppedFiles);
};

export const handleFileInputChange = (e, addFilesCallback) => {
  const selectedFiles = Array.from(e.target.files);
  addFilesCallback(selectedFiles);
};

export const removeFileFromList = (fileId, files, setFiles) => {
  setFiles(files.filter(f => f.id !== fileId));
};

export const validateUpload = (container) => {
  if (!container) {
    return {
      valid: false,
      message: 'Vui lòng chọn container'
    };
  }
  return {
    valid: true,
    message: ''
  };
};

export const updateFileStatus = (fileId, status, progress, setFiles) => {
  setFiles(prev => prev.map(f => 
    f.id === fileId ? { ...f, status, progress: progress || f.progress } : f
  ));
};

export const uploadSingleFile = async (fileData, container, setFiles) => {
  // Update status to uploading
  updateFileStatus(fileData.id, 'uploading', 0, setFiles);

  try {
    // Simulate upload với progress (thay bằng API thực tế)
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateFileStatus(fileData.id, 'uploading', i, setFiles);
    }

    // TODO: Replace with actual API call
    // const formData = new FormData();
    // formData.append('file', fileData.file);
    // await uploadFileAPI(container, formData, (progress) => {
    //   updateFileStatus(fileData.id, 'uploading', progress, setFiles);
    // });

    updateFileStatus(fileData.id, 'success', 100, setFiles);
    return { success: true };
  } catch (error) {
    updateFileStatus(fileData.id, 'error', 0, setFiles);
    return { success: false, error: error.message };
  }
};

export const uploadAllFiles = async (files, container, setFiles) => {
  const validation = validateUpload(container);
  if (!validation.valid) {
    alert(validation.message);
    return;
  }

  const pendingFiles = files.filter(f => f.status === 'pending');
  
  for (let fileData of pendingFiles) {
    await uploadSingleFile(fileData, container, setFiles);
  }
};

// API functions (cần implement thực tế)
// export const uploadFileAPI = async (container, formData, onProgress) => {
//   // TODO: Implement actual API call
//   // Example:
//   // return await api.post(`/api/containers/${container}/objects`, formData, {
//   //   onUploadProgress: (progressEvent) => {
//   //     const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//   //     onProgress(progress);
//   //   }
//   // });
  
//   throw new Error('API not implemented');
// };

export const getContainersAPI = async () => {
  // TODO: Implement actual API call
  // return await api.get('/api/containers');
  
  // Mock data
  return [
    { name: 'container1', label: 'Container 1' },
    { name: 'container2', label: 'Container 2' },
    { name: 'container3', label: 'Container 3' }
  ];
};