const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  bug: { type: mongoose.Schema.Types.ObjectId, ref: 'Bug', required: true },
  developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: String, enum: ['System', 'Admin'], default: 'System' },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
