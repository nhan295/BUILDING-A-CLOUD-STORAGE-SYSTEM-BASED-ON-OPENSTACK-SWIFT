const express = require('express');
const { validateToken } = require('../controllers/authController');
const router = express.Router();
const objectController = require(('../controllers/objectController'))

module.exports.setup = (app) =>{
    app.use('/api/container',router);

    router.get('/:container/object',validateToken,objectController.getObject)
}
