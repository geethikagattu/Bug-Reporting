const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
  res.send('Bug Tracking API is running...');
});

// Import Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bugs', require('./routes/bugs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/github', require('./routes/github'));
app.use('/api/developer', require('./routes/developer'));
app.use('/api/projects', require('./routes/projects'));

const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bugtracker', {
  // Configs are deprecated in Mongoose 6+ but harmless
}).then(() => {
  console.log('MongoDB Connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.log(err));
