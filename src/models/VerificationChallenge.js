const mongoose = require('mongoose');

const verificationChallengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthSession', required: true, index: true },
  codeHash: { type: String, required: true, select: false },
  salt: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
}, { timestamps: true });

// MongoDB removes expired challenge records asynchronously. Service checks also
// enforce expiry, so correctness does not depend on the TTL cleanup timing.
verificationChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
verificationChallengeSchema.index({ sessionId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model('VerificationChallenge', verificationChallengeSchema);
