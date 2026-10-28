const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

exports.scoreFeatures = async (features, sessionId, baseline = null) => {
  let response;
  try {
    response = await axios.post(`${env.ML_SERVICE_URL}/internal/score`, {
      schemaVersion: 1,
      sessionId: String(sessionId),
      features,
      ...(baseline ? { baseline } : {}),
    }, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const detail = error.response?.status ? `HTTP ${error.response.status}` : error.code || 'connection error';
    console.error(`ML service scoring failed (${detail}): ${error.message}`);
    throw new ApiError(503, 'Behaviour scoring service is unavailable. No authentication decision was made.');
  }

  const data = response && response.data;
  if (!data || data.status !== 'scored' || data.schemaVersion !== 1 ||
      typeof data.anomalyScore !== 'number' || !Number.isFinite(data.anomalyScore) ||
      data.anomalyScore < 0 || data.anomalyScore > 1 ||
      typeof data.modelVersion !== 'string' || !data.modelVersion) {
    throw new ApiError(503, 'Behaviour scoring service returned an invalid response. No authentication decision was made.');
  }
  if (data.baselineUsed && data.scoreMode !== 'personalized_baseline') {
    throw new ApiError(503, 'Behaviour scoring service returned an inconsistent baseline response.');
  }
  return data;
};

exports.checkHealth = async () => {
  try {
    const health = await axios.get(`${env.ML_SERVICE_URL}/health`, { timeout: 2000 });
    const status = await axios.get(`${env.ML_SERVICE_URL}/internal/model/status`, { timeout: 2000 });
    return {
      service: health.data?.service || 'sentinel-ml-service',
      serviceStatus: health.data?.status === 'ok' ? 'available' : 'unavailable',
      ...status.data,
    };
  } catch (error) {
    return {
      status: 'unavailable',
      serviceStatus: 'unavailable',
      modelAvailable: false,
      productionReady: false,
    };
  }
};
