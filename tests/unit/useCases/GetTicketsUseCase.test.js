const GetTicketsUseCase = require('../../../src/useCases/GetTicketsUseCase');
const FakeTicketRepository = require('../../helpers/fakeTicketRepository');
const { createTicket } = require('../../helpers/testFactory');
const { TicketStatus, TicketPriority, TicketCategory } = require('../../../src/entities/enums');

describe('GetTicketsUseCase', () => {
  test('Default pagination (page 1, limit 10)', async () => {
    const repo = new FakeTicketRepository(Array.from({ length: 12 }, () => createTicket()));
    const useCase = new GetTicketsUseCase(repo);

    const result = await useCase.execute({});

    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.data.length).toBe(10);
    expect(result.pagination.total).toBe(12);
  });

  test('Filters by status, priority, category (and combined)', async () => {
    const repo = new FakeTicketRepository([
      createTicket({ status: TicketStatus.OPEN, priority: TicketPriority.HIGH, category: TicketCategory.BILLING }),
      createTicket({ status: TicketStatus.RESOLVED, priority: TicketPriority.LOW, category: TicketCategory.FEATURE_REQUEST }),
      createTicket({ status: TicketStatus.OPEN, priority: TicketPriority.HIGH, category: TicketCategory.BILLING }),
    ]);
    const useCase = new GetTicketsUseCase(repo);

    const byStatus = await useCase.execute({ status: TicketStatus.OPEN });
    expect(byStatus.data).toHaveLength(2);

    const byPriority = await useCase.execute({ priority: TicketPriority.LOW });
    expect(byPriority.data).toHaveLength(1);

    const byCategory = await useCase.execute({ category: TicketCategory.BILLING });
    expect(byCategory.data).toHaveLength(2);

    const combined = await useCase.execute({
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      category: TicketCategory.BILLING,
    });
    expect(combined.data).toHaveLength(2);
  });

  test('Limit clamped to 100', async () => {
    const repo = new FakeTicketRepository(Array.from({ length: 150 }, () => createTicket()));
    const useCase = new GetTicketsUseCase(repo);

    const result = await useCase.execute({ limit: 500 });
    expect(result.pagination.limit).toBe(100);
    expect(result.data.length).toBe(100);
  });

  test('Empty results return empty array with correct pagination metadata', async () => {
    const repo = new FakeTicketRepository([]);
    const useCase = new GetTicketsUseCase(repo);

    const result = await useCase.execute({ status: TicketStatus.CLOSED });
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(1);
  });
});
