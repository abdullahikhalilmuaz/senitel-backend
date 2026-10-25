const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema({
  type: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthSession' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String },
  status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('SecurityAlert', securityAlertSchema);
