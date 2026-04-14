const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bug = require('../models/Bug');
const Assignment = require('../models/Assignment');
const Project = require('../models/Project');
const bcrypt = require('bcryptjs');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { overrideAssignment } = require('../services/assignService');

router.use(auth, role(['Admin']));

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const totalBugs = await Bug.countDocuments();
    const openBugs = await Bug.countDocuments({ status: 'Open' });
    const resolvedBugs = await Bug.countDocuments({ status: 'Resolved' });
    const totalUsers = await User.countDocuments();
    const activeProjects = await Project.countDocuments();

    // Naive resolution rate
    const resolutionRate = totalBugs === 0 ? 0 : Math.round((resolvedBugs / totalBugs) * 100);

    res.json({ totalBugs, openBugs, resolvedBugs, totalUsers, activeProjects, resolutionRate });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// POST /api/admin/users
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, userRole } = req.body;
    let user = new User({ name, email, password, role: userRole });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/admin/bugs
router.get('/bugs', async (req, res) => {
  try {
    const bugs = await Bug.find().populate('reporter assignedTo project', 'name email');
    res.json(bugs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/admin/assignments
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('developer', 'name')
      .populate({ path: 'bug', select: 'title status project', populate: { path: 'project', select: 'name' } });
    res.json(assignments);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PUT /api/admin/assignments/:id/override
router.put('/assignments/:id/override', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({msg: 'Assignment log not found'});
    
    await overrideAssignment(assignment.bug, req.body.newDeveloperId, req.user.id);
    
    res.json({ msg: 'Assignment overridden successfully' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    const bugs = await Bug.find().populate('project', 'name');
    res.json(bugs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/admin/projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find().populate('owner', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
