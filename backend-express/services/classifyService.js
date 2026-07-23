const axios = require('axios');
const Classification = require('../models/Classification');
const Localization = require('../models/Localization');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const classifyBug = async (bugId, title, description) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/api/ml/classify`, {
      text: title + ' ' + description
    });
    
    const { isValid, class: resultClass, confidence } = response.data;
    const classification = new Classification({
      bug: bugId,
      result: resultClass || (isValid ? 'Valid Bug' : 'Invalid Bug'), // Fallback
      confidenceScore: confidence,
      modelUsed: 'SVM'
    });
    
    await classification.save();
    return { isValid, confidence, classificationId: classification._id };
  } catch (error) {
    console.error('Error in classifyBug:', error.message);
    throw error;
  }
};

const localizeBug = async (bugId, description, top_files = []) => {
  try {
    // If you need repoId later, you can pass it to fetch files
    // The current Python app expects an array of file objects
    const response = await axios.post(`${ML_SERVICE_URL}/api/ml/localize`, {
      text: description,
      files: top_files // format: [{path: 'src/...', name: '...'}]
    });
    
    const { files, scores } = response.data;
    const localizedRecords = [];
    
    for (let i = 0; i < files.length; i++) {
      const loc = new Localization({
        bug: bugId,
        fileName: files[i],
        relevanceScore: scores[i],
        rank: i + 1
      });
      await loc.save();
      localizedRecords.push(loc);
    }
    
    return files;
  } catch (error) {
    console.error('Error in localizeBug:', error.message);
    return [];
  }
};

module.exports = {
  classifyBug,
  localizeBug
};
