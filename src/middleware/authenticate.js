const crypto = require('crypto');
const sessionService = require('../services/sessionService');

module.exports = async (req, res, next) => {
  const token = req.cookies.sentinel_session;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const session = await sessionService.validateSession(tokenHash);

  if (!session) return res.status(401).json({ message: 'Session expired or revoked' });

  req.user = session.userId;
  req.session = session;
  next();
};
