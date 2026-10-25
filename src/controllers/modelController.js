const mlService = require('../services/mlService');
const asyncHandler = require('../utils/asyncHandler');

exports.getStatus = asyncHandler(async (req, res) => {
  const status = await mlService.checkHealth();
  res.status(200).json(status);
});

exports.getMetrics = asyncHandler(async (req, res) => {
  // Return stored evaluation metrics from DB or static file in production
  res.status(200).json({ note: 'Metrics endpoint ready for data integration' });
});
