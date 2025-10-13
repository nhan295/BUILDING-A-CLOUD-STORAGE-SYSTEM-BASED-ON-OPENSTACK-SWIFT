/**
 * Auth Controller
 * Xử lý logic xác thực người dùng
 */
const axios = require('axios');

const { KEYSTONE_URL } = require('../config/swiftConfig');

const AUTH_URL = `${KEYSTONE_URL}/auth/tokens`;
const PROJECTS_URL = `${KEYSTONE_URL}/projects`;

/**
 * Login - Xác thực user với Keystone
 */
exports.login = async (req, res) => {
  try {
    const { username, password, project, domain = 'Default' } = req.body;

    // Validate input
    if (!username || !password || !project) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp username, password và project'
      });
    }

    // Prepare Keystone auth payload
    const authPayload = {
      auth: {
        identity: {
          methods: ['password'],
          password: {
            user: {
              name: username,
              domain: { name: domain },
              password: password
            }
          }
        },
        scope: {
          project: {
            name: project,
            domain: { name: domain }
          }
        }
      }
    };

    // Call Keystone API
    const response = await axios.post(AUTH_URL, authPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Extract token and user info
    const token = response.headers['x-subject-token'];
    const tokenData = response.data;

    const userInfo = tokenData.token.user;
    const projectInfo = tokenData.token.project;
    const roles = tokenData.token.roles;

    // Get available projects for this user
    let availableProjects = [];
    try {
      const projectsResponse = await axios.get(PROJECTS_URL, {
        headers: { 'X-Auth-Token': token }
      });
      availableProjects = projectsResponse.data.projects.map(p => ({
        name: p.name,
        id: p.id
      }));
    } catch (error) {
      console.error('Error fetching projects:', error.message);
      // Nếu lỗi, trả về project hiện tại
      availableProjects = [{
        name: projectInfo.name,
        id: projectInfo.id
      }];
    }

    // Prepare response
    return res.status(201).json({
      success: true,
      message: '✓ Đăng nhập thành công!',
      data: {
        token: token,
        user: {
          username: userInfo.name,
          user_id: userInfo.id,
          domain: userInfo.domain.name
        },
        project: {
          name: projectInfo.name,
          id: projectInfo.id,
          domain: projectInfo.domain.name
        },
        roles: roles.map(role => role.name),
        availableProjects: availableProjects,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Handle specific errors
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: '❌ Username hoặc password không chính xác'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: '❌ Không thể kết nối đến Keystone'
      });
    }

    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: `❌ Lỗi server: ${error.message}`
    });
  }
};

/**
 * Logout - Xóa token từ Keystone
 */
exports.logout = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token không tìm thấy'
      });
    }

    // Revoke token in Keystone
    await axios.delete(AUTH_URL, {
      headers: { 'X-Auth-Token': token }
    });

    return res.status(200).json({
      success: true,
      message: 'Đã đăng xuất'
    });

  } catch (error) {
    console.error('Logout error:', error.message);
    return res.status(500).json({
      success: false,
      message: `Lỗi: ${error.message}`
    });
  }
};

/**
 * Get available projects for authenticated user
 */
exports.getProjects = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không tìm thấy'
      });
    }

    // Get projects from Keystone
    const response = await axios.get(PROJECTS_URL, {
      headers: { 'X-Auth-Token': token }
    });

    const projects = response.data.projects.map(p => ({
      name: p.name,
      id: p.id,
      domain_id: p.domain_id
    }));

    return res.status(200).json({
      success: true,
      data: {
        projects: projects
      }
    });

  } catch (error) {
    console.error('Get projects error:', error.message);
    return res.status(500).json({
      success: false,
      message: `Lỗi: ${error.message}`
    });
  }
};

/**
 * Validate token - Kiểm tra token còn hợp lệ không
 */
exports.validateToken = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không tìm thấy'
      });
    }

    // Validate token with Keystone
    const response = await axios.get(AUTH_URL, {
      headers: { 'X-Auth-Token': token }
    });

    const tokenData = response.data.token;

    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          username: tokenData.user.name,
          user_id: tokenData.user.id,
          domain: tokenData.user.domain.name
        },
        project: {
          name: tokenData.project.name,
          id: tokenData.project.id
        },
        roles: tokenData.roles.map(role => role.name),
        expires_at: tokenData.expires_at
      }
    });

  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    console.error('Validate token error:', error.message);
    return res.status(500).json({
      success: false,
      message: `Lỗi: ${error.message}`
    });
  }
};

/**
 * Get user info - Lấy thông tin user
 */
exports.getUserInfo = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không tìm thấy'
      });
    }

    // Get token info from Keystone
    const response = await axios.get(AUTH_URL, {
      headers: { 'X-Auth-Token': token }
    });

    const tokenData = response.data.token;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          username: tokenData.user.name,
          user_id: tokenData.user.id,
          domain: tokenData.user.domain.name
        },
        project: {
          name: tokenData.project.name,
          id: tokenData.project.id,
          domain: tokenData.project.domain.name
        },
        roles: tokenData.roles.map(role => ({
          name: role.name,
          id: role.id
        })),
        issued_at: tokenData.issued_at,
        expires_at: tokenData.expires_at
      }
    });

  } catch (error) {
    console.error('Get user info error:', error.message);
    return res.status(500).json({
      success: false,
      message: `Lỗi: ${error.message}`
    });
  }
};
