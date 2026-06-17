// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
// AI-USAGE SUMMARY
// Tools: Claude (Claude Code)
// Overall AI Contribution: ~80%
// AI-Assisted Areas: Assisted with OpenAI and vector search mock setup implemtation
// Human Contributions: Implemented AI vs manual ID sequencing tests (AI-001, HU-001), wrote no-context warning test
// Notes: AI-generated code was significantly refactored and tested before integration

const request = require('supertest');
const express = require('express');

// ── Mock OpenAI ───────────────────────────────────────────────────────────────
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                impactedFeatures: [
                  { name: 'Feature A', relatedTestIds: ['TC-001'] },
                  { name: 'Feature B', relatedTestIds: ['TC-001'] }
                ],
                testCases: [{
                  id: 'TC-001',
                  title: 'Verify login',
                  type: 'Functional',
                  priority: 'High',
                  preconditions: 'User exists',
                  steps: ['Open login page', 'Enter credentials'],
                  expectedResults: 'Dashboard is shown',
                }],
              }),
            },
          }],
        }),
      },
    },
  })),
}));

// ── Mongoose model mocks ──────────────────────────────────────────────────────
jest.mock('../src/models/UserStory', () => {
  const MockUserStory = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'mock-story-id';
    this.generatedAt = new Date().toISOString();
    this.save = jest.fn().mockResolvedValue(this);
  });
  MockUserStory.find = jest.fn();
  return MockUserStory;
});

jest.mock('../src/models/Document', () => ({
  find: jest.fn().mockResolvedValue([]),
}));

jest.mock('../src/models/Chunk', () => ({
  aggregate: jest.fn().mockResolvedValue([]),
}));

const UserStory = require('../src/models/UserStory');
const Chunk     = require('../src/models/Chunk');
const testGenRouter = require('../src/routes/testGen');

const app = express();
app.use(express.json());
app.use('/api/generate-tests', testGenRouter);

// ───────────────────── POST /api/generate-tests (AI generation) ───────────────

describe('POST /api/generate-tests', () => {
  test('returns 400 when requirement is missing', async () => {
    const res = await request(app).post('/api/generate-tests').send({
      options: { positive: true },
      projectId: 'proj-1',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot be empty/i);
  });

  test('returns 400 when requirement is blank whitespace', async () => {
    const res = await request(app).post('/api/generate-tests').send({
      requirement: '   ',
      options: { positive: true },
      projectId: 'proj-1',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot be empty/i);
  });

  test('returns 200 with generated test cases', async () => {
    UserStory.find.mockResolvedValue([]);
    const res = await request(app).post('/api/generate-tests').send({
      requirement: 'User can log in with valid credentials',
      options: { positive: true, negative: false, edgeCase: false },
      projectId: 'proj-1',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.testCases).toHaveLength(1);
    expect(res.body.data.testCases[0].id).toBe('AI-001');
    expect(res.body.data.impactedFeatures).toEqual([
      { name: 'Feature A', relatedTestIds: ['AI-001'] },
      { name: 'Feature B', relatedTestIds: ['AI-001'] }
    ]);
  });

  test('assigns IDs starting after the existing max AI number', async () => {
    UserStory.find.mockResolvedValue([{
      testCases: [{ id: 'AI-005' }, { id: 'AI-003' }],
    }]);
    const res = await request(app).post('/api/generate-tests').send({
      requirement: 'User can reset password',
      options: { positive: true },
      projectId: 'proj-1',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.testCases[0].id).toBe('AI-006');
  });

  test('includes warning message when no project context is available', async () => {
    UserStory.find.mockResolvedValue([]);
    const res = await request(app).post('/api/generate-tests').send({
      requirement: 'Some feature without docs',
      options: { positive: true },
      projectId: 'proj-no-docs',
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/warning/i);
  });
});

// ─────────────────── GET /api/generate-tests/:projectId ──────────────────────

describe('GET /api/generate-tests/:projectId', () => {
  test('returns 200 with all stories for the project', async () => {
    const stories = [
      { _id: 's1', requirement: 'Login', testCases: [] },
      { _id: 's2', requirement: 'Upload', testCases: [] },
    ];
    UserStory.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(stories) });

    const res = await request(app).get('/api/generate-tests/proj-1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].requirement).toBe('Login');
  });

  test('returns 500 on database error', async () => {
    UserStory.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB')) });
    const res = await request(app).get('/api/generate-tests/proj-1');
    expect(res.status).toBe(500);
  });
});

// ──────────────── POST /api/generate-tests/manual ────────────────────────────

describe('POST /api/generate-tests/manual', () => {
  test('returns 400 when projectId is missing', async () => {
    const res = await request(app).post('/api/generate-tests/manual').send({
      testCase: { title: 'My test', type: 'Functional', priority: 'High' },
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('returns 400 when testCase is missing', async () => {
    const res = await request(app).post('/api/generate-tests/manual').send({
      projectId: 'proj-1',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('assigns HU-001 when no manual test cases exist yet', async () => {
    UserStory.find.mockResolvedValue([]);
    const res = await request(app).post('/api/generate-tests/manual').send({
      projectId: 'proj-1',
      testCase: { title: 'First manual test', type: 'Functional', priority: 'Medium' },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.testCases[0].id).toBe('HU-001');
  });

  test('increments to HU-002 when HU-001 already exists', async () => {
    UserStory.find.mockResolvedValue([{
      testCases: [{ id: 'HU-001' }],
    }]);
    const res = await request(app).post('/api/generate-tests/manual').send({
      projectId: 'proj-1',
      testCase: { title: 'Second manual test', type: 'Negative', priority: 'Low' },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.testCases[0].id).toBe('HU-002');
  });

  test('returns 500 on database error', async () => {
    UserStory.find.mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/generate-tests/manual').send({
      projectId: 'proj-1',
      testCase: { title: 'A test', type: 'Functional', priority: 'High' },
    });
    expect(res.status).toBe(500);
  });
});
