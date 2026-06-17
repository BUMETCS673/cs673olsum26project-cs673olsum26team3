// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Relative paths mapping to routes folder inside backend/src/
const uploadRouter = require('./routes/upload');
const testGenRouter = require('./routes/testGen');
const loginRouter = require('./routes/login');
const projectsRouter = require('./routes/projects');
const testCaseManagementRouter = require('./routes/testCaseManagement');

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB Connection Configuration
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in .env file');
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Cluster'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Stop server if database is unreachable
    });

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. Rate Limiting (Prevent Brute Force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 failed attempts per window
    skipSuccessfulRequests: true, // do not count successful requests
    message: { success: false, message: 'Too many failed login attempts. Please try again after 15 minutes.' }
});

// Enable Cross-Origin Resource Sharing with restricted origin
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'SpecCheck API', version: '1.0.0' });
});

// Main gateway routing alignment
app.use('/api', loginLimiter, loginRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/generate-tests', testGenRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/test-cases', testCaseManagementRouter);

// Initialize backend core service listener
app.listen(PORT, () => {
    console.log(`Main secure gateway cluster is running on port ${PORT}`);
});
