const request = require('supertest');
const { createApp } = require('../../src/app');

describe('health routes', () => {
  test('GET /api/health returns 200 with status', async () => {
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';

    const app = createApp({
      authService: {
        hashPassword: jest.fn(),
        comparePassword: jest.fn(),
        generateToken: jest.fn(),
        verifyToken: jest.fn(async () => ({ agentId: 'agent-1', email: 'a@a.com', role: 'agent' })),
      },
    });

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
