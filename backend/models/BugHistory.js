const mongoose = require('mongoose');

const BugHistorySchema = new mongoose.Schema({
  bug: { type: mongoose.Schema.Types.ObjectId, ref: 'Bug', required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional if system-automated
  updatedAt: { type: Date, default: Date.now },
  comment: { type: String }
}, { timestamps: false }); // managed by updatedAt

// Add a standard index for bug fetch performance
BugHistorySchema.index({ bug: 1, updatedAt: -1 });

module.exports = mongoose.model('BugHistory', BugHistorySchema);
