const asyncHandler = require('../utils/asyncHandler');
const BehaviourProfile = require('../models/BehaviourProfile');
const sanitize = require('../utils/sanitize');
const policy = require('../config/securityPolicy');

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await BehaviourProfile.findOne({ userId: req.user._id });
  res.status(200).json(profile ? sanitize(profile) : {
    userId: req.user._id,
    status: 'not_started',
    sampleCount: 0,
    requiredSamples: policy.baseline.minimumSamples,
    featureStats: {},
  });
});

exports.startEnrolment = asyncHandler(async (req, res) => {
  const profile = await BehaviourProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      $set: {
        status: 'collecting',
        sampleCount: 0,
        featureStats: {},
        featureSchemaVersion: 1,
        modelVersion: 'iforest-v1',
      },
      $setOnInsert: { userId: req.user._id },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.status(200).json({
    message: 'Behavioural enrolment started. Complete at least 20 live feature batches.',
    requiredSamples: policy.baseline.minimumSamples,
    profile: sanitize(profile),
  });
});
