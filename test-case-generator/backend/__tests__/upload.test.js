const request = require('supertest');
const express = require('express');

// ── External dependency mocks ─────────────────────────────────────────────────
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
    },
  })),
}));

jest.mock('pdf-parse-fork', () =>
  jest.fn().mockResolvedValue({ text: 'Extracted PDF text content for testing.' })
);

jest.mock('tesseract.js', () => ({
  recognize: jest.fn().mockResolvedValue({ data: { text: 'OCR extracted text.' } }),
}));

// ── Mongoose model mocks ──────────────────────────────────────────────────────
jest.mock('../src/models/Document', () => {
  const MockDocument = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'mock-doc-id';
    this.uploadDate = new Date().toISOString();
    this.save = jest.fn().mockResolvedValue(this);
  });
  MockDocument.find = jest.fn();
  MockDocument.findByIdAndDelete = jest.fn();
  MockDocument.deleteMany = jest.fn();
  return MockDocument;
});

jest.mock('../src/models/Chunk', () => {
  const MockChunk = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id = 'mock-chunk-id';
    this.save = jest.fn().mockResolvedValue(this);
  });
  MockChunk.deleteMany = jest.fn();
  return MockChunk;
});

const Document = require('../src/models/Document');
const Chunk    = require('../src/models/Chunk');
const uploadRouter = require('../src/routes/upload');

const app = express();
app.use(express.json());
app.use('/api/upload', uploadRouter);

// ─────────────────────────── POST /api/upload ─────────────────────────────────

describe('POST /api/upload', () => {
  test('returns 400 when no files are attached', async () => {
    const res = await request(app)
      .post('/api/upload')
      .field('projectId', 'proj-1');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no files/i);
  });

  test('returns 400 for an unsupported file type (.txt)', async () => {
    const res = await request(app)
      .post('/api/upload')
      .field('projectId', 'proj-1')
      .attach('documents', Buffer.from('plain text'), {
        filename: 'readme.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsupported/i);
  });

  test('returns 400 when projectId is missing after file is attached', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('documents', Buffer.from('%PDF-1.4 test'), {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/project id/i);
  });

  test('returns 200 on successful PDF upload', async () => {
    const res = await request(app)
      .post('/api/upload')
      .field('projectId', 'proj-1')
      .attach('documents', Buffer.from('%PDF-1.4 minimal'), {
        filename: 'spec.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/uploaded/i);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].fileName).toBe('spec.pdf');
  });

  test('saves a Document record to the database on upload', async () => {
    await request(app)
      .post('/api/upload')
      .field('projectId', 'proj-2')
      .attach('documents', Buffer.from('%PDF-1.4 x'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });
    expect(Document).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'proj-2', fileName: 'doc.pdf' })
    );
  });
});

// ─────────────────────── GET /api/upload/:projectId ──────────────────────────

describe('GET /api/upload/:projectId', () => {
  test('returns 200 with formatted document list', async () => {
    const docs = [
      { _id: 'd1', fileName: 'file1.pdf', uploadDate: new Date().toISOString() },
      { _id: 'd2', fileName: 'file2.png', uploadDate: new Date().toISOString() },
    ];
    Document.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(docs) });

    const res = await request(app).get('/api/upload/proj-1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('file1.pdf');
    expect(res.body[0].status).toBe('Ready');
  });

  test('returns 500 on database error', async () => {
    Document.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB')) });
    const res = await request(app).get('/api/upload/proj-1');
    expect(res.status).toBe(500);
  });
});

// ──────────────────────── DELETE /api/upload/:id ─────────────────────────────

describe('DELETE /api/upload/:id', () => {
  test('returns 200 and removes the document and its chunks', async () => {
    Chunk.deleteMany.mockResolvedValue({ deletedCount: 2 });
    Document.findByIdAndDelete.mockResolvedValue({ _id: 'doc-1', fileName: 'file.pdf' });

    const res = await request(app).delete('/api/upload/doc-1');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
    expect(Chunk.deleteMany).toHaveBeenCalledWith({ documentId: 'doc-1' });
  });

  test('returns 404 when document does not exist', async () => {
    Chunk.deleteMany.mockResolvedValue({});
    Document.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app).delete('/api/upload/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('returns 500 on database error', async () => {
    Chunk.deleteMany.mockRejectedValue(new Error('DB error'));
    const res = await request(app).delete('/api/upload/doc-1');
    expect(res.status).toBe(500);
  });
});
