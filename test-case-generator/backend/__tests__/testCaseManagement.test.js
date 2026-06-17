// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
// AI-USAGE SUMMARY
// Tools: Claude (Claude Code)
// Overall AI Contribution: ~55%
// AI-Assisted Areas: Helped with archive toggle test structure and assertions
// Human Contributions: Implemented CRUD test scenarios, defined archive/restore behavior and user-scoped query tests
// Notes: AI-generated code was significantly refactored and tested before integration

const request = require('supertest');
const express = require('express');

// ── Mongoose model mocks ──────────────────────────────────────────────────────
jest.mock('../src/models/Project', () => ({
  find: jest.fn(),
}));

jest.mock('../src/models/UserStory', () => ({
  find: jest.fn(),
  findById: jest.fn(),
}));

const Project   = require('../src/models/Project');
const UserStory = require('../src/models/UserStory');
const mgmtRouter = require('../src/routes/testCaseManagement');

const app = express();
app.use(express.json());
app.use('/api/test-cases', mgmtRouter);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStory(tcOverrides = {}) {
  const tc = { id: 'AI-001', title: 'Login test', type: 'Functional', priority: 'High', archived: false, ...tcOverrides };
  return {
    _id: 'story-id-1',
    projectId: 'proj-1',
    options: { manual: false },
    generatedAt: new Date().toISOString(),
    testCases: [tc],
    markModified: jest.fn(),
    save: jest.fn().mockResolvedValue({}),
  };
}

// ──────────────────── GET /api/test-cases/all ─────────────────────────────────

describe('GET /api/test-cases/all', () => {
  test('returns 400 when userId is missing', async () => {
    const res = await request(app).get('/api/test-cases/all');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/userId is required/i);
  });

  test('returns 200 with enriched test cases', async () => {
    Project.find.mockResolvedValue([
      { _id: { toString: () => 'proj-1' }, name: 'Alpha' },
    ]);
    const story = makeStory();
    UserStory.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([story]) });

    const res = await request(app).get('/api/test-cases/all').query({ userId: 'u1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].projectName).toBe('Alpha');
    expect(res.body[0].storyId).toBe('story-id-1');
    expect(res.body[0].isManual).toBe(false);
  });

  test('returns 500 on database error', async () => {
    Project.find.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/test-cases/all').query({ userId: 'u1' });
    expect(res.status).toBe(500);
  });
});

// ─────── PATCH /api/test-cases/:storyId/cases/:tcId (edit) ───────────────────

describe('PATCH /api/test-cases/:storyId/cases/:tcId', () => {
  test('returns 404 when story is not found', async () => {
    UserStory.findById.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/test-cases/bad-story/cases/AI-001')
      .send({ title: 'Updated' });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/story not found/i);
  });

  test('returns 404 when test case ID does not exist in the story', async () => {
    const story = makeStory();
    UserStory.findById.mockResolvedValue(story);
    const res = await request(app)
      .patch('/api/test-cases/story-id-1/cases/NONEXISTENT')
      .send({ title: 'Updated' });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/test case not found/i);
  });

  test('returns 200 and updates the title', async () => {
    const story = makeStory();
    UserStory.findById.mockResolvedValue(story);
    const res = await request(app)
      .patch('/api/test-cases/story-id-1/cases/AI-001')
      .send({ title: 'New Title' });
    expect(res.status).toBe(200);
    expect(res.body.testCase.title).toBe('New Title');
    expect(story.save).toHaveBeenCalled();
  });

  test('returns 200 and updates type and priority', async () => {
    const story = makeStory();
    UserStory.findById.mockResolvedValue(story);
    const res = await request(app)
      .patch('/api/test-cases/story-id-1/cases/AI-001')
      .send({ type: 'Negative', priority: 'Low' });
    expect(res.status).toBe(200);
    expect(res.body.testCase.type).toBe('Negative');
    expect(res.body.testCase.priority).toBe('Low');
  });

  test('returns 500 on database error', async () => {
    UserStory.findById.mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .patch('/api/test-cases/story-id-1/cases/AI-001')
      .send({ title: 'New Title' });
    expect(res.status).toBe(500);
  });
});

// ────── PATCH /api/test-cases/:storyId/cases/:tcId/archive ───────────────────

describe('PATCH /api/test-cases/:storyId/cases/:tcId/archive', () => {
  test('returns 404 when story is not found', async () => {
    UserStory.findById.mockResolvedValue(null);
    const res = await request(app).patch('/api/test-cases/bad-story/cases/AI-001/archive');
    expect(res.status).toBe(404);
  });

  test('returns 404 when test case is not found', async () => {
    const story = makeStory();
    UserStory.findById.mockResolvedValue(story);
    const res = await request(app).patch('/api/test-cases/story-id-1/cases/MISSING/archive');
    expect(res.status).toBe(404);
  });

  test('archives an active test case (false → true)', async () => {
    const story = makeStory({ archived: false });
    UserStory.findById.mockResolvedValue(story);
    const res = await request(app).patch('/api/test-cases/story-id-1/cases/AI-001/archive');
    expect(res.status).toBe(200);
    expect(res.body.archived).toBe(true);
    expect(res.body.message).toMatch(/archived/i);
  });

  test('unarchives an archived test case (true → false)', async () => {
    const story = makeStory({ archived: true });
    UserStory.findById.mockResolvedValue(story);
    const res = await request(app).patch('/api/test-cases/story-id-1/cases/AI-001/archive');
    expect(res.status).toBe(200);
    expect(res.body.archived).toBe(false);
    expect(res.body.message).toMatch(/unarchived/i);
  });

  test('returns 500 on database error', async () => {
    UserStory.findById.mockRejectedValue(new Error('DB'));
    const res = await request(app).patch('/api/test-cases/story-id-1/cases/AI-001/archive');
    expect(res.status).toBe(500);
  });
});

// ──────── DELETE /api/test-cases/:storyId/cases/:tcId ────────────────────────

describe('DELETE /api/test-cases/:storyId/cases/:tcId', () => {
  test('returns 404 when story is not found', async () => {
    UserStory.findById.mockResolvedValue(null);
    const res = await request(app).delete('/api/test-cases/bad-story/cases/AI-001');
    expect(res.status).toBe(404);
  });

  test('returns 404 when test case is not found in the story', async () => {
    const story = makeStory();
    UserStory.findById.mockResolvedValue(story);
    const res = await request(app).delete('/api/test-cases/story-id-1/cases/NONEXISTENT');
    expect(res.status).toBe(404);
  });

  test('returns 200 and removes the test case', async () => {
    const story = makeStory();
    UserStory.findById.mockResolvedValue(story);
    const res = await request(app).delete('/api/test-cases/story-id-1/cases/AI-001');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Test case deleted');
    expect(story.testCases).toHaveLength(0);
    expect(story.save).toHaveBeenCalled();
  });

  test('returns 500 on database error', async () => {
    UserStory.findById.mockRejectedValue(new Error('DB error'));
    const res = await request(app).delete('/api/test-cases/story-id-1/cases/AI-001');
    expect(res.status).toBe(500);
  });
});
