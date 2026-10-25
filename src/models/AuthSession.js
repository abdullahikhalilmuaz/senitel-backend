const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'step_up_required', 'restricted', 'revoked', 'expired'], default: 'active' },
  trustScore: { type: Number, default: 100 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'unknown'], default: 'low' },
  lastActivityAt: { type: Date, default: Date.now },
  lastAssessmentAt: { type: Date, default: Date.now },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
  deviceMetadata: { type: Object, default: {} },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AuthSession', authSessionSchema);
