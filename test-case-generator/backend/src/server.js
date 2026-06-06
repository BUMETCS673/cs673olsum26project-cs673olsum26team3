require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Relative paths mapping to routes folder inside backend/src/
const uploadRouter = require('./routes/upload');
const testGenRouter = require('./routes/testGen');
const loginRouter = require('./routes/login');
const projectsRouter = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB Connection Configuration
// CT-66: Persist user stories and settings
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Cluster'))
    .catch(err => console.error('MongoDB connection error:', err));

// Enable Cross-Origin Resource Sharing and JSON request body processing
app.use(cors());
app.use(express.json());

// Main gateway routing alignment
app.use('/api', loginRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/generate-tests', testGenRouter);
app.use('/api/projects', projectsRouter);

// Initialize backend core service listener
app.listen(PORT, () => {
    console.log(`Main secure gateway cluster is running on port ${PORT}`);
});