const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const env = require('./config/env');
const socketServer = require('./sockets/socketServer');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', credentials: true }
});

// Initialize Socket.IO logic
socketServer(io);

// Connect to Database
connectDB();

server.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
