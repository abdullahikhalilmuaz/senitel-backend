const RiskAssessment = require('../models/RiskAssessment');
const AuthSession = require('../models/AuthSession');
const policy = require('../config/securityPolicy');

exports.evaluate = async (userId, sessionId, anomalyScore) => {
  let riskLevel = 'low';
  let action = 'continue';
  let trustScore = 100 - (anomalyScore * 100);

  if (anomalyScore >= policy.riskThresholds.medium) {
    riskLevel = 'high';
    action = 'restrict';
  } else if (anomalyScore >= policy.riskThresholds.low) {
    riskLevel = 'medium';
    action = 'step-up';
  }

  // Update Session State
  let sessionStatus = 'active';
  if (action === 'step-up') sessionStatus = 'step_up_required';
  if (action === 'restrict') sessionStatus = 'restricted';

  await AuthSession.findByIdAndUpdate(sessionId, {
    riskLevel,
    trustScore,
    lastAssessmentAt: new Date(),
    status: sessionStatus
  });

  // Log Assessment
  await RiskAssessment.create({
    sessionId,
    userId,
    anomalyScore,
    trustScore,
    riskLevel,
    action,
    modelVersion: 'iforest-v1'
  });

  return { riskLevel, action, trustScore };
};
