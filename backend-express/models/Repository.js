const mongoose = require('mongoose');

const RepositorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  githubRepoId: { type: String, required: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  description: { type: String },
  url: { type: String },
  defaultBranch: { type: String, default: 'main' },
  lastSyncedAt: { type: Date },
  syncStatus: { type: String, enum: ['Pending', 'Syncing', 'Ready', 'Failed'], default: 'Pending' }
}, { timestamps: true });

// Prevent duplicate repos for same user
RepositorySchema.index({ userId: 1, githubRepoId: 1 }, { unique: true });

module.exports = mongoose.model('Repository', RepositorySchema);
