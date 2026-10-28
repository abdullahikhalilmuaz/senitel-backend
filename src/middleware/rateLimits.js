const rateLimit = require('express-rate-limit');

const common = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ message: 'Too many attempts. Please try again later.' }),
};

exports.authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: false,
});

exports.behaviourLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  max: 60,
});
