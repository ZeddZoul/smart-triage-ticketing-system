const { NotFoundError } = require('../entities/errors');

class GetTicketHistoryUseCase {
  constructor(ticketRepository, ticketHistoryRepository) {
    this.ticketRepository = ticketRepository;
    this.ticketHistoryRepository = ticketHistoryRepository;
  }

  async execute(ticketId) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found', { ticketId });
    }

    const history = await this.ticketHistoryRepository.findByTicketId(ticketId);
    return history;
  }
}

module.exports = GetTicketHistoryUseCase;
