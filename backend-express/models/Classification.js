const mongoose = require('mongoose');

const ClassificationSchema = new mongoose.Schema({
  bug: { type: mongoose.Schema.Types.ObjectId, ref: 'Bug', required: true },
  result: { type: String, enum: ['Valid Bug', 'Invalid Bug'], required: true },
  confidenceScore: { type: Number, required: true },
  modelUsed: { type: String, default: 'SVM' } // e.g. SVM or CodeBERT
}, { timestamps: true });

module.exports = mongoose.model('Classification', ClassificationSchema);
