const express = require('express');
const router = express.Router();
const sysUserController = require('../controllers/sysUserController');
const validateToken = require('../middleware/validateToken');

module.exports.setup = (app)=>{
    app.use('/api/users',router);
    router.get('/',validateToken,sysUserController.getUsers); 
    router.post('/create-user',validateToken,sysUserController.createUser);
    router.delete('/delete/:userId',validateToken,sysUserController.deleteUser);
    router.post('/assign',validateToken,sysUserController.assignUsertoProject);

}
