const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');
const validateToken = require('../middleware/validateToken');
//const checkRole = require('../middleware/checkRole');

module.exports.setup = (app)=>{
    app.use('/api/containers',router);
    router.get('/',validateToken,containerController.getContainers);
    router.post('/create-container',validateToken,containerController.createContainer)
    router.delete('/delete-container/:containerName',validateToken,containerController.delContainer)

}