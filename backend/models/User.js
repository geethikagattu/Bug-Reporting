const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional if using GitHub OAuth
  role: { type: String, enum: ['Admin', 'Developer', 'Tester'], default: 'Tester' },
  githubId: { type: String },
  githubUsername: { type: String },
  githubAccessToken: { type: String },
  avatar: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
