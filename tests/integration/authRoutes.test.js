const request = require('supertest');
const { createApp } = require('../../src/app');
const { ConflictError, UnauthorizedError } = require('../../src/entities/errors');

function buildApp(overrides = {}) {
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';

  const registerAgentUseCase = {
    execute: jest.fn(async (payload) => ({
      id: 'agent-1',
      email: payload.email,
      name: payload.name,
      role: 'agent',
    })),
  };

  const loginAgentUseCase = {
    execute: jest.fn(async () => ({
      token: 'valid-token',
      agent: { id: 'agent-1', email: 'agent@example.com', name: 'Agent', role: 'agent' },
    })),
  };

  if (overrides.registerError) {
    registerAgentUseCase.execute.mockRejectedValue(overrides.registerError);
  }
  if (overrides.loginError) {
    loginAgentUseCase.execute.mockRejectedValue(overrides.loginError);
  }

  const app = createApp({
    registerAgentUseCase,
    loginAgentUseCase,
    authService: {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
      generateToken: jest.fn(),
      verifyToken: jest.fn(async () => ({ agentId: 'agent-1', email: 'agent@example.com', role: 'agent' })),
    },
  });

  return { app, registerAgentUseCase, loginAgentUseCase };
}

describe('auth routes', () => {
  test('POST /api/auth/register valid', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/api/auth/register').send({
      email: 'new@example.com',
      password: 'Password123!',
      name: 'New Agent',
    });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('new@example.com');
  });

  test('POST /api/auth/register duplicate email', async () => {
    const { app } = buildApp({ registerError: new ConflictError('Email already registered') });
    const res = await request(app).post('/api/auth/register').send({
      email: 'dup@example.com',
      password: 'Password123!',
      name: 'Dup Agent',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('POST /api/auth/register invalid body', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/api/auth/register').send({
      email: 'invalid-email',
      password: '123',
      name: 'A',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/auth/login valid', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/api/auth/login').send({
      email: 'agent@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.agent.email).toBe('agent@example.com');
  });

  test('POST /api/auth/login invalid credentials', async () => {
    const { app } = buildApp({ loginError: new UnauthorizedError('Invalid credentials') });
    const res = await request(app).post('/api/auth/login').send({
      email: 'agent@example.com',
      password: 'wrong',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
