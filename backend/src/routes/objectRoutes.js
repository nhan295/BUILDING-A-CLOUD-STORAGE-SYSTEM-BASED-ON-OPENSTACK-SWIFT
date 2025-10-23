const express = require('express');
const validateToken = require('../middleware/validateToken');
const router = express.Router();
const objectController = require('../controllers/objectController');
//const checkRole = require('../middleware/checkRole');
const multer = require('multer');
const upload = multer();

module.exports.setup = (app) =>{
    app.use('/api/object',router);

    router.get('/:container',validateToken,objectController.getObject);
    router.post('/:container/upload',validateToken, upload.single('file'),objectController.newObject);
    router.delete('/:container/:object',validateToken,objectController.delObject);
    router.get('/:container/:object/download',validateToken,objectController.downloadObject);
}

