const axios = require('axios');
const { KEYSTONE_URL } = require('../config/swiftConfig');

const getProjectUsers = async (req, res) => {
  try {
    const adminToken = req.headers['x-auth-token'];
    const projectId = req.project.id;
    
    // DEBUG LOG
    console.log('=== GET PROJECT USERS DEBUG ===');
    console.log('Project ID:', projectId);
    console.log('Project Name:', req.project.name);
    console.log('User ID:', req.user.id);
    console.log('User Roles:', req.roles);
    console.log('Keystone URL:', KEYSTONE_URL);

    if (!adminToken) {
      return res.status(401).json({
        success: false,
        message: 'Token not found',
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    // Lấy role assignments của project
    const keystoneUrl = `${KEYSTONE_URL}/role_assignments?scope.project.id=${projectId}&include_names=True`;
    console.log('Calling Keystone API:', keystoneUrl);
    
    const response = await axios.get(keystoneUrl, {
      headers: { 'X-Auth-Token': adminToken },
    });

    // Map và deduplicate users
    const userMap = new Map();
    
    response.data.role_assignments
      .filter(r => r.user) // Chỉ lấy assignments có user
      .forEach(r => {
        const userId = r.user.id;
        const userName = r.user.name;
        const roleName = r.role?.name || 'Unknown';

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: userId,
            name: userName,
            roles: [roleName]
          });
        } else {
          // User existed → add role into array
          const existing = userMap.get(userId);
          if (!existing.roles.includes(roleName)) {
            existing.roles.push(roleName);
          }
        }
      });

    const users = Array.from(userMap.values());

    return res.status(200).json({
      success: true,
      project_id: projectId,
      project_name: req.project.name,
      total_users: users.length,
      users,
    });
  } catch (error) {
    console.error('=== GET PROJECT USERS ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Full error:', error);

    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Token may not have access to this project.',
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    return res.status(500).json({
      success: false,
      message: `Error: ${error.message}`,
    });
  }
};

module.exports = {
  getProjectUsers,
};