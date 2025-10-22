import api from '../../../api';

export const getContainers = async()=>{
    try{
        const response = await api.get('/api/containers/')
        return response.data.containers || [];

    }catch(error){
        console.error('Lỗi khi lấy danh sách container:', error);

    }

}
export const createContainer = async(container)=>{
    try{
        const response = await api.post('/api/containers/create-container', {container})
        return response.data;  
    }catch(error){
        console.error('Lỗi khi tạo container:', error);
        throw error; 
    }
}

export const uploadFile = async (container, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post(`/api/object/${container}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: res.data,
    };
  } catch (err) {
    console.error("Upload file error:", err);

    return {
      success: false,
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unknown error",
    };
  }
};

export const delContainer = async(containerName)=>{
  try{
    const response = await api.delete(`/api/containers/delete-container/${containerName}`)
    if(response.data.success){
      return {
        success: true,
        message: response.data.message
      };
    }
  }catch(error){
    console.error('Lỗi khi xóa container:', error);
  }

}
export const downloadContainer = async(containerName) => {
  try {
    const response = await api.get(`/api/containers/download-container/${containerName}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${containerName}.zip`;
    document.body.appendChild(link);
    link.click();

    // Dọn dẹp
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 1000);

  } catch (error) {
    console.error("Lỗi tải container:", error);
    alert("❌ Không thể tải container!");
  }
};


export default {
    getContainers,
    createContainer,
    uploadFile,
    delContainer,
    downloadContainer
}
