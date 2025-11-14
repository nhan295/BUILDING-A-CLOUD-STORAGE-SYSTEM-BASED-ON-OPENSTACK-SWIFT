require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const containerRoutes = require('./routes/containerRoutes')
const objectRoutes = require('./routes/objectRoutes');
const accountRoutes = require('./routes/accountRoutes');
const sysProjectRoutes = require('./routes/sysProjectRoutes');
const sysUserRoutes = require('./routes/sysUserRoutes');
const activityLogger = require('./routes/activityLoggerRoutes');
const checkHealth = require('./routes/checkHealthRoutes');

const app = express();
app.use(
    cors({
        origin: ["http://localhost:3000","http://localhost:5173"],
        credentials: true,
    })
)
app.use(express.json());
app.use(cookieParser());

authRoutes.setup(app);
userRoutes.setup(app);
containerRoutes.setup(app);
objectRoutes.setup(app);
accountRoutes.setup(app);
sysProjectRoutes.setup(app);
sysUserRoutes.setup(app);
activityLogger.setup(app);
checkHealth.setup(app);

app.use((req,res,next)=>{
    console.log(`${req.method} ${req.path}`);
    next();
})


app.use((req,res)=>{
    res.status(404).json({
        success: false,
        message: 'Route not found',
    })
});

//global error handler
app.use((err,req,res,next)=>{
    console.error('Error: ',err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message: undefined,
    })
});

module.exports = app;