const { TicketStatus, HistoryAction } = require('../entities/enums');

class CreateTicketUseCase {
  constructor(ticketRepository, ticketHistoryRepository, triageTicketUseCase) {
    this.ticketRepository = ticketRepository;
    this.ticketHistoryRepository = ticketHistoryRepository;
    this.triageTicketUseCase = triageTicketUseCase;
  }

  async execute(input) {
    const ticket = await this.ticketRepository.create({
      title: input.title,
      description: input.description,
      customer_email: input.customer_email,
      status: TicketStatus.PENDING_TRIAGE,
      category: null,
      priority: null,
      triage_attempts: 0,
    });

    await this.ticketHistoryRepository.create({
      ticket_id: ticket.id,
      action: HistoryAction.CREATED,
      performed_by_agent_id: null,
      previous_value: null,
      new_value: { status: TicketStatus.PENDING_TRIAGE },
    });

    try {
      return await this.triageTicketUseCase.execute(ticket.id);
    } catch (_error) {
      return ticket;
    }
  }
}

module.exports = CreateTicketUseCase;
