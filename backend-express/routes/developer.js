const express = require('express');
const router = express.Router();
const Bug = require('../models/Bug');
const BugHistory = require('../models/BugHistory');
const Classification = require('../models/Classification');
const Localization = require('../models/Localization');
const Assignment = require('../models/Assignment');

const auth = require('../middleware/auth');
const role = require('../middleware/role');

// All developer routes expect the user to be a Developer
router.use(auth, role(['Developer']));

// GET /api/developer/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const assignedBugs = await Bug.find({ assignedTo: req.user.id });
    
    // Naively assume "this week" simply falls in total since we aren't heavily using dates here.
    const totalAssigned = assignedBugs.length;
    const inProgress = assignedBugs.filter(b => b.status === 'In Progress').length;
    const resolved = assignedBugs.filter(b => b.status === 'Resolved').length;

    res.json({
      totalAssigned,
      inProgress,
      resolved
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/developer/bugs
router.get('/bugs', async (req, res) => {
  try {
    const bugs = await Bug.find({ assignedTo: req.user.id }).populate('project', 'name');
    res.json(bugs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/developer/bugs/:id
router.get('/bugs/:id', async (req, res) => {
  try {
    const bug = await Bug.findOne({ _id: req.params.id, assignedTo: req.user.id })
      .populate('reporter project', 'name email');
    if (!bug) return res.status(404).json({ msg: 'Bug not found or not assigned to you' });

    const classification = await Classification.findOne({ bug: bug._id });
    const localization = await Localization.find({ bug: bug._id }).sort('rank');
    const history = await BugHistory.find({ bug: bug._id }).sort('updatedAt');

    res.json({
      ...bug._doc,
      classificationResult: classification,
      localizationFiles: localization,
      historyLog: history
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PUT /api/developer/bugs/:id/status
router.put('/bugs/:id/status', async (req, res) => {
  try {
    const bug = await Bug.findOne({ _id: req.params.id, assignedTo: req.user.id });
    if (!bug) return res.status(404).json({ msg: 'Bug not found or not assigned to you' });

    bug.status = req.body.status;
    await bug.save();

    await BugHistory.create({
      bug: bug._id,
      status: req.body.status,
      updatedBy: req.user.id,
      comment: 'Developer updated status'
    });

    res.json(bug);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/developer/history
router.get('/history', async (req, res) => {
  try {
    // Bugs that the developer has resolved
    const bugs = await Bug.find({ assignedTo: req.user.id, status: 'Resolved' }).populate('project', 'name');
    res.json(bugs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
