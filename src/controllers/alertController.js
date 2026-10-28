const SecurityAlert = require('../models/SecurityAlert');
const asyncHandler = require('../utils/asyncHandler');
const sanitize = require('../utils/sanitize');

exports.listAlerts = asyncHandler(async (req, res) => {
  const alerts = await SecurityAlert.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.status(200).json(sanitize(alerts));
});
