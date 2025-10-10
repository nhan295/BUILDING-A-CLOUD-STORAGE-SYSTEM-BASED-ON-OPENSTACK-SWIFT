// User database from OpenStack Keystone
const userDatabase = {
  admin: {
    password: 'ahkqSD2#',
    domain: 'Default',
    projects: ['admin'],
    role: 'admin'
  },
  swiftuser: {
    password: 'SWIFT_PASS',
    domain: 'Default',
    projects: ['swiftproject'],
    role: 'member'
  }
};

/**
 * Validate user credentials
 */
export const validateLogin = (username, password, domain, project) => {
  if (!username.trim()) {
    return { success: false, message: 'Vui lòng nhập username' };
  }

  if (!password) {
    return { success: false, message: 'Vui lòng nhập password' };
  }

  if (!project) {
    return { success: false, message: 'Vui lòng chọn project' };
  }

  const user = userDatabase[username];
  
  if (!user) {
    return { 
      success: false, 
      message: `User "${username}" không tồn tại` 
    }
  }

  if (user.password !== password) {
    return { 
      success: false, 
      message: 'Password không chính xác' 
    };
  }

  if (user.domain !== domain) {
    return { 
      success: false, 
      message: `User không tồn tại trong domain "${domain}"` 
    };
  }

  if (!user.projects.includes(project)) {
    return { 
      success: false, 
      message: `User không có quyền truy cập project "${project}"` 
    };
  }

  return {
    success: true,
    message: 'Đăng nhập thành công!',
    user: {
      username,
      project,
      domain,
      role: user.role,
      timestamp: new Date().toLocaleTimeString('vi-VN')
    }
  };
};

/**
 * Get available projects for a user
 */
export const getAvailableProjects = (username) => {
  if (!username.trim() || !userDatabase[username]) {
    return [];
  }
  return userDatabase[username].projects;
};

/**
 * Get all available domains
 */
export const getAvailableDomains = () => {
  return ['Default'];
};