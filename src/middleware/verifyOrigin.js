const env = require('../config/env');

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://cau-system.onrender.com',
  env.CLIENT_URL,
].filter(Boolean));
const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

module.exports = (req, res, next) => {
  if (!mutatingMethods.has(req.method)) return next();
  const origin = req.get('origin');
  // Native clients/curl may omit Origin. If a browser supplies it, require an
  // exact allow-list match; CORS by itself does not stop CSRF side effects.
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ message: 'Request origin is not allowed' });
  }
  next();
};
