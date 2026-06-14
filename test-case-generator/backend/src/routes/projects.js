const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Document = require('../models/Document');
const UserStory = require('../models/UserStory');
const Chunk = require('../models/Chunk');

/**
 * GET /api/projects
 * Retrieves all projects for a specific user from the database.
 */
router.get('/', async (req, res) => {
    const { userId, search } = req.query; // gets users search from frontend
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        let query = { userId };

        // search for project name 
        if (search && search.trim() !== '') {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        const projects = await Project.find(query).sort({ createdAt: -1 });
        
        res.json(projects);
    } catch (error) {
        console.error('[Error] Project list retrieval failure:', error);
        res.status(500).json({ message: 'Error retrieving projects' });
    }
});
/**
 * POST /api/projects
 * Creates a new project for a specific user in the database.
 */
router.post('/', async (req, res) => {
    const { name, description, userId } = req.body;
    if (!name || !userId) {
        return res.status(400).json({ message: 'Project name and User ID are required' });
    }

    try {
        const newProject = new Project({ name, description, userId });
        await newProject.save();
        console.log(`[Success] Created new project: ${name} (ID: ${newProject._id})`);
        res.status(201).json(newProject);
    } catch (error) {
        console.error('[System Error] Project creation failure:', error);
        res.status(500).json({ message: 'Error creating project' });
    }
});

/**
 * DELETE /api/projects/:id
 * Deletes a project and all its associated data (Documents, Chunks, UserStories).
 */
router.delete('/:id', async (req, res) => {
    const projectId = req.params.id;
    try {
        // 1. Delete all chunks associated with this project
        await Chunk.deleteMany({ projectId });
        
        // 2. Delete all documents associated with this project
        await Document.deleteMany({ projectId });
        
        // 3. Delete all user stories/test cases associated with this project
        await UserStory.deleteMany({ projectId });
        
        // 4. Finally, delete the project itself
        const deletedProject = await Project.findByIdAndDelete(projectId);

        if (!deletedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({ message: 'Project and all associated data deleted successfully' });
    } catch (error) {
        console.error('Cascade Delete Error:', error);
        res.status(500).json({ message: 'Error deleting project and its data' });
    }
});

module.exports = router;