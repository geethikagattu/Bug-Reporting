const mongoose = require('mongoose');

const CommitHistorySchema = new mongoose.Schema({
  repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
  hash: { type: String, required: true },
  message: { type: String, required: true },
  authorName: { type: String },
  authorEmail: { type: String },
  authorDate: { type: Date },
  filesChanged: [{
    path: String,
    status: String, // 'added', 'modified', 'removed'
    additions: Number,
    deletions: Number
  }]
}, { timestamps: true });

// Prevent duplicate commits per repo
CommitHistorySchema.index({ repositoryId: 1, hash: 1 }, { unique: true });

module.exports = mongoose.model('CommitHistory', CommitHistorySchema);
