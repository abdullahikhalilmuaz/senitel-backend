const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

exports.scoreFeatures = async (features, sessionId) => {
  try {
    const response = await axios.post(`${env.ML_SERVICE_URL}/internal/score`, {
      schemaVersion: 1,
      sessionId,
      features
    }, { timeout: 3000 });

    if (response.data.status !== 'scored') {
      throw new Error('Invalid ML response status');
    }
    return response.data;
  } catch (error) {
    console.error('ML Service Error:', error.message);
    // Safe fallback: Do not assume safe. Return a default high anomaly score to trigger verification if ML is down.
    return { status: 'scored', anomalyScore: 0.8, modelVersion: 'fallback', schemaVersion: 1 };
  }
};

exports.checkHealth = async () => {
  try {
    const res = await axios.get(`${env.ML_SERVICE_URL}/health`, { timeout: 2000 });
    return res.data;
  } catch (e) {
    return { status: 'unavailable' };
  }
};
