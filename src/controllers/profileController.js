const asyncHandler = require('../utils/asyncHandler');
const BehaviourProfile = require('../models/BehaviourProfile');

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await BehaviourProfile.findOne({ userId: req.user._id });
  res.status(200).json(profile);
});

exports.startEnrolment = asyncHandler(async (req, res) => {
  let profile = await BehaviourProfile.findOne({ userId: req.user._id });
  if (!profile) {
    profile = await BehaviourProfile.create({ userId: req.user._id, status: 'collecting' });
  } else {
    profile.status = 'collecting';
    profile.sampleCount = 0;
    await profile.save();
  }
  res.status(200).json(profile);
});
