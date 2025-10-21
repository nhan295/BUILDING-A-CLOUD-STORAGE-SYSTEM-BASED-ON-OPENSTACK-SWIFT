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


export default {
    getContainers,
    createContainer,
    uploadFile,
}
