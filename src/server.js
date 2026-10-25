const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const env = require("./config/env");
const socketServer = require("./sockets/socketServer");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", credentials: true },
});

// Initialize Socket.IO logic
socketServer(io);

// Connect to Database
connectDB();

// Use Render's assigned port, fallback to your env.PORT or 5000
const PORT = process.env.PORT || env.PORT || 5000;

// CRITICAL: Bind to '0.0.0.0' for Render deployment
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});
