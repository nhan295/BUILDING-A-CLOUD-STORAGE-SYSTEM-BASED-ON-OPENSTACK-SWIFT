const express = require("express");
const router = express.Router();
const validateToken = require("../middleware/validateToken");
const { checkClusterHealth, getClusterOverview } = require("../controllers/checkHealth");

module.exports.setup = (app)=>{
    app.use('/api/check',router);
    router.get("/health", validateToken, checkClusterHealth);
    router.get("/overview", validateToken, getClusterOverview);
}


