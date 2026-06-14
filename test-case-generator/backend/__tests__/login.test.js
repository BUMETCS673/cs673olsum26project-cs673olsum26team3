// AI-USAGE SUMMARY
// Tools: Claude (Claude Code)
// Overall AI Contribution: ~50%
// AI-Assisted Areas: Mock setup for User model, bcrypt and JWT mocking
// Human Contributions: Wrote auth test scenarios (login, register, password change), defined edge cases and expected error messages
// Notes: AI-generated code was significantly refactored and tested before integration

const request = require('supertest');
const express = require('express');

// ── Mock the User model ───────────────────────────────────────────────────────
jest.mock('../src/models/User', () => {
  const MockUser = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'mock-user-id';
    this.save = jest.fn().mockResolvedValue(this);
  });
  MockUser.findOne = jest.fn();
  return MockUser;
});

const User = require('../src/models/User');
const loginRouter = require('../src/routes/login');

const app = express();
app.use(express.json());
app.use('/api', loginRouter);

// ─────────────────────────────── POST /api/login ─────────────────────────────

describe('POST /api/login', () => {
  test('returns 400 when username is missing', async () => {
    const res = await request(app).post('/api/login').send({ password: 'secret' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/username and password/i);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/login').send({ username: 'alice' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 when credentials do not match', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).post('/api/login').send({ username: 'alice', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/incorrect/i);
  });

  test('returns 200 with user payload on valid credentials', async () => {
    User.findOne.mockResolvedValue({ _id: 'uid-1', username: 'alice' });
    const res = await request(app).post('/api/login').send({ username: 'alice', password: 'pass' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('alice');
    expect(res.body.user.id).toBe('uid-1');
  });

  test('returns 500 on database error', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/login').send({ username: 'alice', password: 'pass' });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ──────────────────────────── POST /api/register ─────────────────────────────

describe('POST /api/register', () => {
  test('returns 400 when username is missing', async () => {
    const res = await request(app).post('/api/register').send({ password: 'pass' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/register').send({ username: 'bob' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 409 when username is already taken', async () => {
    User.findOne.mockResolvedValue({ username: 'alice' });
    const res = await request(app).post('/api/register').send({ username: 'alice', password: 'pass' });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already taken/i);
  });

  test('returns 201 with new user on successful registration', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).post('/api/register').send({ username: 'bob', password: 'pass' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('bob');
  });

  test('returns 500 on database error', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/register').send({ username: 'bob', password: 'pass' });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────── POST /api/change-password ───────────────────────────

describe('POST /api/change-password', () => {
  test('returns 400 when username is missing', async () => {
    const res = await request(app).post('/api/change-password').send({ newPassword: 'newpass' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when newPassword is missing', async () => {
    const res = await request(app).post('/api/change-password').send({ username: 'alice' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).post('/api/change-password').send({ username: 'ghost', newPassword: 'newpass' });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('returns 200 and updates the password', async () => {
    const mockUser = { username: 'alice', password: 'oldpass', save: jest.fn().mockResolvedValue({}) };
    User.findOne.mockResolvedValue(mockUser);
    const res = await request(app).post('/api/change-password').send({ username: 'alice', newPassword: 'newpass' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.password).toBe('newpass');
    expect(mockUser.save).toHaveBeenCalled();
  });

  test('returns 500 on database error', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/change-password').send({ username: 'alice', newPassword: 'newpass' });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
