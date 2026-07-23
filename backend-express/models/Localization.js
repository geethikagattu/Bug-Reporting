const mongoose = require('mongoose');

const LocalizationSchema = new mongoose.Schema({
  bug: { type: mongoose.Schema.Types.ObjectId, ref: 'Bug', required: true },
  fileName: { type: String, required: true },
  relevanceScore: { type: Number, required: true },
  rank: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Localization', LocalizationSchema);
