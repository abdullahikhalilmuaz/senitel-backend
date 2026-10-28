const crypto = require('crypto');
const env = require('../config/env');
const sessionService = require('../services/sessionService');

function getCookie(header, key) {
  if (!header || typeof header !== 'string') return null;
  for (const segment of header.split(';')) {
    const index = segment.indexOf('=');
    if (index < 0) continue;
    const name = segment.slice(0, index).trim();
    if (name !== key) continue;
    try { return decodeURIComponent(segment.slice(index + 1).trim()); }
    catch { return null; }
  }
  return null;
}

module.exports = async (socket, next) => {
  try {
    const token = getCookie(socket.handshake.headers.cookie, env.SESSION_COOKIE_NAME);
    if (!token || token.length > 512) return next(new Error('Unauthorized'));
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await sessionService.validateSession(tokenHash);
    if (!session || !session.userId || ['restricted', 'revoked', 'expired'].includes(session.status)) {
      return next(new Error('Unauthorized'));
    }
    socket.data.userId = String(session.userId._id);
    socket.data.sessionId = String(session._id);
    socket.data.sessionStatus = session.status;
    return next();
  } catch (error) {
    return next(new Error('Unauthorized'));
  }
};
