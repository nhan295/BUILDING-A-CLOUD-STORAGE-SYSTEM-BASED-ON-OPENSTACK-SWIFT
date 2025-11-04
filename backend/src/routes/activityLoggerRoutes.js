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
};