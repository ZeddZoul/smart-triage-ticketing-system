const CreateTicketUseCase = require('../../../src/useCases/CreateTicketUseCase');
const { TicketStatus, HistoryAction } = require('../../../src/entities/enums');
const FakeTicketRepository = require('../../helpers/fakeTicketRepository');
const FakeTicketHistoryRepository = require('../../helpers/fakeTicketHistoryRepository');
const FakeAITriageService = require('../../helpers/fakeAITriageService');
const TriageTicketUseCase = require('../../../src/useCases/TriageTicketUseCase');

describe('CreateTicketUseCase', () => {
  test('Happy path: ticket created + triaged -> status Open', async () => {
    const ticketRepo = new FakeTicketRepository();
    const historyRepo = new FakeTicketHistoryRepository();
    const triageUseCase = new TriageTicketUseCase(
      ticketRepo,
      historyRepo,
      new FakeAITriageService({ mode: 'success' }),
      { maxRetries: 3 },
    );

    const useCase = new CreateTicketUseCase(ticketRepo, historyRepo, triageUseCase);

    const result = await useCase.execute({
      title: 'Payment declined',
      description: 'My card is valid but checkout fails.',
      customer_email: 'customer@example.com',
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe(TicketStatus.OPEN);
    expect(result.category).toBeTruthy();
    expect(result.priority).toBeTruthy();
  });

  test('AI failure: ticket created -> status pending_triage and still returns result', async () => {
    const ticketRepo = new FakeTicketRepository();
    const historyRepo = new FakeTicketHistoryRepository();
    const triageUseCase = new TriageTicketUseCase(
      ticketRepo,
      historyRepo,
      new FakeAITriageService({ mode: 'error', error: new Error('gemini unavailable') }),
      { maxRetries: 3 },
    );

    const useCase = new CreateTicketUseCase(ticketRepo, historyRepo, triageUseCase);

    const result = await useCase.execute({
      title: 'Cannot reset password',
      description: 'The reset email link is expired instantly.',
      customer_email: 'cust2@example.com',
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe(TicketStatus.PENDING_TRIAGE);
  });

  test("History record created with action 'created'", async () => {
    const ticketRepo = new FakeTicketRepository();
    const historyRepo = new FakeTicketHistoryRepository();
    const triageUseCase = new TriageTicketUseCase(
      ticketRepo,
      historyRepo,
      new FakeAITriageService({ mode: 'error' }),
      { maxRetries: 99 },
    );

    const useCase = new CreateTicketUseCase(ticketRepo, historyRepo, triageUseCase);

    const result = await useCase.execute({
      title: 'Need invoice copy',
      description: 'Please send a copy of last month invoice.',
      customer_email: 'cust3@example.com',
    });

    const history = await historyRepo.findByTicketId(result.id);
    expect(history.some((h) => h.action === HistoryAction.CREATED)).toBe(true);
  });
});
