const behaviourService = require('../services/behaviourService');
const asyncHandler = require('../utils/asyncHandler');

exports.submitBatch = asyncHandler(async (req, res) => {
  const result = await behaviourService.processBatch(req.user._id, req.session._id, req.body);
  res.status(202).json(result);
});
