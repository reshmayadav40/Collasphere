require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const noteRoutes = require("./routes/noteRoutes");
const fileRoutes = require("./routes/fileRoutes");
const geminiRoutes = require("./routes/geminiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
console.log("KEY CHECK:", process.env.GEMINI_API_KEY);
// Connect to MongoDB
connectDB()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => {
    console.error("Database connection error:", err.message);

    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.method !== "GET") {
    console.log("METHOD:", req.method);
    console.log("HEADERS:", req.headers["content-type"]);
    console.log("BODY:", req.body);
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/notifications", notificationRoutes);

// Direct download route bypass to avoid any potential router conflicts
const { downloadProjectZip } = require("./controllers/fileController");
const { optionalProtect } = require("./middleware/authMiddleware");
app.get(
  "/api/download/project/:projectId",
  optionalProtect,
  downloadProjectZip,
);

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));

// Root route
app.get("/", (req, res) => {
  res.send("CollabSphere API is running 🚀");
});

// Health Check
app.get("/api/health", async (req, res) => {
  const mongoose = require("mongoose");
  const status =
    mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.json({ status, database: mongoose.connection.name });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route Not Found" });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Server Error" });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
