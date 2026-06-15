const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const UserStory = require('../models/UserStory');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const authMiddleware = require('../middleware/auth');

// Initialize OpenAI client using GitHub Models API endpoint
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://models.inference.ai.azure.com"
});

/**
 * CT-31/CT-33: Endpoint to generate real AI test cases using GitHub Models (GPT-4o).
 * Implements RAG (Retrieval-Augmented Generation) using Atlas Vector Search.
 * Protected by authMiddleware.
 */
router.post('/', authMiddleware, async (req, res) => {
    const { requirement, options, projectId } = req.body;
    const genStart = Date.now();

    console.log(`[TestGen] Starting generation for project: ${projectId}`);

    // CT-30: Validate that User Story content is not empty
    if (!requirement || requirement.trim() === '') {
        return res.status(400).json({ message: 'User Story requirement cannot be empty.' });
    }

    try {
        let groundedContext = '';
        let contextAvailable = false;
        let retrievalMethod = 'Vector Search';

        // 1. Attempt Vector Search (RAG)
        try {
            console.log('[TestGen] Step 1: Generating embedding for requirement...');
            const embeddingResponse = await Promise.race([
                openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: requirement
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI_Embedding_Timeout')), 15000))
            ]);
            
            const queryVector = embeddingResponse.data[0].embedding;
            console.log('[TestGen] Step 2: Executing Atlas Vector Search...');

            const relevantChunks = await Promise.race([
                Chunk.aggregate([
                    {
                        "$vectorSearch": {
                            "index": "vector_index",
                            "path": "embedding",
                            "queryVector": queryVector,
                            "numCandidates": 50,
                            "limit": 8,
                            "filter": { "projectId": projectId }
                        }
                    }
                ]),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Atlas_VectorSearch_Timeout')), 20000))
            ]);

            if (relevantChunks.length > 0) {
                groundedContext = relevantChunks.map(c => c.text).join('\n\n---\n\n');
                contextAvailable = true;
                console.log(`[TestGen] Vector search found ${relevantChunks.length} chunks.`);
            } else {
                console.log('[TestGen] Vector search returned 0 results.');
            }
        } catch (vectorError) {
            console.warn('[TestGen] [Vector Search Error]:', vectorError.message);
            retrievalMethod = 'Full Document Scan';
        }

        // 2. Fallback to full document text if Vector Search yielded nothing or failed
        if (!contextAvailable) {
            console.log('[TestGen] Step 2 (Fallback): Scanning all project documents...');
            const projectDocs = await Document.find({ projectId }).limit(5); // Limit to avoid massive prompts
            if (projectDocs.length > 0) {
                groundedContext = projectDocs.map(doc => doc.extractedText).join('\n\n');
                contextAvailable = true;
                console.log(`[TestGen] Found ${projectDocs.length} documents for context.`);
            }
        }

        // Construct the AI Prompt
        let typesToGenerate = [];
        if (options.positive) typesToGenerate.push('Functional/Positive Test Cases');
        if (options.negative) typesToGenerate.push('Negative Test Cases');
        if (options.edgeCase) typesToGenerate.push('Edge Cases');

        const prompt = `
            User Story: "${requirement}"
            Context: ${contextAvailable ? groundedContext : 'None'}
            Generate JSON test cases for: ${typesToGenerate.join(', ')}.
            Format: { "testCases": [ { "id": "AI-001", "title": "...", "preconditions": "...", "steps": [...], "expectedResults": "...", "type": "...", "priority": "..." } ] }
        `;

        console.log('[TestGen] Step 3: Calling OpenAI GPT-4o...');
        // CT-33: Call AI API with hard timeout
        const aiResponse = await Promise.race([
            openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'Expert QA Engineer. Output valid JSON only.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: "json_object" }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI_Completion_Timeout')), 45000))
        ]);

        console.log('[TestGen] Step 4: Processing AI response...');
        let rawContent = aiResponse.choices[0].message.content.trim();
        const content = JSON.parse(rawContent);
        let aiTestCases = content.testCases || [];

        // ID Generation Logic (Keep it efficient)
        const existingCount = await UserStory.countDocuments({ projectId });
        const baseId = existingCount * 10; // Simple offset for uniqueness

        if (Array.isArray(aiTestCases)) {
            aiTestCases = aiTestCases.map((tc, index) => ({
                ...tc,
                id: `AI-${String(baseId + index + 1).padStart(3, '0')}`
            }));
        }

        // Save Results
        const newUserStory = new UserStory({
            projectId,
            requirement,
            options,
            testCases: aiTestCases
        });
        await newUserStory.save();

        console.log(`[TestGen] Completed successfully in ${Date.now() - genStart}ms`);

        return res.status(200).json({
            message: contextAvailable ? 'Success' : 'Warning: No context found.',
            data: { testCases: aiTestCases }
        });

    } catch (error) {
        console.error('[TestGen] [Fatal Error]:', error);
        return res.status(500).json({ 
            message: `Generation failed: ${error.message}` 
        });
    }
});

/**
 * GET /api/testGen/:projectId
 * Retrieves all saved test cases for a specific project.
 */
router.get('/:projectId', async (req, res) => {
    try {
        const stories = await UserStory.find({ projectId: req.params.projectId }).sort({ generatedAt: -1 });
        res.status(200).json(stories);
    } catch (error) {
        console.error('Error fetching test cases:', error);
        res.status(500).json({ message: 'Error retrieving test cases.' });
    }
});

/**
 * POST /api/generate-tests/manual
 * Allows users to manually create a test case.
 */
router.post('/manual', async (req, res) => {
    const { projectId, testCase } = req.body;
    
    if (!projectId || !testCase) {
        return res.status(400).json({ message: 'Project ID and Test Case data are required.' });
    }

    try {
        // Calculate next HU-ID by finding the MAX existing HU number
        const allStories = await UserStory.find({ projectId });
        let maxHuNum = 0;

        allStories.forEach(s => {
            (s.testCases || []).forEach(tc => {
                if (tc.id && typeof tc.id === 'string' && tc.id.startsWith('HU-')) {
                    const num = parseInt(tc.id.replace('HU-', ''), 10);
                    if (!isNaN(num) && num > maxHuNum) maxHuNum = num;
                }
            });
        });

        const formattedTC = {
            ...testCase,
            id: `HU-${String(maxHuNum + 1).padStart(3, '0')}`
        };

        const newUserStory = new UserStory({
            projectId,
            requirement: 'Manually Created Test Case',
            options: { manual: true },
            testCases: [formattedTC]
        });
        await newUserStory.save();
        res.status(201).json({ message: 'Test case created successfully', data: newUserStory });
    } catch (error) {
        console.error('Manual Creation Error:', error);
        res.status(500).json({ message: 'Failed to create manual test case.' });
    }
});

module.exports = router;