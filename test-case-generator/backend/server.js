const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse-fork');
const Tesseract = require('tesseract.js'); // Added for Scenario 2 (OCR)
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Register authentication routes
require('./api/login')(app);

// Set up memory storage for file upload
const storage = multer.memoryStorage();

// Scenario 3: Backend File Filter to reject unsupported formats (.exe, .mp3, etc.)
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
        cb(null, true); // Accept file
    } else {
        cb(new Error('Unsupported file format'), false); // Reject file
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // Scenario 4: Strict 20MB maximum size limit per file
});

// Route to handle system document uploads
app.post('/api/upload', (req, res, next) => {
    // Process upload with a maximum limit of 10 files per request
    upload.array('documents', 10)(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Scenario 4: Check if file is too large
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File size exceeds the 20MB limit. Please upload a smaller file.' });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            // Scenario 3: Catch Unsupported File Format error from fileFilter
            if (err.message === 'Unsupported file format') {
                return res.status(400).json({ error: 'Unsupported file format' });
            }
            return res.status(500).json({ error: 'Server error during upload.' });
        }

        // Check if user selected any files
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }
        
        next();
    });
}, async (req, res) => {
    try {
        const processedDocuments = [];

        // Read text from each uploaded file
        for (const file of req.files) {
            let extractedText = '';
            const ext = path.extname(file.originalname).toLowerCase();

            // Scenario 1: Read raw text if file is a PDF
            if (file.mimetype === 'application/pdf' || ext === '.pdf') {
                const pdfData = await pdfParse(file.buffer); 
                extractedText = pdfData.text;
            } 
            // Scenario 2: Extract text from image files using OCR
            else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                // Perform OCR on image buffer
                const ocrResult = await Tesseract.recognize(file.buffer, 'eng');
                extractedText = ocrResult.data.text;
            }

            // Create document information object
            const megaBytes = file.size / 1024 / 1024;
            const cleanSize = megaBytes.toFixed(2) + ' MB';
            const cleanDate = new Date().toISOString().split('T')[0];

            processedDocuments.push({
                fileName: file.originalname,
                fileSize: cleanSize,
                uploadDate: cleanDate,
                textPreview: extractedText.trim().substring(0, 200)
            });
        }

        // Return results to frontend before saving to database later
        return res.status(200).json({
            message: 'Files uploaded and processed successfully!',
            data: processedDocuments
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error processing document text.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



