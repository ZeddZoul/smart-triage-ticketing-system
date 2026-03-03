const { NotFoundError, ExternalServiceError } = require('../entities/errors');
const { TicketCategory, TicketPriority, TicketStatus, HistoryAction } = require('../entities/enums');

const VALID_CATEGORIES = new Set(Object.values(TicketCategory));
const VALID_PRIORITIES = new Set(Object.values(TicketPriority));

class TriageTicketUseCase {
  constructor(ticketRepository, ticketHistoryRepository, aiTriageService, options = {}) {
    this.ticketRepository = ticketRepository;
    this.ticketHistoryRepository = ticketHistoryRepository;
    this.aiTriageService = aiTriageService;
    this.maxRetries = options.maxRetries ?? 3;
  }

  async execute(ticketId) {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found', { ticketId });
    }

    try {
      const aiResult = await this.aiTriageService.classifyTicket(ticket.title, ticket.description);
      const category = aiResult?.category;
      const priority = aiResult?.priority;

      if (!VALID_CATEGORIES.has(category) || !VALID_PRIORITIES.has(priority)) {
        throw new ExternalServiceError('AI returned invalid classification', {
          aiResult,
        });
      }

      const nextAttempts = (ticket.triage_attempts ?? 0) + 1;
      const updated = await this.ticketRepository.updateById(ticketId, {
        status: TicketStatus.OPEN,
        category,
        priority,
        triage_attempts: nextAttempts,
      });

      await this.ticketHistoryRepository.create({
        ticket_id: ticketId,
        action: HistoryAction.TRIAGE_COMPLETED,
        performed_by_agent_id: null,
        previous_value: {
          status: ticket.status,
          category: ticket.category ?? null,
          priority: ticket.priority ?? null,
        },
        new_value: {
          status: TicketStatus.OPEN,
          category,
          priority,
        },
      });

      return updated;
    } catch (error) {
      const nextAttempts = (ticket.triage_attempts ?? 0) + 1;
      const exhausted = nextAttempts >= this.maxRetries;

      const failedStatus = exhausted ? TicketStatus.TRIAGE_FAILED : TicketStatus.PENDING_TRIAGE;
      await this.ticketRepository.updateById(ticketId, {
        status: failedStatus,
        triage_attempts: nextAttempts,
      });

      if (exhausted) {
        await this.ticketHistoryRepository.create({
          ticket_id: ticketId,
          action: HistoryAction.TRIAGE_FAILED,
          performed_by_agent_id: null,
          previous_value: { status: ticket.status },
          new_value: { status: TicketStatus.TRIAGE_FAILED, triage_attempts: nextAttempts },
          notes: 'AI triage exhausted max retries',
        });
      }

      throw error;
    }
  }
}

module.exports = TriageTicketUseCase;
