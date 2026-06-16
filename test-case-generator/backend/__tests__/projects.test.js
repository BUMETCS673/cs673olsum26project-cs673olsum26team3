// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
// AI-USAGE SUMMARY
// Tools: Claude (Claude Code)
// Overall AI Contribution: ~35%
// AI-Assisted Areas: Assisted with Mongoose model mock structure
// Human Contributions: Implemented cascade delete test scenarios, defined CRUD test cases and expected behavior
// Notes: AI-generated code was significantly refactored and tested before integration

const request = require('supertest');
const express = require('express');

// ── Mock all Mongoose models used by projects.js ──────────────────────────────
jest.mock('../src/models/Project', () => {
  const MockProject = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'mock-project-id';
    this.save = jest.fn().mockResolvedValue(this);
  });
  MockProject.find = jest.fn();
  MockProject.findByIdAndDelete = jest.fn();
  MockProject.deleteMany = jest.fn();
  return MockProject;
});
jest.mock('../src/models/Document',  () => ({ deleteMany: jest.fn() }));
jest.mock('../src/models/UserStory', () => ({ deleteMany: jest.fn() }));
jest.mock('../src/models/Chunk',     () => ({ deleteMany: jest.fn() }));

const Project   = require('../src/models/Project');
const Document  = require('../src/models/Document');
const UserStory = require('../src/models/UserStory');
const Chunk     = require('../src/models/Chunk');
const projectsRouter = require('../src/routes/projects');

const app = express();
app.use(express.json());
app.use('/api/projects', projectsRouter);

// ──────────────────────────── GET /api/projects ───────────────────────────────

describe('GET /api/projects', () => {
  test('returns 400 when userId query param is missing', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('returns 200 with project list for the given user', async () => {
    const projects = [
      { _id: 'p1', name: 'Alpha', userId: 'u1' },
      { _id: 'p2', name: 'Beta',  userId: 'u1' },
    ];
    Project.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(projects) });
    const res = await request(app).get('/api/projects').query({ userId: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('Alpha');
  });

  test('returns 500 on database error', async () => {
    Project.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB')) });
    const res = await request(app).get('/api/projects').query({ userId: 'u1' });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/error/i);
  });
});

// ─────────────────────────── POST /api/projects ───────────────────────────────

describe('POST /api/projects', () => {
  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/projects').send({ userId: 'u1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('returns 400 when userId is missing', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'My Project' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('returns 201 with the created project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'My Project', description: 'Desc', userId: 'u1' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My Project');
    expect(res.body._id).toBe('mock-project-id');
  });

  test('returns 500 when save throws a database error', async () => {
    Project.mockImplementationOnce(function (data) {
      Object.assign(this, data);
      this.save = jest.fn().mockRejectedValue(new Error('DB save error'));
    });
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Bad Project', userId: 'u1' });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/error/i);
  });
});

// ─────────────────────── DELETE /api/projects/:id ────────────────────────────

describe('DELETE /api/projects/:id', () => {
  test('returns 404 when project does not exist', async () => {
    Chunk.deleteMany.mockResolvedValue({});
    Document.deleteMany.mockResolvedValue({});
    UserStory.deleteMany.mockResolvedValue({});
    Project.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app).delete('/api/projects/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('returns 200 and cascades deletes in correct order', async () => {
    const callOrder = [];
    Chunk.deleteMany.mockImplementation(() => { callOrder.push('Chunk'); return Promise.resolve({}); });
    Document.deleteMany.mockImplementation(() => { callOrder.push('Document'); return Promise.resolve({}); });
    UserStory.deleteMany.mockImplementation(() => { callOrder.push('UserStory'); return Promise.resolve({}); });
    Project.findByIdAndDelete.mockImplementation(() => {
      callOrder.push('Project');
      return Promise.resolve({ _id: 'p1', name: 'Test' });
    });

    const res = await request(app).delete('/api/projects/p1');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
    expect(callOrder).toEqual(['Chunk', 'Document', 'UserStory', 'Project']);
  });

  test('deletes chunks associated with the project ID', async () => {
    Chunk.deleteMany.mockResolvedValue({ deletedCount: 3 });
    Document.deleteMany.mockResolvedValue({});
    UserStory.deleteMany.mockResolvedValue({});
    Project.findByIdAndDelete.mockResolvedValue({ _id: 'p1' });

    await request(app).delete('/api/projects/p1');
    expect(Chunk.deleteMany).toHaveBeenCalledWith({ projectId: 'p1' });
  });

  test('returns 500 on database error', async () => {
    Chunk.deleteMany.mockRejectedValue(new Error('DB error'));
    const res = await request(app).delete('/api/projects/p1');
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/error/i);
  });
});
