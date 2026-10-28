const AuthSession = require('../models/AuthSession');
const BehaviourProfile = require('../models/BehaviourProfile');
const SecurityAlert = require('../models/SecurityAlert');
const AuditEvent = require('../models/AuditEvent');
const mlService = require('../services/mlService');
const asyncHandler = require('../utils/asyncHandler');

exports.getSummary = asyncHandler(async (req, res) => {
  const [session, profile, activeSessions, unresolvedAlerts, events, model] = await Promise.all([
    AuthSession.findById(req.session._id).select('status trustScore riskLevel lastAssessmentAt'),
    BehaviourProfile.findOne({ userId: req.user._id }).select('status sampleCount featureSchemaVersion modelVersion'),
    AuthSession.countDocuments({ userId: req.user._id, status: { $in: ['active', 'step_up_required'] } }),
    SecurityAlert.countDocuments({ userId: req.user._id, status: 'open' }),
    AuditEvent.find({ userId: req.user._id }).select('action status createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    mlService.checkHealth(),
  ]);

  res.status(200).json({
    session: session || { status: 'unknown', trustScore: 0, riskLevel: 'unknown' },
    monitoring: {
      profileStatus: profile ? profile.status : 'not_started',
      sampleCount: profile ? profile.sampleCount : 0,
      requiredSamples: 20,
      modelStatus: model.serviceStatus || model.status || 'unknown',
      modelVersion: model.modelVersion || null,
      productionReady: Boolean(model.productionReady),
    },
    counts: { activeSessions, unresolvedAlerts },
    recentEvents: events,
  });
});
