const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  ML_SERVICE_URL: process.env.ML_SERVICE_URL,
  NODE_ENV: process.env.NODE_ENV || 'development'
};
