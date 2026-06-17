// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
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
// AI-ASSISTED: YES 
// Tool: Gemini, ChatGPT
// Prompt Summary: Implement a RAG-based test case generation endpoint using Atlas Vector Search and GPT-4o
// AI Contribution: ~60% 
// Modifications: Added Atlas Vector Search logic, fallback to full document scan, and robust ID generation
// Verification: Unit tests (testGen.test.js), Manual API testing
// Confidence: High
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
            You are a Senior QA Engineer. Analyze the User Story and Product Context below to identify impacted features and generate structured test cases.
            
            User Story: "${requirement}"
            
            Product Context:
            ${contextAvailable ? groundedContext : 'No specific project documentation provided.'}
            ${existingContext}
            
            Requirements:
            1. Identify any existing system features or modules that might be impacted by this new user story based on the Product Context. 
            2. Generate the following types of test cases: ${typesToGenerate.join(', ')}.
            3. For each impacted feature identified, specify which of the generated test case IDs (e.g., TC-001) are related to it.
            4. Do NOT duplicate the "Existing Test Cases" listed above.
            5. Format each test case as a JSON object with:
               - id (string, e.g., TC-001)
               - title (string)
               - preconditions (string)
               - steps (array of strings)
               - expectedResults (string)
               - type (string: "Functional", "Negative", or "Edge Case")
               - priority (string: "High", "Medium", or "Low")
            
            Return ONLY a JSON object containing:
            - "impactedFeatures": An array of objects, each with "name" (string) and "relatedTestIds" (array of strings matching the IDs you generated).
            - "testCases": An array of the test case objects.
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
        let impactedFeatures = content.impactedFeatures || [];

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
        // We also need to update the relatedTestIds in impactedFeatures to match the new AI-XXX IDs
        if (Array.isArray(aiTestCases)) {
            const idMap = {}; // Maps original TC-XXX IDs to new AI-XXX IDs
            aiTestCases = aiTestCases.map((tc, index) => {
                const oldId = tc.id;
                const newId = `AI-${String(maxAiNum + index + 1).padStart(3, '0')}`;
                idMap[oldId] = newId;
                return { ...tc, id: newId };
            });

            // Update impactedFeatures with the new IDs
            impactedFeatures = impactedFeatures.map(feature => ({
                ...feature,
                relatedTestIds: (feature.relatedTestIds || []).map(oldId => idMap[oldId] || oldId)
            }));
        }

        // --- SECONDARY EVALUATION (AI PEER REVIEW) ---
        // Call a second AI agent to review the generated output for quality and accuracy.
        let evaluation = { score: 0, feedback: [], status: 'Pending' };
        try {
            const evalPrompt = `
                You are a Senior QA Manager reviewing test cases generated by an AI assistant.
                
                Original Requirement: "${requirement}"
                Product Context: ${contextAvailable ? groundedContext.substring(0, 3000) : 'None'}
                
                Generated Test Cases:
                ${JSON.stringify(aiTestCases, null, 2)}
                
                Task:
                1. Score the overall quality, relevance, and coverage of these test cases from 1 to 10.
                2. Provide 2-4 concise, professional feedback points or warnings (flags).
                3. Check if the test cases actually cover the original requirement and if they follow QA best practices (clear steps, logical flow).
                
                Return ONLY a JSON object with:
                - "score": number (1-10)
                - "feedback": array of strings
            `;

            const evalResponse = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'You are an objective QA auditor. Output only valid JSON.' },
                    { role: 'user', content: evalPrompt }
                ],
                temperature: 0.3 // Lower temperature for more consistent evaluation
            });

            let evalRaw = evalResponse.choices[0].message.content.trim();
            if (evalRaw.startsWith('```')) evalRaw = evalRaw.replace(/```json|```/g, '');
            evaluation = JSON.parse(evalRaw);
            evaluation.status = 'Completed';
        } catch (evalError) {
            console.error('Secondary Evaluation Failed:', evalError.message);
            evaluation = { score: 0, feedback: ['Evaluation service temporarily unavailable'], status: 'Failed' };
        }

        // --- DRAFT RETURN (HITL) ---
        // Instead of saving immediately, we return the generated data as a draft.
        // The frontend will allow review and then call a separate /save endpoint.
        
        return res.status(200).json({
            message: contextAvailable 
                ? 'AI generation completed. Please review the draft below.' 
                : 'Warning: No product specification context found. Draft results are generic.',
            data: {
                status: 'Draft',
                projectId,
                requirement,
                options,
                grounded: contextAvailable,
                retrievalMethod: retrievalMethod,
                testCases: aiTestCases,
                impactedFeatures: impactedFeatures,
                evaluation: evaluation // Include evaluation results
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
 * POST /api/generate-tests/save
 * Finalizes and persists the reviewed test cases to the database.
 */
router.post('/save', async (req, res) => {
    const { projectId, requirement, options, testCases, impactedFeatures } = req.body;

    if (!projectId || !requirement) {
        return res.status(400).json({ message: 'Missing required project or requirement data.' });
    }

    try {
        const newUserStory = new UserStory({
            projectId,
            requirement,
            options,
            testCases: testCases || [],
            impactedFeatures: impactedFeatures || []
        });

        await newUserStory.save();
        res.status(201).json({ message: 'Test cases saved successfully', storyId: newUserStory._id });
    } catch (error) {
        console.error('Save Failure:', error);
        res.status(500).json({ message: 'Failed to save reviewed test cases.' });
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