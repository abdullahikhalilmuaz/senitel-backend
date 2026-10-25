const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const behaviourRoutes = require("./routes/behaviourRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const alertRoutes = require("./routes/alertRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const modelRoutes = require("./routes/modelRoutes");

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Dynamic CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://cau-system.onrender.com", // Your frontend URL
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // Pass false instead of an Error to reject the request cleanly
        // without triggering a 500 Internal Server Error
        console.log("Blocked by CORS:", origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/behaviour", behaviourRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/model", modelRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// Global Error Handler
app.use(errorHandler);

module.exports = app;
