const BehaviourBatch = require('../models/BehaviourBatch');
const BehaviourProfile = require('../models/BehaviourProfile');
const mlService = require('./mlService');
const riskService = require('./riskService');
const featureService = require('./featureService');
const ApiError = require('../utils/ApiError');
const policy = require('../config/securityPolicy');

exports.processBatch = async (userId, sessionId, payload) => {
  const validationError = featureService.validatePayload(payload);
  if (validationError) throw new ApiError(400, validationError);

  const source = payload.source || 'live';
  const batch = await BehaviourBatch.create({
    userId,
    sessionId,
    observedAt: new Date(payload.observedAt),
    features: payload.features,
    featureSchemaVersion: payload.schemaVersion,
    source,
    processingStatus: 'pending',
  });

  try {
    let profile = await BehaviourProfile.findOne({ userId });
    let baseline = null;

    // Use only the previously enrolled profile for this score so the current
    // observation cannot influence the baseline against which it is compared.
    if (source === 'live' && profile && profile.status === 'ready' &&
        profile.sampleCount >= policy.baseline.minimumSamples &&
        profile.featureStats?.mean && profile.featureStats?.std) {
      baseline = {
        status: 'ready',
        sampleCount: profile.sampleCount,
        featureStats: profile.featureStats,
      };
    }

    // Enrollment is explicit and only accepts live samples. Simulated batches
    // never become part of a user's profile.
    if (source === 'live' && profile && profile.status === 'collecting') {
      featureService.addEnrollmentSample(profile, payload.features);
      await profile.save();
    }

    const mlResponse = await mlService.scoreFeatures(payload.features, sessionId, baseline);
    const decision = await riskService.evaluate(userId, sessionId, mlResponse, {
      policyEligible: source === 'live' && Boolean(mlResponse.baselineUsed),
      source,
    });

    batch.processingStatus = 'processed';
    await batch.save();

    return {
      batchId: batch._id,
      processingStatus: batch.processingStatus,
      enrollment: profile ? { status: profile.status, sampleCount: profile.sampleCount } : { status: 'not_started', sampleCount: 0 },
      model: {
        modelVersion: mlResponse.modelVersion,
        scoreMode: mlResponse.scoreMode,
        baselineUsed: Boolean(mlResponse.baselineUsed),
        scoreIsProbability: false,
        trainingDataKind: mlResponse.trainingDataKind || 'unknown',
      },
      decision,
    };
  } catch (error) {
    batch.processingStatus = 'rejected';
    await batch.save().catch((saveError) => {
      console.error('Failed to mark behaviour batch rejected:', saveError.message);
    });
    throw error;
  }
};
