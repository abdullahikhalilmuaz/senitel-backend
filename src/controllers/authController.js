const authService = require('../services/authService');
const verificationService = require('../services/verificationService');
const asyncHandler = require('../utils/asyncHandler');
const sanitize = require('../utils/sanitize');
const env = require('../config/env');

function cookieOptions() {
  const production = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/',
  };
}

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const { session, token, user } = await authService.loginUser(req.body?.email, req.body?.password, req.ip);
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: Math.max(0, new Date(session.expiresAt).getTime() - Date.now()),
  });
  res.status(200).json({
    message: 'Logged in',
    user: sanitize(user),
    session: sanitize(session),
  });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.session._id);
  res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions());
  res.status(200).json({ message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: sanitize(req.user), session: sanitize(req.session) });
});

exports.verifyStepUp = asyncHandler(async (req, res) => {
  const session = await authService.verifyStepUp(req.user._id, req.session._id, req.body?.password);
  res.status(200).json({
    message: 'Additional verification successful',
    session: sanitize(session),
  });
});

exports.requestVerificationCode = asyncHandler(async (req, res) => {
  const result = await verificationService.requestRestrictedSessionCode(req.user._id, req.session._id);
  res.status(200).json(result);
});

exports.verifyRestrictedCode = asyncHandler(async (req, res) => {
  const session = await verificationService.verifyRestrictedSessionCode(
    req.user._id,
    req.session._id,
    req.body?.code,
  );
  res.status(200).json({
    message: 'High-risk verification successful. Your session has been restored.',
    session: sanitize(session),
  });
});
