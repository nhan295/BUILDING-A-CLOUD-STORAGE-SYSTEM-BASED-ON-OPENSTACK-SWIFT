const express = require('express');
const router = express.Router();
const validateToken = require('../middleware/validateToken');
const { getRecentActivity } = require('../controllers/activityLogger.js'); 

module.exports.setup = (app) => {
  app.use('/api/activity', router);
 
  router.get('/recent', validateToken, (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 30;
      
      // Validate limit
      if (limit < 1 || limit > 100) {
        return res.status(400).json({ 
          success: false, 
          message: 'Limit must be between 1 and 100' 
        });
      }

      const logs = getRecentActivity(limit);
      
      res.json({ 
        success: true, 
        count: logs.length,
        activities: logs 
      });
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch activities' 
      });
    }
  });

  /**
   * GET /api/activity/user/:username
   */
  router.get('/user/:username', validateToken, (req, res) => {
    try {
      const { username } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      
      if (limit < 1 || limit > 100) {
        return res.status(400).json({ 
          success: false, 
          message: 'Limit must be between 1 and 100' 
        });
      }

      const allLogs = getRecentActivity(limit * 2);
      const userLogs = allLogs
        .filter(log => log.username === username)
        .slice(0, limit);
      
      res.json({ 
        success: true, 
        username,
        count: userLogs.length,
        activities: userLogs 
      });
    } catch (error) {
      console.error('Error fetching user activities:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch user activities' 
      });
    }
  });
};