const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateToken = require('../middleware/validateToken');


module.exports.setup = (app) => {
    app.use('/api/auth', router);
    router.post('/login', authController.login);
    router.post('/logout', authController.logout);
    router.get('/user', authController.getUserInfo);
};