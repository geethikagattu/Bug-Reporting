const express = require('express');
const router = express.Router();
const Bug = require('../models/Bug');
const BugHistory = require('../models/BugHistory');
const Classification = require('../models/Classification');
const Localization = require('../models/Localization');
const Assignment = require('../models/Assignment');
const CommitHistory = require('../models/CommitHistory');
const FileIndex = require('../models/FileIndex');
const Project = require('../models/Project');

const auth = require('../middleware/auth');
const role = require('../middleware/role');
const classifyService = require('../services/classifyService');
const assignService = require('../services/assignService');

// @route POST /api/bugs
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, projectId } = req.body;
    
    const bug = new Bug({
      title,
      description,
      priority,
      project: projectId,
      reporter: req.user.id,
      status: 'Open'
    });
    await bug.save();

    await BugHistory.create({
      bug: bug._id,
      status: 'Open',
      updatedBy: req.user.id,
      comment: 'Bug submitted by tester'
    });

    res.status(201).json(bug);

    // Asynchronous Pipeline
    processBugPipeline(bug, description, projectId);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

async function processBugPipeline(bug, description, projectId) {
  try {
    // 1. Classify
    const { isValid, confidence, classificationId } = await classifyService.classifyBug(bug._id, bug.title, description);
    
    // Update inline for quick access
    await Bug.findByIdAndUpdate(bug._id, { mlClassification: { isValid, confidence } });

    if (!isValid) {
      await Bug.findByIdAndUpdate(bug._id, { status: 'Closed' });
      await BugHistory.create({ bug: bug._id, status: 'Closed', comment: 'Auto-closed by ML: Invalid Bug' });
      return; // Stop pipeline
    }

    // 2. Localize
    // Fetch files from Project's repo to send to python (Simulating file fetch)
    const project = await Project.findById(projectId).populate('owner');
    let projectFiles = [];
    if (project) {
        // Find repo by owner
        const Repository = require('../models/Repository');
        const repo = await Repository.findOne({ userId: project.owner });
        if (repo) {
          const files = await FileIndex.find({ repositoryId: repo._id }).limit(100);
          projectFiles = files.map(f => ({ path: f.path, name: f.path.split('/').pop() }));
        }
    }
    
    // Fallback Mock files if testing
    if (projectFiles.length === 0) {
      projectFiles = [
        { path: 'src/main.js', name: 'main.js' },
        { path: 'src/auth/login.js', name: 'login.js' }
      ];
    }

    const localizedFiles = await classifyService.localizeBug(bug._id, description, projectFiles);
    await Bug.findByIdAndUpdate(bug._id, { localizedFiles });

    // 3. Assign
    if (localizedFiles.length > 0) {
      const devId = await assignService.assignDeveloper(bug._id, localizedFiles, async (files) => {
        // Fetch commits touching these files
        // A minimal simulation
        return [
          { hash: '123', authorEmail: 'dev@test.com', message: 'fixed src/main.js' }
        ];
      });
    }

  } catch (e) {
    console.error("Pipeline error:", e);
  }
}

// @route GET /api/bugs
router.get('/', auth, role(['Admin']), async (req, res) => {
  try {
    const { status, priority, projectId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (projectId) filter.project = projectId;

    const bugs = await Bug.find(filter).populate('reporter assignedTo project', 'name email');
    res.json(bugs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route GET /api/bugs/my
router.get('/my', auth, role(['Tester']), async (req, res) => {
  try {
    const bugs = await Bug.find({ reporter: req.user.id }).populate('assignedTo project', 'name');
    res.json(bugs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route GET /api/bugs/assigned
router.get('/assigned', auth, role(['Developer']), async (req, res) => {
  try {
    const bugs = await Bug.find({ assignedTo: req.user.id }).populate('reporter project', 'name');
    res.json(bugs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route GET /api/bugs/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('reporter assignedTo project', 'name email');
    
    if (!bug) return res.status(404).json({ msg: 'Bug not found' });

    const classification = await Classification.findOne({ bug: bug._id });
    const localization = await Localization.find({ bug: bug._id }).sort('rank');
    const history = await BugHistory.find({ bug: bug._id }).sort('updatedAt').populate('updatedBy', 'name');
    const assignment = await Assignment.findOne({ bug: bug._id }).populate('developer', 'name');

    res.json({
      ...bug._doc,
      classificationResult: classification,
      localizationFiles: localization,
      historyLog: history,
      assignmentInfo: assignment
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route PUT /api/bugs/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ msg: 'Bug not found' });
    
    if (req.user.role !== 'Admin' && bug.reporter.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { title, description, priority } = req.body;
    if (title) bug.title = title;
    if (description) bug.description = description;
    if (priority) bug.priority = priority;

    await bug.save();
    res.json(bug);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route PUT /api/bugs/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ msg: 'Bug not found' });
    
    // Both assigned developer and admin can update status
    if (req.user.role !== 'Admin' && bug.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this bug status' });
    }

    bug.status = req.body.status;
    await bug.save();
    
    await BugHistory.create({
      bug: bug._id,
      status: req.body.status,
      updatedBy: req.user.id,
      comment: 'Status updated manually'
    });

    res.json(bug);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route DELETE /api/bugs/:id
router.delete('/:id', auth, role(['Admin']), async (req, res) => {
  try {
    const bug = await Bug.findByIdAndDelete(req.params.id);
    if (!bug) return res.status(404).json({ msg: 'Bug not found' });
    res.json({ msg: 'Bug deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
