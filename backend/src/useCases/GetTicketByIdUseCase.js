const { NotFoundError } = require('../entities/errors');

class GetTicketByIdUseCase {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(ticketId) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found', { ticketId });
    }
    return ticket;
  }
}

module.exports = GetTicketByIdUseCase;
