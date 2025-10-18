import api from '../../../api';

export const totalContainer = async() => {
    try {
        const response = await api.get('/api/containers/');
        return response.data.total_containers || 0; // Trả về số
    } catch (error) {
        console.error('Lỗi khi lấy danh sách container:', error);
        return 0; // Trả về 0 thay vì object
    }
}

export const totalObject = async(container) => {
    try {
        const response = await api.get(`/api/object/${container}`);
        return response.data.total_objects || 0; // Trả về số
    } catch (error) {
        console.error(`Lỗi khi lấy object trong container ${container}:`, error);
        return 0; // Trả về 0 thay vì object
    }
}
export default{
  totalContainer,
  totalObject
}