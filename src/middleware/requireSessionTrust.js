const BLOCKED_SESSION_STATES = Object.freeze({
  step_up_required: {
    code: 'STEP_UP_REQUIRED',
    message: 'Additional verification is required before you can continue using protected features.',
  },
  restricted: {
    code: 'SESSION_RESTRICTED',
    message: 'This session is restricted after a high-risk assessment. Complete the required verification to restore access.',
  },
});

/**
 * Apply to protected API operations. Keep /auth/me, /auth/logout, and the
 * verification endpoints outside this middleware so users can recover safely.
 */
module.exports = function requireSessionTrust(req, res, next) {
  if (!req.session) {
    return res.status(401).json({ message: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' });
  }

  const block = BLOCKED_SESSION_STATES[req.session.status];
  if (block) {
    return res.status(403).json(block);
  }

  if (req.session.status !== 'active') {
    return res.status(403).json({
      message: 'This session is not active. Sign in again to continue.',
      code: 'SESSION_NOT_ACTIVE',
    });
  }

  return next();
};

module.exports.BLOCKED_SESSION_STATES = BLOCKED_SESSION_STATES;
