require("dotenv").config();
const app = require("./src/app");

const port =  process.env.PORT || 5001;
app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}.`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔐 Keystone URL: ${process.env.KEYSTONE_URL}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Closing server...");
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});

process.on("SIGINT", () => {
    console.log("\nSIGINT received. Closing server...");
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});