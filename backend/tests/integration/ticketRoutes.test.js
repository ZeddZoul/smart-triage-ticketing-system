const request = require('supertest');
const { createApp } = require('../../src/app');
const {
  NotFoundError,
  InvalidStatusTransitionError,
} = require('../../src/entities/errors');
const { TicketStatus } = require('../../src/entities/enums');

function buildApp(overrides = {}) {
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';

  const createTicketUseCase = {
    execute: jest.fn(async () => ({
      id: 'ticket-1',
      title: 'Issue title',
      description: 'Issue description long enough',
      customer_email: 'customer@example.com',
      status: TicketStatus.OPEN,
      category: 'Billing',
      priority: 'High',
      triage_attempts: 1,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  };

  const getTicketsUseCase = {
    execute: jest.fn(async () => ({
      data: [
        {
          id: 'ticket-1',
          title: 'Issue title',
          description: 'Issue description long enough',
          customer_email: 'customer@example.com',
          status: TicketStatus.OPEN,
          category: 'Billing',
          priority: 'High',
          triage_attempts: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    })),
  };

  const getTicketByIdUseCase = {
    execute: jest.fn(async (id) => ({
      id,
      title: 'Issue title',
      description: 'Issue description long enough',
      customer_email: 'customer@example.com',
      status: TicketStatus.OPEN,
      category: 'Billing',
      priority: 'High',
      triage_attempts: 1,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  };

  const updateTicketStatusUseCase = {
    execute: jest.fn(async ({ ticketId, newStatus }) => ({
      id: ticketId,
      title: 'Issue title',
      description: 'Issue description long enough',
      customer_email: 'customer@example.com',
      status: newStatus,
      category: 'Billing',
      priority: 'High',
      triage_attempts: 1,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  };

  if (overrides.createResult) {
    createTicketUseCase.execute.mockResolvedValue(overrides.createResult);
  }
  if (overrides.getByIdError) {
    getTicketByIdUseCase.execute.mockRejectedValue(overrides.getByIdError);
  }
  if (overrides.patchError) {
    updateTicketStatusUseCase.execute.mockRejectedValue(overrides.patchError);
  }

  const app = createApp({
    createTicketUseCase,
    getTicketsUseCase,
    getTicketByIdUseCase,
    updateTicketStatusUseCase,
    authService: {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
      generateToken: jest.fn(),
      verifyToken: jest.fn(async (token) => {
        if (token !== 'valid-token') throw new Error('bad token');
        return { agentId: 'agent-1', email: 'agent@example.com', role: 'agent' };
      }),
    },
  });

  return { app };
}

describe('ticket routes', () => {
  test('POST /api/tickets valid (public)', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/api/tickets').send({
      title: 'Cannot login to account',
      description: 'I keep getting an error code while trying to login to my account.',
      customer_email: 'customer@example.com',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/tickets invalid body', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/api/tickets').send({
      title: 'bad',
      description: 'short',
      customer_email: 'invalid',
    });

    expect(res.status).toBe(400);
  });

  test('POST /api/tickets AI failure graceful', async () => {
    const { app } = buildApp({
      createResult: {
        id: 'ticket-2',
        title: 'Issue title',
        description: 'Issue description long enough',
        customer_email: 'customer@example.com',
        status: TicketStatus.PENDING_TRIAGE,
        category: null,
        priority: null,
        triage_attempts: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const res = await request(app).post('/api/tickets').send({
      title: 'Need help with account',
      description: 'This issue should still create ticket even if AI fails.',
      customer_email: 'customer@example.com',
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(TicketStatus.PENDING_TRIAGE);
  });

  test('GET /api/tickets with JWT', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', 'Bearer valid-token')
      .query({ page: '1', limit: '10' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/tickets without JWT (401)', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });

  test('GET /api/tickets/:id found', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .get('/api/tickets/ticket-1')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('ticket-1');
  });

  test('GET /api/tickets/:id not found', async () => {
    const { app } = buildApp({ getByIdError: new NotFoundError('Ticket not found') });
    const res = await request(app)
      .get('/api/tickets/missing')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(404);
  });

  test('PATCH /api/tickets/:id valid transition', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .patch('/api/tickets/ticket-1')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: TicketStatus.IN_PROGRESS });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(TicketStatus.IN_PROGRESS);
  });

  test('PATCH /api/tickets/:id invalid transition (422)', async () => {
    const { app } = buildApp({
      patchError: new InvalidStatusTransitionError('Invalid transition'),
    });

    const res = await request(app)
      .patch('/api/tickets/ticket-1')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: TicketStatus.CLOSED });

    expect(res.status).toBe(422);
  });

  test('PATCH /api/tickets/:id no JWT (401)', async () => {
    const { app } = buildApp();
    const res = await request(app).patch('/api/tickets/ticket-1').send({ status: TicketStatus.OPEN });
    expect(res.status).toBe(401);
  });
});
