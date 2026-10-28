const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  if (!env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('MongoDB Connected');
  return mongoose.connection;
};

module.exports = connectDB;
