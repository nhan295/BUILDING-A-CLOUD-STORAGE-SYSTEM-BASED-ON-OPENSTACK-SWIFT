import api from '../../../api'; // Adjust the import path as necessary

//Validate user credentials
 
export const handleLogin = async (username, password, project, domain) => {
  try {
    if (!username.trim()) {
      return { success: false, message: 'Please enter username' };
    }

    if (!password) {
      return { success: false, message: 'Please enter password' };
    }

    if (!project) {
      return { success: false, message: 'Please enter project' };
    }

    const response = await api.post('/api/auth/login', {
      username,
      password,
      project,
      domain,
    });

    const data = response.data;

    if (response.status !== 201 && response.status !== 200) {
      return {
        success: false,
        message: data.message || 'Login failed',
      };
    }

    if (data.data?.token) {
      // Lưu last login
      const currentTime = new Date().toISOString();
      const previousLogin = localStorage.getItem('last_login');
      if (previousLogin) {
        localStorage.setItem('previous_login', previousLogin);
      }
      localStorage.setItem('last_login', currentTime);

      // Lưu thông tin đăng nhập
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user_info', JSON.stringify(data.data.user));
      localStorage.setItem('project_info', JSON.stringify(data.data.project));
      localStorage.setItem('roles', JSON.stringify(data.data.roles));
      localStorage.setItem(
        'available_projects',
        JSON.stringify(data.data.availableProjects)
      );

      // Chuyển hướng theo role
      const roles = data.data.roles || [];
      if (roles.includes('admin')) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/container-manager';
      }
    }

    console.log('Login data:', data);
    return {
      success: true,
      message: data.message || 'Login successful',
      data: data.data,
    };
  } catch (error) {
    console.error('Login error:', error);

    if (error.response) {
      if (error.response.status === 401) {
        return { success: false, message: 'Wrong username or password.' };
      } else if (error.response.status === 403) {
        return {
          success: false,
          message: 'Access denied. Please check your project or domain.',
        };
      } else {
        return {
          success: false,
          message:
            error.response.data?.message || 'Login failed. Please try again.',
        };
      }
    }

    return {
      success: false,
      message: 'Unable to connect to server. Please try again later.',
    };
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
