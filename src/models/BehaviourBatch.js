const mongoose = require('mongoose');

const behaviourBatchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthSession', required: true },
  observedAt: { type: Date, required: true },
  receivedAt: { type: Date, default: Date.now },
  featureSchemaVersion: { type: Number, default: 1 },
  features: { type: Object, required: true },
  source: { type: String, enum: ['live', 'simulated'], default: 'live' },
  processingStatus: { type: String, enum: ['pending', 'processed', 'rejected'], default: 'pending' }
});

module.exports = mongoose.model('BehaviourBatch', behaviourBatchSchema);
