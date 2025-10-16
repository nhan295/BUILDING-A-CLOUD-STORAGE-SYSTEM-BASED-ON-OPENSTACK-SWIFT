const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');
const validateToken = require('../middleware/validateToken');
module.exports.setup = (app)=>{
    app.use('/api/containers',router);
    router.get('/',validateToken,containerController.getContainers);
    router.post('/creat-container',validateToken,containerController.createContainer)
    router.delete('/delete-container',validateToken,containerController.delContainer)

}