const mlService = require('../services/mlService');
const asyncHandler = require('../utils/asyncHandler');

exports.getStatus = asyncHandler(async (req, res) => {
  const status = await mlService.checkHealth();
  res.status(status.serviceStatus === 'unavailable' ? 503 : 200).json(status);
});

exports.getMetrics = asyncHandler(async (req, res) => {
  res.status(200).json({
    available: false,
    note: 'No labelled evaluation dataset has been recorded. FAR/FRR and production-validation claims are unavailable until measured on a consented test set.',
  });
});
