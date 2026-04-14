const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Project = require('./models/Project');
const Bug = require('./models/Bug');
const BugHistory = require('./models/BugHistory');
const Classification = require('./models/Classification');
const Localization = require('./models/Localization');
const Assignment = require('./models/Assignment');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bugtracker');
        console.log('MongoDB Connected for Seeding...');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const seedDatabase = async () => {
    await connectDB();

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Bug.deleteMany({});
    await BugHistory.deleteMany({});
    await Classification.deleteMany({});
    await Localization.deleteMany({});
    await Assignment.deleteMany({});

    console.log('Creating Users...');
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const admin = await User.create({
        name: 'Admin Boss',
        email: 'admin@bugflow.com',
        password,
        role: 'Admin'
    });

    const developer = await User.create({
        name: 'Senior Dev',
        email: 'dev@bugflow.com',
        password,
        role: 'Developer'
    });

    const tester = await User.create({
        name: 'QA Ninja',
        email: 'tester@bugflow.com',
        password,
        role: 'Tester'
    });

    console.log('Creating Project...');
    const project = await Project.create({
        name: 'BugFlow Analytics Engine',
        description: 'Core ML engine for BugFlow processing and aggregation',
        repositoryUrl: 'https://github.com/bugflow/analytics-engine',
        owner: admin._id
    });

    console.log('Creating Bugs...');
    
    // Bug 1: Valid Bug, Open state
    const bug1 = await Bug.create({
        title: 'Login button throws 500 error on timeout',
        description: 'When waiting for 30 seconds on the login page, submitting the form crashes the backend with a 500 server error instead of returning 401.',
        priority: 'High',
        status: 'Open',
        project: project._id,
        reporter: tester._id,
        assignedTo: developer._id,
        mlClassification: { isValid: true, confidence: 0.94 },
        localizedFiles: ['src/auth/login.js', 'src/middleware/timeout.js']
    });

    await Classification.create({ bug: bug1._id, result: 'Valid Bug', confidenceScore: 0.94 });
    await Localization.create({ bug: bug1._id, fileName: 'src/auth/login.js', relevanceScore: 0.88, rank: 1 });
    await Localization.create({ bug: bug1._id, fileName: 'src/middleware/timeout.js', relevanceScore: 0.65, rank: 2 });
    await Assignment.create({ bug: bug1._id, developer: developer._id, assignedBy: 'System' });
    await BugHistory.create({ bug: bug1._id, status: 'Open', updatedBy: tester._id, comment: 'Bug submitted by QA Ninja' });
    await BugHistory.create({ bug: bug1._id, status: 'Open', updatedBy: admin._id, comment: 'Auto-assigned by ML to Senior Dev' });

    // Bug 2: Invalid Bug, Closed state
    const bug2 = await Bug.create({
        title: 'Please add a dark mode toggle',
        description: 'It would be really cool if we had a dark mode toggle in the navbar. My eyes hurt.',
        priority: 'Low',
        status: 'Closed',
        project: project._id,
        reporter: tester._id,
        mlClassification: { isValid: false, confidence: 0.98 },
        localizedFiles: []
    });

    await Classification.create({ bug: bug2._id, result: 'Invalid Bug', confidenceScore: 0.98 });
    await BugHistory.create({ bug: bug2._id, status: 'Closed', updatedBy: admin._id, comment: 'Auto-closed by ML: Invalid Bug (Feature Request)' });

    // Bug 3: In Progress Bug
    const bug3 = await Bug.create({
        title: 'Memory leak in localization worker',
        description: 'The localizeBug service is not releasing memory after scanning >1000 files, leading to an eventual OOM Kill on the python service.',
        priority: 'Critical',
        status: 'In Progress',
        project: project._id,
        reporter: tester._id,
        assignedTo: developer._id,
        mlClassification: { isValid: true, confidence: 0.91 },
        localizedFiles: ['ml-service/app.py']
    });

    await Classification.create({ bug: bug3._id, result: 'Valid Bug', confidenceScore: 0.91 });
    await Localization.create({ bug: bug3._id, fileName: 'ml-service/app.py', relevanceScore: 0.95, rank: 1 });
    await Assignment.create({ bug: bug3._id, developer: developer._id, assignedBy: 'System' });
    await BugHistory.create({ bug: bug3._id, status: 'Open', updatedBy: tester._id, comment: 'Reported OOM crash' });
    await BugHistory.create({ bug: bug3._id, status: 'In Progress', updatedBy: developer._id, comment: 'Investigating memory profiler logs' });

    // Bug 4: Resolved Bug
    const bug4 = await Bug.create({
        title: 'Missing translation keys in footer',
        description: 'Footer terms of service link is showing as translation_string.footer.terms in German locale.',
        priority: 'Medium',
        status: 'Resolved',
        project: project._id,
        reporter: tester._id,
        assignedTo: developer._id,
        mlClassification: { isValid: true, confidence: 0.84 },
        localizedFiles: ['frontend/src/components/Footer.jsx', 'frontend/locales/de.json']
    });

    await Classification.create({ bug: bug4._id, result: 'Valid Bug', confidenceScore: 0.84 });
    await Localization.create({ bug: bug4._id, fileName: 'frontend/locales/de.json', relevanceScore: 0.77, rank: 1 });
    await Assignment.create({ bug: bug4._id, developer: developer._id, assignedBy: 'System' });
    await BugHistory.create({ bug: bug4._id, status: 'Resolved', updatedBy: developer._id, comment: 'Pushed fix to main branch, translation keys added.' });

    console.log('\n✅ Database Successfully Seeded!');
    console.log('----------------------------------------------------');
    console.log('You can now log in to the UI using the following credentials:');
    console.log('Admin Account     -> Email: admin@bugflow.com  | Password: password123');
    console.log('Developer Account -> Email: dev@bugflow.com    | Password: password123');
    console.log('Tester Account    -> Email: tester@bugflow.com | Password: password123');
    console.log('----------------------------------------------------');

    process.exit(0);
};

seedDatabase();
