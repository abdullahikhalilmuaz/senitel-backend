const mongoose = require('mongoose');

const behaviourProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['collecting', 'ready', 'suspended'], default: 'collecting' },
  featureSchemaVersion: { type: Number, default: 1 },
  sampleCount: { type: Number, default: 0 },
  featureStats: { type: Object, default: {} },
  modelVersion: { type: String, default: 'iforest-v1' }
}, { timestamps: true });

module.exports = mongoose.model('BehaviourProfile', behaviourProfileSchema);
