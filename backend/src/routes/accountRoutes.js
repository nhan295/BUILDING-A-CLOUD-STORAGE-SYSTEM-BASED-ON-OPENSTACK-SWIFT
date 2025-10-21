const express = require('express');
const router = express.Router()
const accountController = require('../controllers/accountController');
const validateToken = require('../middleware/validateToken');
//const checkRole = require('../middleware/checkRole');

module.exports.setup = (app)=>{
    app.use('/api/account',router);
    router.get('/account-size',validateToken,accountController.getProjectUsage);

}