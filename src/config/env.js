const dotenv = require('dotenv');

dotenv.config();

const parsedPort = Number.parseInt(process.env.PORT || '5000', 10);
const parsedSmtpPort = Number.parseInt(process.env.SMTP_PORT || '587', 10);

module.exports = Object.freeze({
  PORT: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 5000,
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  ML_SERVICE_URL: (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, ''),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || '',
  SESSION_COOKIE_NAME: 'sentinel_session',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number.isInteger(parsedSmtpPort) && parsedSmtpPort > 0 ? parsedSmtpPort : 587,
  SMTP_SECURE: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  DEMO_OTP_ENABLED: String(process.env.DEMO_OTP_ENABLED || 'false').toLowerCase() === 'true',
});
