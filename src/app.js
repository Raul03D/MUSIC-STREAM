const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const musicRoutes = require("./routes/music.routes");

const app = express();

// CORS configuration supporting cookies and headers
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

const fs = require("fs");

// Serve uploaded audio and cover files
const uploadsPath = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// Serve static frontend: prefer modern React build (frontend/dist), fallback to public
const frontendDistPath = path.join(__dirname, "../frontend/dist");
const publicPath = path.join(__dirname, "../public");

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
}
app.use(express.static(publicPath));

// API health check
app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", service: "Groovify Music API", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/music", musicRoutes);

// SPA fallback for client-side routing
app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "API endpoint not found" });
    }
    const distIndex = path.join(__dirname, "../frontend/dist/index.html");
    const publicIndex = path.join(__dirname, "../public/index.html");
    const indexPath = fs.existsSync(distIndex) ? distIndex : publicIndex;
    res.sendFile(indexPath);
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
    });
});

module.exports = app;