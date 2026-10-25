const AuditEvent = require('../models/AuditEvent');

exports.log = async (action, userId, details = {}) => {
  await AuditEvent.create({ action, userId, details });
};
