const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema({
  action: { type: String, required: true },
  status: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
