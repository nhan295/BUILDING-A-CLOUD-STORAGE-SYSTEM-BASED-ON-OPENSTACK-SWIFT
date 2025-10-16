const express = require('express');
const validateToken = require('../middleware/validateToken');
const router = express.Router();
const objectController = require('../controllers/objectController');
//const checkRole = require('../middleware/checkRole');

module.exports.setup = (app) =>{
    app.use('/api/object',router);

    router.get('/:container',validateToken,objectController.getObject);
    router.post('/:container/new-object',validateToken,objectController.newObject);
    router.delete('/:container/:object',validateToken,objectController.delObject);
}

