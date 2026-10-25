const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthSession', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  anomalyScore: { type: Number, required: true },
  trustScore: { type: Number, required: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
  signals: { type: Array, default: [] },
  action: { type: String, enum: ['continue', 'step-up', 'restrict', 'revoke'], required: true },
  modelVersion: { type: String },
  policyVersion: { type: String, default: 'v1' },
  latencyMs: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
