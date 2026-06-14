const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse-fork');
const Tesseract = require('tesseract.js');
const path = require('path');
const { OpenAI } = require('openai');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');

// Initialize OpenAI client for Embeddings
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://models.inference.ai.azure.com"
});

/**
 * Helper: Split text into chunks with overlap.
 */
const createChunks = (text, maxLength = 1000, overlap = 200) => {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + maxLength));
        i += (maxLength - overlap);
    }
    return chunks;
};

/**
 * Configure Multer for memory storage and file validation.
 */
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) cb(null, true);
    else cb(new Error('Unsupported file format'), false);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

/**
 * POST /api/upload
 * Handles multi-file uploads, performs OCR/extraction, and generates Vector Chunks.
 */
router.post('/', (req, res, next) => {
    upload.array('documents', 10)(req, res, function (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds the 20MB limit. Please upload a smaller file.' });
        } else if (err) {
            if (err.message === 'Unsupported file format') return res.status(400).json({ error: 'Unsupported file format' });
            return res.status(500).json({ error: 'Server error during upload.' });
        }
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded.' });
        next();
    });
}, async (req, res) => {
    const { projectId } = req.body;
    console.log(`[DEBUG] Uploading and Vectorizing documents for projectId: ${projectId}`);
    
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
        return res.status(400).json({ error: 'Valid Project ID is required for document context.' });
    }

    try {
        const processedDocuments = [];
        for (const file of req.files) {
            let extractedText = '';
            const ext = path.extname(file.originalname).toLowerCase();

            // 1. Text Extraction
            if (file.mimetype === 'application/pdf' || ext === '.pdf') {
                try {
                    // Suppress font warnings from pdf-parse during extraction
                    const pdfData = await pdfParse(file.buffer); 
                    extractedText = pdfData.text;
                } catch (pdfErr) {
                    console.error(`[Error] Failed to parse PDF: ${file.originalname}`, pdfErr.message);
                }
            } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                const ocrResult = await Tesseract.recognize(file.buffer, 'eng');
                extractedText = ocrResult.data.text;
            }

            // 2. Save Original Document
            const newDoc = new Document({
                projectId: projectId.trim(),
                fileName: file.originalname,
                extractedText: extractedText.trim()
            });
            await newDoc.save();

            // 3. Chunking & Vectorization (RAG Upgrade)
            // Embedding failures are non-fatal: the document is already saved and
            // the RAG pipeline falls back to a full-text scan when no vectors exist.
            const chunks = createChunks(extractedText.trim());
            try {
                for (const chunkText of chunks) {
                    if (chunkText.trim().length < 10) continue; // Skip very small chunks

                    const embeddingResponse = await openai.embeddings.create({
                        model: "text-embedding-3-small",
                        input: chunkText
                    });

                    const newChunk = new Chunk({
                        projectId: projectId.trim(),
                        documentId: newDoc._id,
                        text: chunkText,
                        embedding: embeddingResponse.data[0].embedding
                    });
                    await newChunk.save();
                }
            } catch (embedErr) {
                console.warn(`[Warning] Vector generation skipped for ${file.originalname}: ${embedErr.message}`);
            }

            processedDocuments.push({
                id: newDoc._id,
                fileName: file.originalname,
                fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                uploadDate: newDoc.uploadDate,
                textPreview: extractedText.trim().substring(0, 200)
            });
        }
        console.log(`[Success] Processed and vectorized ${processedDocuments.length} document(s) for project ${projectId}`);
        return res.status(200).json({ message: 'Files uploaded, processed, and vectorized successfully!', data: processedDocuments });
    } catch (error) {
        console.error('[System Error] Project document processing failure:', error);
        return res.status(500).json({ error: 'Error processing document or vector generation.' });
    }
});

/**
 * GET /api/upload/:projectId
 * Retrieves all processed documents for a specific project.
 */
router.get('/:projectId', async (req, res) => {
    const { projectId } = req.params;

    try {
        const docs = await Document.find({ projectId }).sort({ uploadDate: -1 });
        const formattedDocs = docs.map(doc => ({
            id: doc._id,
            name: doc.fileName,
            uploadedAt: doc.uploadDate,
            status: 'Ready'
        }));
        res.status(200).json(formattedDocs);
    } catch (error) {
        console.error('[Error] Retrieval failure for project documents:', error);
        res.status(500).json({ message: 'Error retrieving project documents.' });
    }
});

/**
 * DELETE /api/upload/:id
 * Removes a document and its associated vector chunks from the database.
 */
router.delete('/:id', async (req, res) => {
    try {
        const documentId = req.params.id;
        
        // 1. Delete all chunks associated with this document
        await Chunk.deleteMany({ documentId });
        
        // 2. Delete the document metadata
        const deletedDoc = await Document.findByIdAndDelete(documentId);
        
        if (!deletedDoc) {
            return res.status(404).json({ message: 'Document not found.' });
        }

        res.status(200).json({ message: 'Document and associated chunks deleted successfully.' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Error deleting document and its chunks.' });
    }
});

module.exports = router;