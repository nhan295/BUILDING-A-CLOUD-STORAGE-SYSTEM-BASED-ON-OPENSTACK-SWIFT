import api from '../../../api'; // Adjust the import path as necessary

//Validate user credentials
 
export const handleLogin = async(username,password,project,domain) => {
 try{
  if (!username.trim()) {
    return { success: false, message: 'Please enter username' };
  }

  if (!password) {
    return { success: false, message: 'Please enter password' };
  }

  if (!project) {
    return { success: false, message: 'Please enter project' };
  }
    const response = await api.post('/api/auth/login', { username, password, project, domain });

    const data = response.data;
    if(!response === 201){
      return{
        success: false,
        mesage: data.message || 'Login failed'
      }
    }
    if(data.data?.token){
      localStorage.setItem('auth_token',data.data.token);
      localStorage.setItem('user_info',JSON.stringify(data.data.user));
      localStorage.setItem('project_info',JSON.stringify(data.data.project));
      localStorage.setItem('roles',JSON.stringify(data.data.roles));
      localStorage.setItem('available_projects', JSON.stringify(data.data.availableProjects));  
    }
    console.log('Login data:', data)
    return{
      
      success: true,
      message: data.message || 'Login successful',
      data: data.data
    }
 }catch(error){
  console.error('Login error:', error);
  return{
    success: false,
    message: `Error: ${error.message}`
  }

 };
}

//Validate token - check if token is still valid
 
export const validateToken = async () => {
  try {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      return { success: false, valid: false };
    }

    const response = await api.get('/api/auth/validate', {
      method: 'GET',
      headers: {
        'X-Auth-Token': token
      }
    });

    if (!response.ok) {
      clearAuthStorage();
      return { success: false, valid: false };
    }

    const data = await response.data;
    return {
      success: true,
      valid: data.data?.valid || true,
      data: data.data
    };

  } catch (error) {
    console.error('Validate token error:', error);
    clearAuthStorage();
    return { success: false, valid: false };
  }
};

// Get user info - get user info from token

export const getUserInfo = async () => {
  try {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      return {
        success: false,
        message: 'Token not found'
      };
    }

    const response = await api.get('/api/auth/user', {
      method: 'GET',
      headers: {
        'X-Auth-Token': token
      }
    });

    const data = await response.data;

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Can not get user info'
      };
    }

    return {
      success: true,
      data: data.data
    };

  } catch (error) {
    console.error('Get user info error:', error);
    return {
      success: false,
      message: `Lỗi: ${error.message}`
    };
  }
};


//Check if user is logged in

export const isLoggedIn = () => {
  return !!localStorage.getItem('auth_token');
};

//Get stored user info
export const getStoredUserInfo = () => {
  const userInfo = localStorage.getItem('user_info');
  return userInfo ? JSON.parse(userInfo) : null;
};


 // Get stored project info
 
export const getStoredProjectInfo = () => {
  const projectInfo = localStorage.getItem('project_info');
  return projectInfo ? JSON.parse(projectInfo) : null;
};


//Get stored roles

export const getStoredRoles = () => {
  const roles = localStorage.getItem('roles');
  return roles ? JSON.parse(roles) : [];
};

export const getAvailableProjects = () =>{
  const projects = localStorage.getItem('available_projects')
   return projects ? JSON.parse(projects) : [];
}

export const getAvailableDomains = () => {
  return ['Default'];
};
//Clear all auth data from localStorage
 
const clearAuthStorage = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
  localStorage.removeItem('project_info');
  localStorage.removeItem('roles');
  localStorage.removeItem('available_projects');
};

export default {
  handleLogin,
  validateToken,
  getUserInfo,
  isLoggedIn,
  getStoredUserInfo,
  getStoredProjectInfo,
  getStoredRoles,
  getAvailableProjects,
  getAvailableDomains
};