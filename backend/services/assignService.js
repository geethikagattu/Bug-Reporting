const axios = require('axios');
const Assignment = require('../models/Assignment');
const Bug = require('../models/Bug');
const BugHistory = require('../models/BugHistory');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const assignDeveloper = async (bugId, topLocalizedFiles, fetchCommitsFunc) => {
  try {
    // We grab commits related to these files using the injected func or require it
    // Commits format expected by Python: [{hash, authorEmail, message}]
    const commits = await fetchCommitsFunc(topLocalizedFiles);
    
    const response = await axios.post(`${ML_SERVICE_URL}/api/ml/assign`, {
      top_files: topLocalizedFiles,
      commits: commits
    });
    
    const developerEmail = response.data.authorEmail;
    if (!developerEmail) {
      console.log('No developer could be automatically assigned:', response.data.reason);
      return null;
    }
    
    // Find developer by email
    const User = require('../models/User'); // lazy require
    const dev = await User.findOne({ email: developerEmail, role: 'Developer' });
    
    if (dev) {
      // Create Assignment record
      const assignment = new Assignment({
        bug: bugId,
        developer: dev._id,
        assignedBy: 'System'
      });
      await assignment.save();
      
      // Update Bug
      await Bug.findByIdAndUpdate(bugId, {
        assignedTo: dev._id,
        status: 'In Progress'
      });
      
      // Update history
      await BugHistory.create({
        bug: bugId,
        status: 'In Progress',
        updatedBy: null,
        comment: `Auto-assigned to ${dev.name} by ML System based on expertise ${response.data.score}`
      });
      
      return dev._id;
    }
    return null;
  } catch(error) {
    console.error('Error in assignDeveloper:', error.message);
    return null;
  }
};

const overrideAssignment = async (bugId, newDeveloperId, adminId) => {
  const Assignment = require('../models/Assignment');
  await Assignment.updateMany({ bug: bugId }, { assignedBy: 'Admin' }); 
  // or create a new assignment mapping
  const newAssignment = new Assignment({
    bug: bugId,
    developer: newDeveloperId,
    assignedBy: 'Admin'
  });
  await newAssignment.save();
  
  await Bug.findByIdAndUpdate(bugId, { assignedTo: newDeveloperId, status: 'In Progress' });
  await BugHistory.create({
    bug: bugId,
    status: 'In Progress',
    updatedBy: adminId,
    comment: 'Assignment overriden by Admin'
  });
};

module.exports = { assignDeveloper, overrideAssignment };
