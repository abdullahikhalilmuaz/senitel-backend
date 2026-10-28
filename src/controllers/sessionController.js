const mongoose = require('mongoose');
const AuthSession = require('../models/AuthSession');
const asyncHandler = require('../utils/asyncHandler');
const sanitize = require('../utils/sanitize');
const env = require('../config/env');

function cookieOptions() {
  const production = env.NODE_ENV === 'production';
  return { httpOnly: true, secure: production, sameSite: production ? 'none' : 'lax', path: '/' };
}

exports.listSessions = asyncHandler(async (req, res) => {
  const sessions = await AuthSession.find({ userId: req.user._id })
    .select('-tokenHash')
    .sort({ createdAt: -1 })
    .limit(100);
  res.status(200).json(sanitize(sessions));
});

exports.getSession = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Session not found' });
  const session = await AuthSession.findOne({ _id: req.params.id, userId: req.user._id }).select('-tokenHash');
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.status(200).json(sanitize(session));
});

exports.revokeSession = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Session not found' });
  const session = await AuthSession.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, status: { $nin: ['revoked', 'expired'] } },
    { $set: { status: 'revoked' } },
    { new: true, runValidators: true },
  ).select('-tokenHash');
  if (!session) return res.status(404).json({ message: 'Session not found or already inactive' });

  const currentSession = String(req.session._id) === String(session._id);
  if (currentSession) res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions());
  res.status(200).json({ message: 'Session revoked', currentSession, session: sanitize(session) });
});
