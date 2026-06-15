const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const UserStory = require('../models/UserStory');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');

// Initialize OpenAI client using GitHub Models API endpoint
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://models.inference.ai.azure.com"
});

/**
 * CT-31/CT-33: Endpoint to generate real AI test cases using GitHub Models (GPT-4o).
 * Implements RAG (Retrieval-Augmented Generation) using Atlas Vector Search.
 */
router.post('/', async (req, res) => {
    const { requirement, options, projectId } = req.body;

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
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: requirement
            });
            const queryVector = embeddingResponse.data[0].embedding;

            const relevantChunks = await Chunk.aggregate([
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
            ]);

            if (relevantChunks.length > 0) {
                groundedContext = relevantChunks.map(c => c.text).join('\n\n---\n\n');
                contextAvailable = true;
            }
        } catch (vectorError) {
            console.warn('[Vector Search Fallback] Falling back to full document scan:', vectorError.message);
        }

        // 2. Fallback to full document text if Vector Search yielded nothing
        if (!contextAvailable) {
            const projectDocs = await Document.find({ projectId });
            if (projectDocs.length > 0) {
                groundedContext = projectDocs.map(doc => doc.extractedText).join('\n\n');
                contextAvailable = true;
                retrievalMethod = 'Full Document Scan';
            }
        }

        // Fetch all existing test cases for this project to provide context to the AI
        const existingStories = await UserStory.find({ projectId });
        const existingTestCases = existingStories.flatMap(story => (story.testCases || []).map(tc => ({
            id: tc.id,
            title: tc.title,
            type: tc.type
        })));

        const existingContext = existingTestCases.length > 0 
            ? `\nExisting Test Cases in this project:\n${existingTestCases.map(tc => `- ${tc.id}: ${tc.title} (${tc.type})`).join('\n')}`
            : '';

        // Construct the AI Prompt based on selected options
        let typesToGenerate = [];
        if (options.positive) typesToGenerate.push('Functional/Positive Test Cases');
        if (options.negative) typesToGenerate.push('Negative Test Cases (invalid inputs, error handling)');
        if (options.edgeCase) typesToGenerate.push('Edge Cases (boundaries, limits, unusual conditions)');

        const prompt = `
            You are a Senior QA Engineer. Generate structured test cases based on the User Story and Product Context below.
            
            User Story: "${requirement}"
            
            Product Context:
            ${contextAvailable ? groundedContext : 'No specific project documentation provided.'}
            ${existingContext}
            
            Requirements:
            1. ONLY generate the following types of test cases: ${typesToGenerate.join(', ')}.
            2. Do NOT duplicate the "Existing Test Cases" listed above.
            3. Do NOT generate any other types of test cases.
            4. Format each test case as a JSON object with:
               - id (string, e.g., TC-001)
               - title (string)
               - preconditions (string)
               - steps (array of strings)
               - expectedResults (string)
               - type (string: "Functional", "Negative", or "Edge Case")
               - priority (string: "High", "Medium", or "Low")
            
            Return ONLY a JSON object containing a "testCases" array.
        `;

        // CT-33: Call AI API
        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are an expert test case generator. Output only valid JSON.' },
                { role: 'user', content: prompt }
            ]
        });

        let rawContent = aiResponse.choices[0].message.content.trim();
        if (rawContent.startsWith('```')) {
            rawContent = rawContent.replace(/```json|```/g, '');
        }
        
        const content = JSON.parse(rawContent);
        let aiTestCases = content.testCases || content.test_cases || (Array.isArray(content) ? content : Object.values(content)[0]);

        // --- ROBUST ID UNIQUE GENERATION LOGIC ---
        // 1. Get all existing test cases for this project
        const allStories = await UserStory.find({ projectId });
        let maxAiNum = 0;

        allStories.forEach(s => {
            (s.testCases || []).forEach(tc => {
                if (tc.id && typeof tc.id === 'string' && tc.id.startsWith('AI-')) {
                    const num = parseInt(tc.id.replace('AI-', ''), 10);
                    if (!isNaN(num) && num > maxAiNum) maxAiNum = num;
                }
            });
        });

        // 2. Assign new IDs starting from maxAiNum + 1
        if (Array.isArray(aiTestCases)) {
            aiTestCases = aiTestCases.map((tc, index) => ({
                ...tc,
                id: `AI-${String(maxAiNum + index + 1).padStart(3, '0')}`
            }));
        }

        // CT-66: Persist results
        const newUserStory = new UserStory({
            projectId,
            requirement,
            options,
            testCases: aiTestCases || []
        });
        await newUserStory.save();

        let aiNotification = `AI generation completed successfully using ${retrievalMethod}.`;
        if (!contextAvailable) {
            aiNotification = 'Warning: No product specification context found. Generated test cases are generic.';
        }

        return res.status(200).json({
            message: aiNotification,
            data: {
                status: 'Success',
                grounded: contextAvailable,
                retrievalMethod: retrievalMethod,
                testCases: aiTestCases
            }
        });

    } catch (error) {
        console.error('Generation Failure:', error);
        return res.status(500).json({ 
            message: 'AI Generation failed. Please try again.' 
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