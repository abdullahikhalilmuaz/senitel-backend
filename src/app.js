const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const verifyOrigin = require('./middleware/verifyOrigin');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const behaviourRoutes = require('./routes/behaviourRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const modelRoutes = require('./routes/modelRoutes');

const app = express();
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://cau-system.onrender.com',
  env.CLIENT_URL,
].filter(Boolean));

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header include local curl/health checks.
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(verifyOrigin);
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'degraded',
    database: databaseConnected ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/behaviour', behaviourRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/model', modelRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
