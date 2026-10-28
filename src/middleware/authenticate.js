const crypto = require('crypto');
const env = require('../config/env');
const sessionService = require('../services/sessionService');
const sanitize = require('../utils/sanitize');

module.exports = async function authenticate(req, res, next) {
  try {
    const token = req.cookies && req.cookies[env.SESSION_COOKIE_NAME];
    if (!token || typeof token !== 'string' || token.length > 512) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await sessionService.validateSession(tokenHash);
    if (!session || !session.userId) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    req.session = session;
    req.user = session.userId;
    // Keep accidental serialization of these objects safe in controllers.
    req.safeUser = sanitize(session.userId);
    next();
  } catch (error) {
    next(error);
  }
};
