// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
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
        },
        edgeCase: {
            type: Boolean,
            default: false
        }
    },
    testCases: {
        type: Array,
        default: []
    },
    impactedFeatures: {
        type: [Object], // Stores { name: string, relatedTestIds: [string] }
        default: []
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserStory', UserStorySchema);