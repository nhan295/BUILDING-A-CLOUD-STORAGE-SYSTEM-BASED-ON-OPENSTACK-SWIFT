import api from '../../../api';

export const handleLogout = async()=>{
  try{
    const token = localStorage.getItem('auth_token');
    if(!token){
      clearAuthStorage();
      return { success: true, message: 'Logged out' }; 
    }
    const response = await api.post('/api/auth/logout',{
      method: 'POST',
      headers: {
        'X-Auth-Token': token
      }
    });
    clearAuthStorage();
    if(!response.ok){
      throw new Error('Logout failed');
    }
    return{
      success: true,
      message: 'Logged out successfully'
    }
  }catch(error){
    clearAuthStorage();
    console.error('Logout error:', error);
    return{
      success: false,
      message: `Error: ${error.message}`
    }
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
  localStorage.removeItem('project_info');
  localStorage.removeItem('roles');
  localStorage.removeItem('available_projects');
};

export default {
    handleLogout,
    clearAuthStorage
}