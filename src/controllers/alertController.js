const SecurityAlert = require('../models/SecurityAlert');
const asyncHandler = require('../utils/asyncHandler');

exports.listAlerts = asyncHandler(async (req, res) => {
  const alerts = await SecurityAlert.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(alerts);
});
