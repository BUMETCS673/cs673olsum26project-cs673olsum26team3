const mongoose = require('mongoose');

/**
 * UserStory Schema
 * Stores the user requirement and selected test generation options.
 * CT-66: Persistence for user input and settings.
 */
const UserStorySchema = new mongoose.Schema({
    projectId: {
        type: String,
        required: true
    },
    requirement: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        positive: {
            type: Boolean,
            default: false
        },
        negative: {
            type: Boolean,
            default: false
        }
    },
    testCases: {
        type: Array,
        default: []
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserStory', UserStorySchema);