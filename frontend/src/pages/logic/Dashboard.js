import api from '../../../api';

export const totalContainer = async() => {
    try {
        const response = await api.get('/api/containers/');
        return response.data.containers || 0; 
    } catch (error) {
        console.error('Error while fetching container list:', error);
        return 0; // Return 0 instead of object
    }
}

export const totalObject = async(container) => {
    try {
        const response = await api.get(`/api/object/${container}`);
        return response.data.total_objects || 0; 
    } catch (error) {
        console.error(`Error while fetching objects in container ${container}:`, error);
        return 0; // Return 0 instead of object
    }
}

export const totalProjectUser = async()=> {
    try {
        const response = await api.get('/api/users/project-users');
        return response.data.total_users || 0;
    } catch (error) {
        console.error('Error while fetching project users:', error);
        return 0;
    }
}

export const projectSize = async()=> {
    try {
        const response = await api.get('api/account/account-size');
        const { bytes_used, quota_bytes } = response.data;
        return {
            bytes_used: bytes_used || 0,
            quota_bytes: quota_bytes || 0
        }
    } catch (error) {
        console.error('Error while fetching project storage size:', error);
        return 0;
    }
}

export default {
    totalContainer,
    totalObject,
    totalProjectUser,
    projectSize
}
