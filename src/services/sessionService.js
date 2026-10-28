const AuthSession = require('../models/AuthSession');
const policy = require('../config/securityPolicy');

exports.validateSession = async (tokenHash) => {
  const session = await AuthSession.findOne({ tokenHash }).populate('userId');
  if (!session) return null;
  if (['revoked', 'expired'].includes(session.status)) return null;

  const now = Date.now();
  if (!session.expiresAt || now >= new Date(session.expiresAt).getTime()) {
    session.status = 'expired';
    await session.save();
    return null;
  }

  const lastActivity = session.lastActivityAt ? new Date(session.lastActivityAt).getTime() : 0;
  if (!lastActivity || now - lastActivity > policy.session.maxIdleMs) {
    session.status = 'expired';
    await session.save();
    return null;
  }

  if (!session.userId || session.userId.status !== 'active') {
    session.status = 'revoked';
    await session.save();
    return null;
  }

  session.lastActivityAt = new Date(now);
  await session.save();
  return session;
};

exports.updateSessionState = async (sessionId, updates) =>
  AuthSession.findByIdAndUpdate(sessionId, updates, { new: true, runValidators: true });
