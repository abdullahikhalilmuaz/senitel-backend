const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthSession', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  anomalyScore: { type: Number, required: true, min: 0, max: 1 },
  trustScore: { type: Number, required: true, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'unknown'], required: true },
  signals: { type: [mongoose.Schema.Types.Mixed], default: [] },
  action: { type: String, enum: ['continue', 'step-up', 'restrict', 'revoke'], required: true },
  modelVersion: { type: String },
  policyVersion: { type: String, default: 'v2' },
  latencyMs: { type: Number, min: 0 },
  scoreMode: { type: String, default: 'unknown' },
  baselineUsed: { type: Boolean, default: false },
  policyApplied: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
