const TriageTicketUseCase = require('../../../src/useCases/TriageTicketUseCase');
const { NotFoundError } = require('../../../src/entities/errors');
const { TicketStatus, HistoryAction } = require('../../../src/entities/enums');
const FakeTicketRepository = require('../../helpers/fakeTicketRepository');
const FakeTicketHistoryRepository = require('../../helpers/fakeTicketHistoryRepository');
const FakeAITriageService = require('../../helpers/fakeAITriageService');
const { createTicket } = require('../../helpers/testFactory');

describe('TriageTicketUseCase', () => {
  test('AI returns valid classification -> ticket updated to Open', async () => {
    const ticketRepo = new FakeTicketRepository([
      createTicket({ status: TicketStatus.PENDING_TRIAGE, triage_attempts: 0 }),
    ]);
    const ticket = (await ticketRepo.findAll()).data[0];
    const historyRepo = new FakeTicketHistoryRepository();
    const ai = new FakeAITriageService({
      mode: 'success',
      result: { category: 'Billing', priority: 'High' },
    });

    const useCase = new TriageTicketUseCase(ticketRepo, historyRepo, ai, { maxRetries: 3 });
    const updated = await useCase.execute(ticket.id);

    expect(updated.status).toBe(TicketStatus.OPEN);
    expect(updated.category).toBe('Billing');
    expect(updated.priority).toBe('High');
    expect(updated.triage_attempts).toBe(1);

    const history = await historyRepo.findByTicketId(ticket.id);
    expect(history).toHaveLength(1);
    expect(history[0].action).toBe(HistoryAction.TRIAGE_COMPLETED);
  });

  test('AI returns empty category -> treated as failure', async () => {
    const ticketRepo = new FakeTicketRepository([
      createTicket({ status: TicketStatus.PENDING_TRIAGE, triage_attempts: 0 }),
    ]);
    const ticket = (await ticketRepo.findAll()).data[0];
    const historyRepo = new FakeTicketHistoryRepository();
    const ai = new FakeAITriageService({
      mode: 'success',
      result: { category: '', priority: 'Medium' },
    });

    const useCase = new TriageTicketUseCase(ticketRepo, historyRepo, ai, { maxRetries: 3 });

    await expect(useCase.execute(ticket.id)).rejects.toThrow();
    const after = await ticketRepo.findById(ticket.id);
    expect(after.status).toBe(TicketStatus.PENDING_TRIAGE);
    expect(after.triage_attempts).toBe(1);
  });

  test('AI throws -> triageAttempts incremented', async () => {
    const ticketRepo = new FakeTicketRepository([
      createTicket({ status: TicketStatus.PENDING_TRIAGE, triage_attempts: 1 }),
    ]);
    const ticket = (await ticketRepo.findAll()).data[0];
    const historyRepo = new FakeTicketHistoryRepository();
    const ai = new FakeAITriageService({ mode: 'error', error: new Error('timeout') });

    const useCase = new TriageTicketUseCase(ticketRepo, historyRepo, ai, { maxRetries: 5 });

    await expect(useCase.execute(ticket.id)).rejects.toThrow('timeout');
    const after = await ticketRepo.findById(ticket.id);
    expect(after.triage_attempts).toBe(2);
    expect(after.status).toBe(TicketStatus.PENDING_TRIAGE);
  });

  test('Max retries exceeded -> status triage_failed + history record', async () => {
    const ticketRepo = new FakeTicketRepository([
      createTicket({ status: TicketStatus.PENDING_TRIAGE, triage_attempts: 2 }),
    ]);
    const ticket = (await ticketRepo.findAll()).data[0];
    const historyRepo = new FakeTicketHistoryRepository();
    const ai = new FakeAITriageService({ mode: 'error', error: new Error('api down') });

    const useCase = new TriageTicketUseCase(ticketRepo, historyRepo, ai, { maxRetries: 3 });

    await expect(useCase.execute(ticket.id)).rejects.toThrow('api down');
    const after = await ticketRepo.findById(ticket.id);
    expect(after.status).toBe(TicketStatus.TRIAGE_FAILED);
    expect(after.triage_attempts).toBe(3);

    const history = await historyRepo.findByTicketId(ticket.id);
    expect(history).toHaveLength(1);
    expect(history[0].action).toBe(HistoryAction.TRIAGE_FAILED);
  });

  test('Ticket not found -> NotFoundError', async () => {
    const useCase = new TriageTicketUseCase(
      new FakeTicketRepository(),
      new FakeTicketHistoryRepository(),
      new FakeAITriageService(),
    );

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});
