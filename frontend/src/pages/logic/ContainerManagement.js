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