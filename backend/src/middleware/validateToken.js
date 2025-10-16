const axios = require('axios');
const { KEYSTONE_URL } = require('../config/swiftConfig');
const AUTH_URL = `${KEYSTONE_URL}/auth/tokens`;

const validateToken = async (req, res, next) => {
  try {
    const token = req.headers['x-auth-token'];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token not found' });
    }

    const response = await axios.get(AUTH_URL, {
      headers: { 'X-Auth-Token': token, 'X-Subject-Token': token },
    });

    const tokenData = response.data.token;

    // Kiểm tra project có tồn tại
    if (!tokenData.project || !tokenData.project.id) {
      return res.status(403).json({
        success: false,
        message: 'Token does not belong to a project',
      });
    }

    // Gán req
    req.token = token;
    req.user = {
      username: tokenData.user.name,
      id: tokenData.user.id,
      domain: tokenData.user.domain.name,
    };
    req.project = {
      name: tokenData.project.name,
      id: tokenData.project.id,
    };
    req.roles = (tokenData.roles || []).map((r) => r.name.toLowerCase());
    req.expires_at = tokenData.expires_at;

    console.log('Token validated successfully:', req.user, req.project, req.roles);

    next();
  } catch (error) {
    console.error('Validate token error:', error.message, error.response?.data);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

module.exports = validateToken;
