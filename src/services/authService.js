const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const AuditEvent = require('../models/AuditEvent');
const ApiError = require('../utils/ApiError');

exports.registerUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ApiError(409, 'Email already exists');
  
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({ name: data.name, email: data.email, passwordHash });
  
  await AuditEvent.create({ action: 'REGISTER', userId: user._id });
  return { userId: user._id };
};

exports.loginUser = async (email, password, ip) => {
  const user = await User.findOne({ email });
  if (!user || user.status === 'disabled') {
    await AuditEvent.create({ action: 'LOGIN_FAIL', details: { email, ip } });
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await AuditEvent.create({ action: 'LOGIN_FAIL', userId: user._id, details: { ip } });
    throw new ApiError(401, 'Invalid credentials');
  }

  // Create session
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session = await AuthSession.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    deviceMetadata: { ip }
  });

  await AuditEvent.create({ action: 'LOGIN_SUCCESS', userId: user._id });
  return { session, token: rawToken };
};

exports.logoutUser = async (sessionId) => {
  await AuthSession.findByIdAndUpdate(sessionId, { status: 'revoked' });
};
