const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET /api/projects (list all)
router.get('/', auth, async (req, res) => {
  try {
    // Return all for simplicity or only where user is member (requires schema update for member array)
    const projects = await Project.find().populate('owner', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// POST /api/projects (Admin)
router.post('/', auth, role(['Admin']), async (req, res) => {
  try {
    const { name, description, repositoryUrl } = req.body;
    const project = new Project({
      name,
      description,
      repositoryUrl,
      owner: req.user.id
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email');
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, role(['Admin']), async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(project);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, role(['Admin']), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// POST /api/projects/:id/members (Mocked API since Schema doesn't strictly hold multiple members out of scope)
router.post('/:id/members', auth, role(['Admin']), async (req, res) => {
  res.json({ msg: 'Member added (mock)' });
});
router.delete('/:id/members/:userId', auth, role(['Admin']), async (req, res) => {
  res.json({ msg: 'Member removed (mock)' });
});

module.exports = router;
