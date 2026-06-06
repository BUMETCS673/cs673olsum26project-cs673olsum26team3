const mongoose = require('mongoose');

/**
 * Chunk Schema
 * Stores small segments of text and their corresponding vector embeddings.
 * Used for RAG (Retrieval-Augmented Generation) with MongoDB Atlas Vector Search.
 */
const ChunkSchema = new mongoose.Schema({
    projectId: {
        type: String,
        required: true,
        index: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    }
});

module.exports = mongoose.model('Chunk', ChunkSchema);