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