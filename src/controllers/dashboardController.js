const AuthSession = require('../models/AuthSession');
const BehaviourProfile = require('../models/BehaviourProfile');
const SecurityAlert = require('../models/SecurityAlert');
const asyncHandler = require('../utils/asyncHandler');

exports.getSummary = asyncHandler(async (req, res) => {
  const session = await AuthSession.findById(req.session._id);
  const profile = await BehaviourProfile.findOne({ userId: req.user._id });
  const activeSessions = await AuthSession.countDocuments({ userId: req.user._id, status: 'active' });
  const unresolvedAlerts = await SecurityAlert.countDocuments({ userId: req.user._id, status: 'open' });

  res.status(200).json({
    session: {
      status: session.status,
      trustScore: session.trustScore,
      riskLevel: session.riskLevel
    },
    monitoring: {
      profileStatus: profile ? profile.status : 'not_started',
      modelStatus: 'available'
    },
    counts: {
      activeSessions,
      unresolvedAlerts
    },
    recentEvents: []
  });
});
