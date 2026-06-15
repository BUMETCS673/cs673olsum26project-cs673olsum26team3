const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const UserStory = require('../models/UserStory');

/**
 * GET /api/test-cases/all?userId=...
 * Returns all test cases across every project owned by the user,
 * enriched with projectName, storyId, createdAt, and isManual flag.
 */
router.get('/all', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    try {
        const projects = await Project.find({ userId });
        const projectIds = projects.map(p => p._id.toString());
        const projectMap = Object.fromEntries(projects.map(p => [p._id.toString(), p.name]));

        const stories = await UserStory.find({ projectId: { $in: projectIds } }).sort({ generatedAt: -1 });

        const allTCs = [];
        stories.forEach(story => {
            (story.testCases || []).forEach(tc => {
                allTCs.push({
                    ...tc,
                    storyId: story._id.toString(),
                    projectId: story.projectId,
                    projectName: projectMap[story.projectId] || 'Unknown Project',
                    createdAt: story.generatedAt,
                    isManual: story.options?.manual || false,
                    archived: tc.archived || false,
                });
            });
        });

        res.json(allTCs);
    } catch (error) {
        console.error('Error fetching all test cases:', error);
        res.status(500).json({ message: 'Error fetching test cases' });
    }
});

/**
 * PATCH /api/test-cases/:storyId/cases/:tcId
 * Updates editable fields of a specific test case.
 */
router.patch('/:storyId/cases/:tcId', async (req, res) => {
    const { storyId, tcId } = req.params;
    const { title, type, priority, preconditions, steps, expectedResults } = req.body;

    try {
        const story = await UserStory.findById(storyId);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        const tc = story.testCases.find(t => t.id === tcId);
        if (!tc) return res.status(404).json({ message: 'Test case not found' });

        if (title !== undefined) tc.title = title;
        if (type !== undefined) tc.type = type;
        if (priority !== undefined) tc.priority = priority;
        if (preconditions !== undefined) tc.preconditions = preconditions;
        if (steps !== undefined) tc.steps = steps;
        if (expectedResults !== undefined) tc.expectedResults = expectedResults;

        story.markModified('testCases');
        await story.save();
        res.json({ message: 'Test case updated', testCase: tc });
    } catch (error) {
        console.error('Error updating test case:', error);
        res.status(500).json({ message: 'Error updating test case' });
    }
});

/**
 * PATCH /api/test-cases/:storyId/cases/:tcId/archive
 * Toggles the archived flag on a test case.
 */
router.patch('/:storyId/cases/:tcId/archive', async (req, res) => {
    const { storyId, tcId } = req.params;

    try {
        const story = await UserStory.findById(storyId);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        const tc = story.testCases.find(t => t.id === tcId);
        if (!tc) return res.status(404).json({ message: 'Test case not found' });

        tc.archived = !tc.archived;
        story.markModified('testCases');
        await story.save();
        res.json({ message: tc.archived ? 'Test case archived' : 'Test case unarchived', archived: tc.archived });
    } catch (error) {
        console.error('Error archiving test case:', error);
        res.status(500).json({ message: 'Error archiving test case' });
    }
});

/**
 * DELETE /api/test-cases/:storyId/cases/:tcId
 * Permanently removes a test case from its parent user story.
 */
router.delete('/:storyId/cases/:tcId', async (req, res) => {
    const { storyId, tcId } = req.params;

    try {
        const story = await UserStory.findById(storyId);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        const before = story.testCases.length;
        story.testCases = story.testCases.filter(t => t.id !== tcId);

        if (story.testCases.length === before) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        story.markModified('testCases');
        await story.save();
        res.json({ message: 'Test case deleted' });
    } catch (error) {
        console.error('Error deleting test case:', error);
        res.status(500).json({ message: 'Error deleting test case' });
    }
});

module.exports = router;
