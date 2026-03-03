const UpdateTicketStatusUseCase = require('../../../src/useCases/UpdateTicketStatusUseCase');
const FakeTicketRepository = require('../../helpers/fakeTicketRepository');
const FakeTicketHistoryRepository = require('../../helpers/fakeTicketHistoryRepository');
const { createTicket } = require('../../helpers/testFactory');
const { TicketStatus, HistoryAction } = require('../../../src/entities/enums');
const { InvalidStatusTransitionError, NotFoundError } = require('../../../src/entities/errors');

describe('UpdateTicketStatusUseCase', () => {
  test('Each valid transition (Open→In Progress, etc.)', async () => {
    const transitions = [
      [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
      [TicketStatus.OPEN, TicketStatus.RESOLVED],
      [TicketStatus.IN_PROGRESS, TicketStatus.OPEN],
      [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
      [TicketStatus.RESOLVED, TicketStatus.OPEN],
      [TicketStatus.PENDING_TRIAGE, TicketStatus.OPEN],
      [TicketStatus.TRIAGE_FAILED, TicketStatus.OPEN],
    ];

    for (const [from, to] of transitions) {
      const ticket = createTicket({ status: from });
      const ticketRepo = new FakeTicketRepository([ticket]);
      const historyRepo = new FakeTicketHistoryRepository();
      const useCase = new UpdateTicketStatusUseCase(ticketRepo, historyRepo);

      const updated = await useCase.execute({ ticketId: ticket.id, newStatus: to, agentId: 'agent-1' });
      expect(updated.status).toBe(to);

      const history = await historyRepo.findByTicketId(ticket.id);
      expect(history).toHaveLength(1);
      expect(history[0].action).toBe(HistoryAction.STATUS_CHANGED);
      expect(history[0].performed_by_agent_id).toBe('agent-1');
    }
  });

  test('Invalid transition -> InvalidStatusTransitionError', async () => {
    const ticket = createTicket({ status: TicketStatus.OPEN });
    const useCase = new UpdateTicketStatusUseCase(
      new FakeTicketRepository([ticket]),
      new FakeTicketHistoryRepository(),
    );

    await expect(
      useCase.execute({ ticketId: ticket.id, newStatus: TicketStatus.CLOSED, agentId: 'agent-1' }),
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
  });

  test('Ticket not found -> NotFoundError', async () => {
    const useCase = new UpdateTicketStatusUseCase(
      new FakeTicketRepository(),
      new FakeTicketHistoryRepository(),
    );

    await expect(
      useCase.execute({ ticketId: 'missing', newStatus: TicketStatus.OPEN, agentId: 'agent-1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('History record has correct previousValue/newValue/performedBy', async () => {
    const ticket = createTicket({ status: TicketStatus.OPEN });
    const ticketRepo = new FakeTicketRepository([ticket]);
    const historyRepo = new FakeTicketHistoryRepository();
    const useCase = new UpdateTicketStatusUseCase(ticketRepo, historyRepo);

    await useCase.execute({ ticketId: ticket.id, newStatus: TicketStatus.IN_PROGRESS, agentId: 'agent-99' });

    const history = await historyRepo.findByTicketId(ticket.id);
    expect(history[0].previous_value).toEqual({ status: TicketStatus.OPEN });
    expect(history[0].new_value).toEqual({ status: TicketStatus.IN_PROGRESS });
    expect(history[0].performed_by_agent_id).toBe('agent-99');
  });
});
