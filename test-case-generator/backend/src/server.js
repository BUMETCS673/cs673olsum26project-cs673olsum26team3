require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const uploadRouter = require('./routes/upload');
const testGenRouter = require('./routes/testGen');
const loginRouter = require('./routes/login');
const projectsRouter = require('./routes/projects');
const testCaseManagementRouter = require('./routes/testCaseManagement');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', loginRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/generate-tests', testGenRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/test-cases', testCaseManagementRouter);

// MongoDB
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Cluster');

    // ONLY start server AFTER DB is connected
    app.listen(PORT, () => {
      console.log(`Main secure gateway cluster is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });