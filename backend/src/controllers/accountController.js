const { SWIFT_URL } = require('../config/swiftConfig');
const axios = require('axios')

// Lấy dung lượng của project (theo account tương ứng)
const getProjectUsage = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];
    const projectId = req.project.id; // từ middleware validateToken

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token not found',
      });
    }

    // Gọi Swift API để lấy thông tin account (project)
    const response = await axios.get(`${SWIFT_URL}/AUTH_${projectId}`, {
      headers: { 'X-Auth-Token': token },
    });

    const headers = response.headers;

    return res.status(200).json({
      success: true,
      project_id: projectId,
      bytes_used: parseInt(headers['x-account-bytes-used']) || 0,
      quota_bytes: parseInt(headers['x-account-meta-quota-bytes']) || 0,
    });
  } catch (error) {
    console.error('Get project usage error:', error.message);

    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Token may not have access to this project',
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in Swift',
      });
    }

    return res.status(500).json({
      success: false,
      message: `Error: ${error.message}`,
    });
  }
};

module.exports = {
  getProjectUsage,
};
