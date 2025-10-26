const { SWIFT_URL } = require('../config/swiftConfig');
const axios = require('axios')

// Lấy dung lượng của project (theo account tương ứng)
const getAccountSize = async (req, res) => {
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

const getAccountLogs = async(req,res)=>{
  try {
    const { project_id } = req.params; // project id truyền trên URL
    if (!project_id) {
      return res.status(400).json({ success: false, message: 'Missing project_id' });
    }

    // Đọc file log
    const data = fs.readFileSync(LOG_PATH, 'utf8');

    // Tách từng dòng và lọc theo project
    const logs = data
      .split('\n')
      .filter(line => line.includes(`AUTH_${project_id}`))
      .slice(-100); // chỉ lấy 100 dòng cuối cùng cho nhẹ

    // Format gọn gàng hơn (action + file + user)
    const formatted = logs.map(line => {
      const match = line.match(/"(PUT|DELETE|GET)\s+([^"]+)\s+HTTP\/1\.\d".+"(\w+)"$/);
      if (match) {
        return {
          action: match[1],
          path: match[2],
          user: match[3],
          raw: line
        };
      } else {
        return { raw: line };
      }
    });

    return res.status(200).json({
      success: true,
      project_id,
      total: formatted.length,
      logs: formatted
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to read Swift logs',
      error: error.message
    });
  }
}

module.exports = {
  getAccountSize,
  getAccountLogs
};
