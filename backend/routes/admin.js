const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bug = require('../models/Bug');
const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, auth denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretToken');
    if (decoded.user.role !== 'Admin') return res.status(403).json({ msg: 'Not authorized' });
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.get('/reports', adminAuth, async (req, res) => {
  try {
    const totalBugs = await Bug.countDocuments();
    const openBugs = await Bug.countDocuments({ status: 'Open' });
    const resolvedBugs = await Bug.countDocuments({ status: 'Resolved' });
    res.json({ totalBugs, openBugs, resolvedBugs });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
