const axios = require('axios');
const { KEYSTONE_URL } = require('../config/swiftConfig');
const AUTH_URL = `${KEYSTONE_URL}/auth/tokens`;

const validateToken = async (req, res, next) => {
  try {
    const token = req.headers['x-auth-token'];
    
    // DEBUG LOG
    console.log('=== VALIDATE TOKEN DEBUG ===');
    console.log('Token received:', token ? 'YES' : 'NO');
    console.log('Token value:', token);
    console.log('AUTH_URL:', AUTH_URL);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token not found',
      });
    }

    console.log('Calling Keystone validation...');
    const response = await axios.get(AUTH_URL, {
      headers: { 'X-Auth-Token': token, 'X-Subject-Token': token },
    });

    console.log('Keystone response status:', response.status);
    console.log('Token data:', JSON.stringify(response.data, null, 2));

    const tokenData = response.data.token;

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
    req.roles = tokenData.roles.map((r) => r.name);
    req.expires_at = tokenData.expires_at;

    console.log('Token validated successfully!');
    console.log('User:', req.user);
    console.log('Project:', req.project);
    console.log('Roles:', req.roles);

    next();
  } catch (error) {
    console.error('=== VALIDATE TOKEN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Full error:', error);
    
    if (error.response?.status === 404) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired',
      });
    }

    console.error('Validate token error:', error.message);
    return res.status(500).json({
      success: false,
      message: `Error: ${error.message}`,
    });
  }
};

module.exports = validateToken