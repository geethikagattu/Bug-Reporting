const Queue = require('bull');
const axios = require('axios');
const mongoose = require('mongoose');
const Repository = require('../models/Repository');
const CommitHistory = require('../models/CommitHistory');
const FileIndex = require('../models/FileIndex');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bugtracker', {
}).then(() => console.log('Worker MongoDB Connected'))
  .catch(err => console.log(err));

// Initialize Bull Queue
const repoSyncQueue = new Queue('repo-sync-queue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  }
});

// Process Job
repoSyncQueue.process(async (job) => {
  const { userId, githubRepoId, repoName, fullName, defaultBranch } = job.data;
  const user = await User.findById(userId);
  if (!user || !user.githubAccessToken) throw new Error("No GitHub Access Token");

  const accessToken = user.githubAccessToken;

  // Ensure Repository exists or update status
  let repo = await Repository.findOneAndUpdate(
    { userId, githubRepoId },
    { name: repoName, fullName, defaultBranch, syncStatus: 'Syncing' },
    { upsert: true, new: true }
  );

  job.progress(10); // Status update for frontend long-polling

  try {
    // 1. Fetch File Tree (Smart Sync, no code bodies)
    // Using GitHub's Git Trees API for the recursive file tree
    const treeRes = await axios.get(`https://api.github.com/repos/${fullName}/git/trees/${defaultBranch}?recursive=1`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' }
    });
    
    const tree = treeRes.data.tree;
    const fileIndexes = tree
      .filter(item => item.type === 'blob') // Only files, not folders
      .map(item => ({
        repositoryId: repo._id,
        path: item.path,
        name: item.path.split('/').pop(),
        size: item.size,
        sha: item.sha,
        extension: item.path.includes('.') ? item.path.split('.').pop() : 'none'
      }));

    job.progress(30);

    // Wipe old tree and insert new to prevent stale files
    await FileIndex.deleteMany({ repositoryId: repo._id });
    // Batch insert for performance
    if (fileIndexes.length > 0) {
      // Chunk insertions for very large repos
      const CHUNK_SIZE = 5000;
      for (let i = 0; i < fileIndexes.length; i += CHUNK_SIZE) {
        await FileIndex.insertMany(fileIndexes.slice(i, i + CHUNK_SIZE));
      }
    }

    job.progress(50);

    // 2. Fetch Commit History (Paginated)
    let commits = [];
    let page = 1;
    let hasMore = true;

    // Fetch up to 500 latest commits for ML history to prevent infinite syncs on huge monolithic repos
    while (hasMore && commits.length < 500) {
      const commitRes = await axios.get(`https://api.github.com/repos/${fullName}/commits`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
        params: { per_page: 100, page }
      });
      
      if (commitRes.data.length === 0) hasMore = false;
      else {
        commits = commits.concat(commitRes.data);
        page++;
      }
    }

    job.progress(80);

    // Save Commits
    const commitDocs = commits.map(c => ({
      repositoryId: repo._id,
      hash: c.sha,
      message: c.commit.message,
      authorName: c.commit.author?.name || c.commit.committer?.name,
      authorEmail: c.commit.author?.email || c.commit.committer?.email,
      authorDate: c.commit.author?.date || c.commit.committer?.date,
      // For detailed file-level changes per commit, we would need to fetch the individual commit endpoint
      // To prevent strict rate limits, we will skip individual file diffs during initial sync, and instead
      // rely purely on the ML using TFIDF on the commit message vs issue title.
    }));

    // Add unique commits, ignoring ones that already exist
    for (const c of commitDocs) {
      await CommitHistory.findOneAndUpdate(
        { repositoryId: repo._id, hash: c.hash },
        c,
        { upsert: true } // Creates if missing
      );
    }

    // Mark Ready
    repo.syncStatus = 'Ready';
    repo.lastSyncedAt = new Date();
    await repo.save();

    job.progress(100);
    return { success: true, filesIndexed: fileIndexes.length, commitsIndexed: commitDocs.length };

  } catch (error) {
    console.error(`Error syncing repo ${fullName}:`, error.message);
    if(error.response) console.error(error.response.data);
    repo.syncStatus = 'Failed';
    await repo.save();
    throw error;
  }
});

repoSyncQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed! Indexed ${result.filesIndexed} files and ${result.commitsIndexed} commits.`);
});

repoSyncQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`);
});

module.exports = repoSyncQueue;
