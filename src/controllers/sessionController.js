const AuthSession = require('../models/AuthSession');
const asyncHandler = require('../utils/asyncHandler');

exports.listSessions = asyncHandler(async (req, res) => {
  const sessions = await AuthSession.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(sessions);
});

exports.getSession = asyncHandler(async (req, res) => {
  const session = await AuthSession.findOne({ _id: req.params.id, userId: req.user._id });
  if (!session) return res.status(404).json({ message: 'Not found' });
  res.status(200).json(session);
});

exports.revokeSession = asyncHandler(async (req, res) => {
  const session = await AuthSession.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { status: 'revoked' },
    { new: true }
  );
  res.status(200).json(session);
});
