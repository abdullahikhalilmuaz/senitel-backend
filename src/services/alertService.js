const SecurityAlert = require('../models/SecurityAlert');

exports.createAlert = async (userId, sessionId, type, severity, reason) => {
  return await SecurityAlert.create({ userId, sessionId, type, severity, reason });
};
