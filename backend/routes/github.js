const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Repository = require('../models/Repository');
const githubService = require('../services/githubService');

const router = express.Router();

// GitHub OAuth Redirect
router.get('/auth', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo read:user user:email`;
  res.redirect(githubAuthUrl);
});

// GitHub OAuth Callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    // Exchange code for access token
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { accept: 'application/json' } });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("Failed to obtain access token");

    // Fetch user details from GitHub
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const githubUser = userRes.data;

    let user = await User.findOne({ githubId: githubUser.id.toString() });
    if (!user) {
      user = new User({
        name: githubUser.name || githubUser.login,
        email: githubUser.email || `${githubUser.login}@github.com`, // Email can be null publicly
        role: 'Developer',
        githubId: githubUser.id.toString(),
        githubUsername: githubUser.login,
        githubAccessToken: accessToken,
        avatar: githubUser.avatar_url
      });
    } else {
      user.githubAccessToken = accessToken;
      user.githubUsername = githubUser.login;
      user.avatar = githubUser.avatar_url;
    }
    await user.save();

    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, avatar: user.avatar },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Redirect to frontend dashboard with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/github?token=${token}`);
  } catch (error) {
    console.error("GitHub Auth Error:", error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=github_auth_failed`);
  }
});

// Authentication middleware for subsequent routes
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No API token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Fetch User's GitHub Repositories
router.get('/repos', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.githubAccessToken) {
      return res.status(400).json({ message: "GitHub not connected" });
    }

    const repos = await githubService.fetchUserRepos(user.githubAccessToken);
    
    // Merge with DB sync status
    const dbRepos = await Repository.find({ userId: user._id });
    const repoStatusMap = dbRepos.reduce((acc, r) => {
      acc[r.githubRepoId] = r.syncStatus;
      return acc;
    }, {});

    const enrichedRepos = repos.map(repo => ({
      ...repo,
      syncStatus: repoStatusMap[repo.id.toString()] || 'Unconnected'
    }));

    res.json(enrichedRepos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch repositories" });
  }
});

const repoSyncQueue = require('../workers/repoWorker');

// Select Repository to Sync (Trigger background job)
router.post('/select-repo', auth, async (req, res) => {
  try {
    const { githubRepoId, repoName, fullName, defaultBranch } = req.body;
    
    // Check if repo already syncing
    let repo = await Repository.findOne({ userId: req.user.id, githubRepoId });
    if (repo && (repo.syncStatus === 'Syncing' || repo.syncStatus === 'Ready')) {
      return res.json({ message: "Repository already synced or syncing", status: repo.syncStatus });
    }

    // Add to Queue
    const job = await repoSyncQueue.add({
      userId: req.user.id,
      githubRepoId,
      repoName,
      fullName,
      defaultBranch
    });

    res.json({ message: "Sync started", jobId: job.id, status: "Syncing" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to start sync" });
  }
});

// Get Repo Data (Polling point for frontend)
router.get('/repo-data/:repoId', auth, async (req, res) => {
  try {
    const repo = await Repository.findOne({ githubRepoId: req.params.repoId, userId: req.user.id });
    if (!repo) return res.status(404).json({ message: "Repository not found" });

    // Fetch quick stats
    const fileCount = await require('../models/FileIndex').countDocuments({ repositoryId: repo._id });
    const commitCount = await require('../models/CommitHistory').countDocuments({ repositoryId: repo._id });

    res.json({
      status: repo.syncStatus,
      lastSyncedAt: repo.lastSyncedAt,
      stats: { files: fileCount, commits: commitCount }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch repo data" });
  }
});

module.exports = router;
