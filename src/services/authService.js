const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const AuditEvent = require('../models/AuditEvent');
const ApiError = require('../utils/ApiError');
const policy = require('../config/securityPolicy');

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

exports.registerUser = async (data = {}) => {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = normalizeEmail(data.email);
  const password = typeof data.password === 'string' ? data.password : '';

  if (name.length < 2 || name.length > 100) throw new ApiError(400, 'Name must be between 2 and 100 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new ApiError(400, 'Enter a valid email address');
  }
  if (password.length < 10 || password.length > 128) {
    throw new ApiError(400, 'Password must be between 10 and 128 characters');
  }

  const existing = await User.findOne({ email }).select('_id');
  if (existing) throw new ApiError(409, 'Email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  let user;
  try {
    // Role is deliberately not accepted from the request body.
    user = await User.create({ name, email, passwordHash });
  } catch (error) {
    if (error && error.code === 11000) throw new ApiError(409, 'Email already exists');
    throw error;
  }

  await AuditEvent.create({ action: 'REGISTER', status: 'success', userId: user._id });
  return { userId: user._id, message: 'Account created' };
};

exports.loginUser = async (emailInput, passwordInput, ip) => {
  const email = normalizeEmail(emailInput);
  const password = typeof passwordInput === 'string' ? passwordInput : '';
  if (!email || !password || password.length > 128) throw new ApiError(401, 'Invalid credentials');

  const user = await User.findOne({ email });
  if (!user || user.status !== 'active') {
    await AuditEvent.create({ action: 'LOGIN_FAIL', status: 'failure', details: { email, ip } });
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await AuditEvent.create({ action: 'LOGIN_FAIL', status: 'failure', userId: user._id, details: { ip } });
    throw new ApiError(401, 'Invalid credentials');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + policy.session.maxAgeMs);

  const session = await AuthSession.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    lastActivityAt: new Date(),
    verificationStatus: 'verified',
    deviceMetadata: { ip: typeof ip === 'string' ? ip.slice(0, 64) : undefined },
  });

  await AuditEvent.create({ action: 'LOGIN_SUCCESS', status: 'success', userId: user._id });
  return { session, token: rawToken, user };
};

exports.logoutUser = async (sessionId) => {
  await AuthSession.findByIdAndUpdate(sessionId, { status: 'revoked' }, { runValidators: true });
};

exports.verifyStepUp = async (userId, sessionId, passwordInput) => {
  const password = typeof passwordInput === 'string' ? passwordInput : '';
  if (!password || password.length > 128) throw new ApiError(400, 'Password is required');

  const [user, session] = await Promise.all([
    User.findById(userId),
    AuthSession.findOne({ _id: sessionId, userId }),
  ]);
  if (!user || user.status !== 'active' || !session) throw new ApiError(401, 'Verification failed');
  if (session.status !== 'step_up_required') {
    throw new ApiError(409, 'This session does not currently require additional verification');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    session.verificationStatus = 'failed';
    await session.save();
    await AuditEvent.create({ action: 'STEP_UP_FAIL', status: 'failure', userId, details: { sessionId: String(sessionId) } });
    throw new ApiError(401, 'Verification failed');
  }

  session.status = 'active';
  session.verificationStatus = 'verified';
  session.riskLevel = 'low';
  session.trustScore = Math.max(session.trustScore || 0, 70);
  session.lastAssessmentAt = new Date();
  session.lastActivityAt = new Date();
  await session.save();
  await AuditEvent.create({ action: 'STEP_UP_SUCCESS', status: 'success', userId, details: { sessionId: String(sessionId) } });
  return session;
};
