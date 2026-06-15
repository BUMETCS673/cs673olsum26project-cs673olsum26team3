const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse-fork');
const Tesseract = require('tesseract.js');
const path = require('path');
const { OpenAI } = require('openai');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const authMiddleware = require('../middleware/auth');

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
 * Protected by authMiddleware.
 */
router.post('/', authMiddleware, (req, res, next) => {
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
    console.log(`[DEBUG] Uploading and Vectorizing documents for projectId: ${projectId} by user: ${req.user.username}`);
    
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
        return res.status(400).json({ error: 'Valid Project ID is required for document context.' });
    }

    try {
        const processedDocuments = [];
        for (const file of req.files) {
            console.log(`[DEBUG] Processing file: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
            let extractedText = '';
            const ext = path.extname(file.originalname).toLowerCase();

            // 1. Text Extraction
            if (file.mimetype === 'application/pdf' || ext === '.pdf') {
                try {
                    // Suppress font warnings from pdf-parse during extraction
                    // These "Warning: TT: undefined function: 21" are harmless font issues in pdf.js
                    const originalWarn = console.warn;
                    console.warn = function() {
                        if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].includes('TT: undefined function')) return;
                        originalWarn.apply(console, arguments);
                    };
                    
                    const pdfData = await pdfParse(file.buffer); 
                    extractedText = pdfData.text;
                    
                    console.warn = originalWarn; // Restore original console.warn
                    console.log(`[DEBUG] PDF extraction successful for: ${file.originalname}`);
                } catch (pdfErr) {
                    console.error(`[Error] Failed to parse PDF: ${file.originalname}`, pdfErr.message);
                }
            } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                console.log(`[DEBUG] Starting OCR for: ${file.originalname}`);
                const ocrResult = await Tesseract.recognize(file.buffer, 'eng');
                extractedText = ocrResult.data.text;
                console.log(`[DEBUG] OCR successful for: ${file.originalname}`);
            }

            // 2. Save Original Document metadata immediately
            const newDoc = new Document({
                projectId: projectId.trim(),
                fileName: file.originalname,
                extractedText: extractedText.trim(),
                status: 'Processing' // Initial status
            });
            await newDoc.save();
            console.log(`[DEBUG] Document metadata saved: ${file.originalname}. Returning early, vectorizing in background...`);

            // 3. Start Background Vectorization (Do NOT await)
            (async () => {
                const startTime = Date.now();
                let finished = false;

                // Watchdog: Force completion after 45s regardless of progress
                const watchdog = setTimeout(async () => {
                    if (!finished) {
                        console.log(`[Watchdog] Forcing completion for ${file.originalname} due to hang.`);
                        await Document.findByIdAndUpdate(newDoc._id, { status: 'Completed', progress: 100 }).catch(() => {});
                        finished = true;
                    }
                }, 25000);

                try {
                    console.log(`[Background] Starting vectorization for ${file.originalname}`);
                    await Document.findByIdAndUpdate(newDoc._id, { progress: 5, status: 'Processing' });
                    
                    const chunks = createChunks(extractedText.trim()).filter(c => c.trim().length >= 10);
                    const totalChunks = chunks.length;
                    
                    if (totalChunks > 0) {
                        const BATCH_SIZE = 25;
                        console.log(`[Background] [${file.originalname}] Total chunks to process: ${totalChunks}`);
                        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                            if (finished) break; // Stop if watchdog already finished it
                            
                            const docCheck = await Document.findById(newDoc._id);
                            if (!docCheck) {
                                clearTimeout(watchdog);
                                return;
                            }

                            const batch = chunks.slice(i, i + BATCH_SIZE);
                            try {
                                console.log(`[Background] [${file.originalname}] Calling OpenAI for batch...`);
                                
                                // Hard Promise.race timeout for the API call
                                const embeddingResponse = await Promise.race([
                                    openai.embeddings.create({ model: "text-embedding-3-small", input: batch }),
                                    new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI_Timeout')), 15000))
                                ]);
                                
                                const chunkDocuments = batch.map((text, index) => ({
                                    projectId: projectId.trim(),
                                    documentId: newDoc._id,
                                    text: text,
                                    embedding: embeddingResponse.data[index].embedding
                                }));
                                
                                await Chunk.insertMany(chunkDocuments);
                                
                                const progressPercent = Math.min(Math.round(((i + batch.length) / totalChunks) * 90) + 5, 95);
                                await Document.findByIdAndUpdate(newDoc._id, { progress: progressPercent });
                                console.log(`[Background] [${file.originalname}] Progress updated: ${progressPercent}%`);
                            } catch (embErr) {
                                console.error(`[Background Error] [${file.originalname}] Batch failed: ${embErr.message}`);
                                // If first batch fails with timeout, we might want to just skip to finally
                                if (embErr.message === 'OpenAI_Timeout') break;
                            }
                        }
                    }
                } catch (taskErr) {
                    console.error(`[Background Fatal] ${file.originalname}:`, taskErr);
                } finally {
                    clearTimeout(watchdog);
                    if (!finished) {
                        try {
                            await Document.findByIdAndUpdate(newDoc._id, { status: 'Completed', progress: 100 });
                            console.log(`[Background] Successfully finalized ${file.originalname}`);
                        } catch (fErr) {}
                        finished = true;
                    }
                }
            })().catch(err => console.error('[Critical] Background task crashed:', err));

            processedDocuments.push({
                id: newDoc._id,
                name: file.originalname,
                uploadedAt: newDoc.uploadDate,
                status: 'Processing',
                progress: 0
            });
        }
        return res.status(200).json({ message: 'Upload successful! Processing in background.', data: processedDocuments });
    } catch (error) {
        console.error('[System Error] Project document processing failure:', error);
        return res.status(500).json({ error: 'Error processing document or vector generation.' });
    }
});

/**
 * GET /api/upload/:projectId
 * Retrieves all processed documents for a specific project.
 * Protected by authMiddleware.
 */
router.get('/:projectId', authMiddleware, async (req, res) => {
    const projectId = req.params.projectId.trim();
    console.log(`[DEBUG] Fetching documents for projectId: ${projectId}`);

    try {
        const docs = await Document.find({ projectId }).sort({ uploadDate: -1 });
        console.log(`[DEBUG] Found ${docs.length} documents for project ${projectId}`);
        
        const formattedDocs = docs.map(doc => ({
            id: doc._id,
            name: doc.fileName,
            uploadedAt: doc.uploadDate,
            status: doc.status || 'Completed',
            progress: doc.progress || 0
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
 * Protected by authMiddleware.
 */
router.delete('/:id', authMiddleware, async (req, res) => {
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