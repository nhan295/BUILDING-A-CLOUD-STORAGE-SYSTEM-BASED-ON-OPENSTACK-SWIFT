const { SWIFT_URL } = require('../config/swiftConfig');
const axios = require('axios')
const fs = require('fs');

const LOG_PATH = '/var/log/swift/proxy-access.log';

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
    const projectId = req.project?.id;
    console.log('=== DEBUG: Incoming getAccountLogs ===');
    console.log('Project ID:', projectId);
    console.log('Log path:', LOG_PATH);

    if (!projectId) {
      console.warn('⚠️ Missing project_id in request');
      return res.status(400).json({ success: false, message: 'Missing project_id' });
    }

    // Kiểm tra file log tồn tại
    const logExists = fs.existsSync(LOG_PATH);
    console.log('DEBUG: checking log exists?', logExists);

    if (!logExists) {
      return res.status(404).json({ success: false, message: 'Log file not found' });
    }

    // Đọc nội dung log
    console.log('DEBUG: Reading log file...');
    const data = fs.readFileSync(LOG_PATH, 'utf8');
    console.log('DEBUG: Log file size (bytes):', Buffer.byteLength(data, 'utf8'));

    // Lọc dòng log theo project
    const lines = data
      .split('\n')
      .filter(line => line.includes(`AUTH_${projectId}`))
      .slice(-100);

    console.log(`DEBUG: Found ${lines.length} lines for project AUTH_${projectId}`);

    // Regex Swift log
    const regex = /\b(PUT|DELETE|GET|POST|HEAD)\b\s+(\/v1\/AUTH_[^ ]+)\s+HTTP\/1\.\d\s+(\d+)\s.*?\s([A-Za-z0-9\._-]+)?/;

    const formatted = lines.map((line, index) => {
      const match = line.match(regex);
      if (match) {
        return {
          line: index + 1,
          action: match[1],
          path: match[2],
          status: match[3],
          user_or_token: match[4] || 'unknown',
        };
      }
      return { line: index + 1, raw: line };
    });

    console.log('DEBUG: Returning', formatted.length, 'formatted log entries');

    return res.status(200).json({
      success: true,
      project_id: projectId,
      total: formatted.length,
      logs: formatted
    });

  } catch (error) {
    console.error('❌ ERROR reading Swift logs:', error.message);
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
