const express = require('express');
const router = express.Router();
const Bug = require('../models/Bug');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, text, logs, zip
    const allowed = /jpeg|jpg|png|gif|pdf|txt|log|zip|docx|xlsx|csv/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error('File type not allowed'));
  }
});

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, auth denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretToken');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// @route POST /bugs/create  (supports multipart/form-data for file attachments)
router.post('/create', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, priority, projectId } = req.body;

    // Build attachment metadata
    const attachments = (req.files || []).map(f => ({
      originalName: f.originalname,
      filename: f.filename,
      mimetype: f.mimetype,
      size: f.size,
      url: `/uploads/${f.filename}`
    }));

    // Call ML Service
    let mlClassification = { isValid: true, confidence: 0.95 };
    let localizedFiles = [];
    let assignedTo = null;

    try {
      const mlRes = await fetch('http://localhost:5000/api/ml/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: title + ' ' + description })
      });
      if (mlRes.ok) mlClassification = await mlRes.json();
    } catch (e) { console.log('ML Classify error:', e.message); }

    try {
      const locRes = await fetch('http://localhost:5000/api/ml/localize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description })
      });
      if (locRes.ok) localizedFiles = (await locRes.json()).files;
    } catch (e) { console.log('ML Localize error:', e.message); }

    try {
      const assignRes = await fetch('http://localhost:5000/api/ml/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description, projectId })
      });
      if (assignRes.ok) assignedTo = (await assignRes.json()).developerId;
    } catch (e) { console.log('ML Assign error:', e.message); }

    const bug = new Bug({
      title,
      description,
      priority,
      project: projectId,
      reporter: req.user.id,
      assignedTo,
      mlClassification,
      localizedFiles,
      attachments,
      history: [{ status: 'Open', updatedBy: req.user.id, comment: 'Bug reported' }]
    });

    await bug.save();
    res.json(bug);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route GET /bugs
router.get('/', auth, async (req, res) => {
  try {
    let bugs;
    if (req.user.role === 'Admin') {
      bugs = await Bug.find().populate('reporter assignedTo project', 'name email');
    } else if (req.user.role === 'Developer') {
      bugs = await Bug.find({ assignedTo: req.user.id }).populate('reporter project', 'name email');
    } else {
      bugs = await Bug.find({ reporter: req.user.id }).populate('assignedTo project', 'name email');
    }
    res.json(bugs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route PUT /bugs/update-status/:id
router.put('/update-status/:id', auth, async (req, res) => {
  try {
    const { status, comment } = req.body;
    let bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ msg: 'Bug not found' });
    bug.status = status;
    bug.history.push({ status, updatedBy: req.user.id, comment });
    await bug.save();
    res.json(bug);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
