import api from '../../../api';
export const getObject = async(containerName)=>{
    try{
        const response = await api.get(`/api/object/${containerName}`);
        return response.data.objects || [];
    }catch(error){
        console.error('Error: ',error);
    }
}

export const uploadFile = async (container, files, setUploadProgress, replace = false) => {
  try {
    const formData = new FormData();

    for (const f of files) {
      formData.append("files", f);
    }

    const res = await api.post(
      `/api/object/${container}/upload?replace=${replace}`,
      formData,
      {
        onUploadProgress: (event) => {
          if (setUploadProgress && event.total) {
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      }
    );

    return res.data;
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



export const deleteObject = async (containerName, objectName) => {
    try{
        const response = await api.delete(`/api/object/${containerName}/${objectName}`);
        if(response.data.success){
        return {
        success: true,
        message: response.data.message
      };
    }
    }catch(error){
        console.error('Error: ',error);
    }
}

export const downloadObject = async(containerName,objectName)=>{
    try {
    const res = await api.get(`/api/object/${containerName}/${objectName}/download`, {
      responseType: 'blob', // quan trọng
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', objectName);
    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (err) {
    console.error('Download error:', err);
    alert('Cannot download object!');
  }
}
