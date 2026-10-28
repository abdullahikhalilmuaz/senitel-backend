// Load environment variables before importing app.js (which uses CLIENT_URL).
const env = require('./config/env');
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const socketServer = require('./sockets/socketServer');

const server = http.createServer(app);
const origins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://cau-system.onrender.com',
  env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: origins, credentials: true, methods: ['GET', 'POST'] },
});
socketServer(io);

async function start() {
  try {
    if (!env.MONGO_URI) throw new Error('MONGO_URI is not set in backend/.env');
    await connectDB();
    const port = Number(process.env.PORT || env.PORT || 5000);
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${port}`);
    });
  } catch (error) {
    console.error('Backend startup failed:', error.message);
    process.exitCode = 1;
  }
}

start();

function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  io.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
