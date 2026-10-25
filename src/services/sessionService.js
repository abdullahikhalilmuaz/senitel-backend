const AuthSession = require('../models/AuthSession');

exports.validateSession = async (tokenHash) => {
  const session = await AuthSession.findOne({ tokenHash }).populate('userId');
  if (!session) return null;
  if (session.status === 'revoked' || session.status === 'expired') return null;
  if (new Date() > session.expiresAt) {
    session.status = 'expired';
    await session.save();
    return null;
  }
  return session;
};

exports.updateSessionState = async (sessionId, updates) => {
  return await AuthSession.findByIdAndUpdate(sessionId, updates, { new: true });
};
