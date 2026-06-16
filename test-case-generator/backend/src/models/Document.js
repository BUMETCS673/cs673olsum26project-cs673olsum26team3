// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
const mongoose = require('mongoose');

/**
 * Document Schema
 * Stores extracted text from uploaded specification files.
 * CT-32: Retrieve product context from uploaded documents.
 */
const DocumentSchema = new mongoose.Schema({
    projectId: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    extractedText: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', DocumentSchema);