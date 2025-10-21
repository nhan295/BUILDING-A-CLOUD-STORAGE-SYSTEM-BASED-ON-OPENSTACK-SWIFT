import api from '../../../api';

export const totalContainer = async() => {
    try {
        const response = await api.get('/api/containers/');
        return response.data.total_containers || 0; 
    } catch (error) {
        console.error('Lỗi khi lấy danh sách container:', error);
        return 0; // Trả về 0 thay vì object
    }
}

export const totalObject = async(container) => {
    try {
        const response = await api.get(`/api/object/${container}`);
        return response.data.total_objects || 0; 
    } catch (error) {
        console.error(`Lỗi khi lấy object trong container ${container}:`, error);
        return 0; // Trả về 0 thay vì object
    }
}

export const totalProjectUser = async()=>{
    try{
        const response = await api.get('/api/users/project-users');
        return response.data.total_users || 0;
    }catch(error){
        console.error('Lỗi khi lấy danh sách user trong project:', error);
        return 0;
    }
}

export const projectSize = async()=>{
    try{
        const response = await api.get('api/account/account-size');
        const {bytes_used,quota_bytes} =  response.data;
        return {
            bytes_used: bytes_used || 0,
            quota_bytes: quota_bytes || 0
        }
    }catch(error){
        console.error('Lỗi khi lấy dung lượng project:', error);
        return 0;
    }
}
export default{
    totalContainer,
    totalObject,
    totalProjectUser,
    projectSize
}