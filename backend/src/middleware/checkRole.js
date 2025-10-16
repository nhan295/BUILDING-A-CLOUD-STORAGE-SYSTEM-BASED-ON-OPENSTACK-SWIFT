const axios = require('axios');
const { KEYSTONE_URL } = require('../config/swiftConfig');

/**
 * Middleware kiểm tra token và quyền role từ Keystone
 * @param {string[]} allowedRoles - Danh sách role được phép (vd: ['admin'] hoặc ['member', 'admin'])
 */
function authorizeRole(allowedRoles = []) {
  return async (req, res, next) => {
    const token = req.headers['x-auth-token'];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token not provided' });
    }

    try {
      // Gọi Keystone để xác thực token
      const response = await axios.get(`${KEYSTONE_URL}/v3/auth/tokens`, {
        headers: {
          'X-Auth-Token': token,
          'X-Subject-Token': token,
        },
      });

      const tokenData = response.data.token;
      const userRoles = tokenData.roles.map(role => role.name.toLowerCase());
      req.user = {
        id: tokenData.user.id,
        name: tokenData.user.name,
        project: tokenData.project.name,
        roles: userRoles,
      };

      // Nếu không có role yêu cầu cụ thể, chỉ cần token hợp lệ là qua
      if (allowedRoles.length === 0) {
        return next();
      }

      // Kiểm tra xem user có ít nhất một role hợp lệ
      const hasRole = allowedRoles.some(role => userRoles.includes(role.toLowerCase()));
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Requires one of roles [${allowedRoles.join(', ')}]`,
        });
      }

      next(); // Hợp lệ
    } catch (error) {
      console.error('Error verifying Keystone token:', error.response?.data || error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  };
}

module.exports = authorizeRole;
