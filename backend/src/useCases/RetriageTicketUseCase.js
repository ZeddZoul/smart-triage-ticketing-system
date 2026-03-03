const { NotFoundError, ValidationError } = require('../entities/errors');
const { TicketStatus, HistoryAction } = require('../entities/enums');

const RETRIAGEABLE_STATUSES = new Set([
  TicketStatus.PENDING_TRIAGE,
  TicketStatus.TRIAGE_FAILED,
]);

class RetriageTicketUseCase {
  constructor(ticketRepository, ticketHistoryRepository, triageTicketUseCase) {
    this.ticketRepository = ticketRepository;
    this.ticketHistoryRepository = ticketHistoryRepository;
    this.triageTicketUseCase = triageTicketUseCase;
  }

  async execute({ ticketId, agentId }) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found', { ticketId });
    }

    if (!RETRIAGEABLE_STATUSES.has(ticket.status)) {
      throw new ValidationError(
        `Cannot retriage a ticket with status "${ticket.status}". Only pending_triage or triage_failed tickets can be retriaged.`,
        { ticketId, currentStatus: ticket.status }
      );
    }

    // Reset triage_attempts so TriageTicketUseCase gets a fresh set of retries
    await this.ticketRepository.updateById(ticketId, {
      status: TicketStatus.PENDING_TRIAGE,
      triage_attempts: 0,
    });

    await this.ticketHistoryRepository.create({
      ticket_id: ticketId,
      action: HistoryAction.TRIAGE_STARTED,
      performed_by_agent_id: agentId,
      previous_value: { status: ticket.status, triage_attempts: ticket.triage_attempts },
      new_value: { status: TicketStatus.PENDING_TRIAGE, triage_attempts: 0 },
      notes: 'Agent-initiated retriage',
    });

    try {
      return await this.triageTicketUseCase.execute(ticketId);
    } catch (_error) {
      // If triage fails again, return the ticket in its current state
      const current = await this.ticketRepository.findById(ticketId);
      return current;
    }
  }
}

module.exports = RetriageTicketUseCase;
