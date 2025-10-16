const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validateToken = require('../middleware/validateToken');

module.exports.setup = (app) =>{
    app.use('/api/users',router);

    router.get('/project-users',validateToken,userController.getProjectUsers);
}