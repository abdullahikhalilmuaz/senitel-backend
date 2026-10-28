const RiskAssessment = require('../models/RiskAssessment');
const AuthSession = require('../models/AuthSession');
const AuditEvent = require('../models/AuditEvent');
const alertService = require('./alertService');
const policy = require('../config/securityPolicy');
const ApiError = require('../utils/ApiError');

exports.evaluate = async (userId, sessionId, mlResponse, options = {}) => {
  const anomalyScore = mlResponse?.anomalyScore;
  if (typeof anomalyScore !== 'number' || !Number.isFinite(anomalyScore) || anomalyScore < 0 || anomalyScore > 1) {
    throw new ApiError(503, 'Invalid anomaly score; no session decision was applied');
  }

  const session = await AuthSession.findOne({ _id: sessionId, userId });
  if (!session) throw new ApiError(404, 'Session not found');

  const baselineUsed = Boolean(mlResponse.baselineUsed && mlResponse.scoreMode === 'personalized_baseline');
  const policyApplied = Boolean(options.policyEligible && baselineUsed);
  let riskLevel = 'unknown';
  let action = 'continue';
  const calculatedTrustScore = Math.round((1 - anomalyScore) * 100);
  let trustScore = policyApplied ? calculatedTrustScore : null;
  let nextStatus = session.status;

  if (!policyApplied && options.source === 'live' && !['restricted', 'revoked', 'expired'].includes(session.status)) {
    session.riskLevel = 'unknown';
    session.lastAssessmentAt = new Date();
    await session.save();
  }

  if (policyApplied) {
    if (anomalyScore >= policy.riskThresholds.high) {
      riskLevel = 'high';
      action = 'restrict';
      nextStatus = 'restricted';
    } else if (anomalyScore >= policy.riskThresholds.medium) {
      riskLevel = 'medium';
      action = 'step-up';
      nextStatus = 'step_up_required';
    } else {
      riskLevel = 'low';
      action = 'continue';
      // Do not silently remove a previously required step-up or restriction.
      if (!['step_up_required', 'restricted', 'revoked', 'expired'].includes(session.status)) {
        nextStatus = 'active';
      }
    }
    if (session.status === 'restricted') {
      riskLevel = 'high';
      action = 'restrict';
      nextStatus = 'restricted';
    }

    session.riskLevel = riskLevel;
    trustScore = calculatedTrustScore;
    session.trustScore = trustScore;
    session.lastAssessmentAt = new Date();
    session.status = nextStatus;
    if (action === 'step-up' || action === 'restrict') session.verificationStatus = 'pending';
    await session.save();
  }

  const assessment = await RiskAssessment.create({
    sessionId,
    userId,
    anomalyScore,
    trustScore: policyApplied ? trustScore : 0,
    riskLevel,
    action,
    modelVersion: mlResponse.modelVersion || 'unknown',
    policyVersion: policy.version,
    signals: Array.isArray(mlResponse.signals) ? mlResponse.signals.slice(0, 10) : [],
    scoreMode: mlResponse.scoreMode || 'unknown',
    baselineUsed,
    policyApplied,
  });

  if (policyApplied && (action === 'step-up' || action === 'restrict')) {
    await AuditEvent.create({
      action: 'RISK_POLICY_ACTION',
      status: action,
      userId,
      details: {
        sessionId: String(sessionId),
        riskLevel,
        anomalyScore: Number(anomalyScore.toFixed(4)),
        policyVersion: policy.version,
        baselineUsed: true,
      },
    });
  }

  if (policyApplied && action === 'step-up') {
    await alertService.createAlert(userId, sessionId, 'step_up_required', 'medium',
      'Behaviour deviated from the enrolled user baseline; additional verification is required.');
  } else if (policyApplied && action === 'restrict') {
    await alertService.createAlert(userId, sessionId, 'session_restricted', 'high',
      'Behaviour deviated substantially from the enrolled user baseline.');
  }

  return {
    assessmentId: assessment._id,
    riskLevel,
    action,
    trustScore,
    baselineUsed,
    policyApplied,
    sessionStatus: nextStatus,
    scoreMode: mlResponse.scoreMode || 'unknown',
    warning: policyApplied ? null : 'Score was recorded for demonstration/monitoring only; no authentication policy was applied without an enrolled baseline.',
  };
};
