const mongoose = require('mongoose');

const FileIndexSchema = new mongoose.Schema({
  repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
  path: { type: String, required: true },
  name: { type: String, required: true },
  extension: { type: String },
  size: { type: Number },
  sha: { type: String }, // GitHub's sha for the file
  lastCommitHash: { type: String }
}, { timestamps: true });

// Compound index for querying files within a repo
FileIndexSchema.index({ repositoryId: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('FileIndex', FileIndexSchema);
