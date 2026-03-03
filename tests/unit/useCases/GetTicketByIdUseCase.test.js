const GetTicketByIdUseCase = require('../../../src/useCases/GetTicketByIdUseCase');
const FakeTicketRepository = require('../../helpers/fakeTicketRepository');
const { createTicket } = require('../../helpers/testFactory');
const { NotFoundError } = require('../../../src/entities/errors');

describe('GetTicketByIdUseCase', () => {
  test('Found -> returns ticket', async () => {
    const existing = createTicket();
    const useCase = new GetTicketByIdUseCase(new FakeTicketRepository([existing]));

    const result = await useCase.execute(existing.id);
    expect(result.id).toBe(existing.id);
  });

  test('Not found -> NotFoundError', async () => {
    const useCase = new GetTicketByIdUseCase(new FakeTicketRepository());
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});
