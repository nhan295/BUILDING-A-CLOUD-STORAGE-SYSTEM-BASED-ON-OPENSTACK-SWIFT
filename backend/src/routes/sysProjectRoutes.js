const express = require('express');
const router = express.Router();
const projectController = require('../controllers/sysProjectController');
const validateToken = require('../middleware/validateToken');
module.exports.setup = (app)=>{
    app.use('/api/projects',router);
    router.get('/',validateToken,projectController.getProject); //done
    router.post('/create-project',validateToken,projectController.createProject); //done
    router.delete('/delete/:projectId',validateToken,projectController.deleteProject); //done
    router.post('/set-quota/:projectId',validateToken,projectController.setProjectQuota); // done

}