const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const axios = require('axios');

// @route POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password, role });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secretToken', { expiresIn: '30d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email }});
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secretToken', { expiresIn: '30d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email }});
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route GET /auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
});

// @route POST /auth/logout
router.post('/logout', (req, res) => {
  // Invalidate token logic is handled client side by removing the token,
  // but we provide a success response here.
  res.json({ msg: 'Logged out successfully' });
});

// GitHub OAuth Redirect
router.get('/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo read:user user:email`;
  res.redirect(githubAuthUrl);
});

// GitHub OAuth Callback
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  try {
    // Exchange code for access token
    let tokenUrl = "https://github.com/login/oauth/access_token";
    const tokenRes = await axios.post(tokenUrl, {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { accept: 'application/json' } });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("Failed to obtain access token");

    // Fetch user details
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const githubUser = userRes.data;

    let user = await User.findOne({ githubId: githubUser.id.toString() });
    const userEmail = githubUser.email || `${githubUser.login}@github.com`;
    
    if (!user) {
      // Check if user exists by email first to link accounts
      user = await User.findOne({ email: userEmail });
      
      if (user) {
        // Link GitHub account to existing email account
        user.githubId = githubUser.id.toString();
        user.githubUsername = githubUser.login;
        user.githubAccessToken = accessToken;
        if (!user.avatar) user.avatar = githubUser.avatar_url;
      } else {
        // Create brand new user
        user = new User({
          name: githubUser.name || githubUser.login,
          email: userEmail,
          role: 'Developer',
          githubId: githubUser.id.toString(),
          githubUsername: githubUser.login,
          githubAccessToken: accessToken,
          avatar: githubUser.avatar_url
        });
      }
    } else {
      // Found by githubId, just update tokens
      user.githubAccessToken = accessToken;
      user.githubUsername = githubUser.login;
      user.avatar = githubUser.avatar_url;
    }
    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secretToken', { expiresIn: '30d' });

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/github-auth?token=${token}`);
  } catch (error) {
    console.error("GitHub Auth Error:", error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=github_auth_failed`);
  }
});

module.exports = router;
