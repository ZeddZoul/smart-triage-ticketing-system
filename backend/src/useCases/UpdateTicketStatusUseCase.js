const { NotFoundError, InvalidStatusTransitionError } = require('../entities/errors');
const { VALID_TRANSITIONS, HistoryAction } = require('../entities/enums');

class UpdateTicketStatusUseCase {
  constructor(ticketRepository, ticketHistoryRepository) {
    this.ticketRepository = ticketRepository;
    this.ticketHistoryRepository = ticketHistoryRepository;
  }

  async execute({ ticketId, newStatus, agentId }) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found', { ticketId });
    }

    const allowed = VALID_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new InvalidStatusTransitionError('Invalid ticket status transition', {
        from: ticket.status,
        to: newStatus,
        allowed,
      });
    }

    const updated = await this.ticketRepository.updateById(ticketId, {
      status: newStatus,
    });

    await this.ticketHistoryRepository.create({
      ticket_id: ticketId,
      action: HistoryAction.STATUS_CHANGED,
      performed_by_agent_id: agentId,
      previous_value: { status: ticket.status },
      new_value: { status: newStatus },
    });

    return updated;
  }
}

module.exports = UpdateTicketStatusUseCase;
