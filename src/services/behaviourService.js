const BehaviourBatch = require('../models/BehaviourBatch');
const mlService = require('./mlService');
const riskService = require('./riskService');
const featureService = require('./featureService');
const ApiError = require('../utils/ApiError');

exports.processBatch = async (userId, sessionId, payload) => {
  // 1. Validate Schema
  if (!featureService.validatePayload(payload)) {
    throw new ApiError(400, 'Invalid feature schema');
  }

  // 2. Save Batch
  const batch = await BehaviourBatch.create({
    userId,
    sessionId,
    observedAt: new Date(payload.observedAt),
    features: payload.features,
    featureSchemaVersion: payload.schemaVersion
  });

  // 3. Call ML Service
  const mlResponse = await mlService.scoreFeatures(payload.features, sessionId);
  
  // 4. Apply Risk Engine
  const decision = await riskService.evaluate(userId, sessionId, mlResponse.anomalyScore);
  
  // 5. Update Batch
  batch.processingStatus = 'processed';
  await batch.save();

  return { batchId: batch._id, decision };
};
