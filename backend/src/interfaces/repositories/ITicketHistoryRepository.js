/**
 * ITicketHistoryRepository — Abstract Boundary
 *
 * Contract for audit trail persistence operations.
 * Implemented by: MongoTicketHistoryRepository
 * Used by: CreateTicketUseCase, TriageTicketUseCase, UpdateTicketStatusUseCase
 *
 * @see DESIGN.md §4.3 (Interface Contracts)
 */

class ITicketHistoryRepository {
  /**
   * Create a new history record in the repository.
   * History records are immutable once created (append-only log).
   *
   * @param {object} historyData - Validated history record data
   * @param {string} historyData.ticket_id - The ticket this record belongs to
   * @param {string} historyData.action - HistoryAction enum value
   * @param {string|null} historyData.performed_by_agent_id - Agent who performed action, or null for system
   * @param {object|null} historyData.previous_value - State before action
   * @param {object|null} historyData.new_value - State after action
   * @param {string|null} historyData.notes - Optional notes about the action
   *
   * @returns {Promise<object>} - Created history record with id, created_at
   * @throws {Error} - On database error
   */
  async create(historyData) {
    throw new Error('Method not implemented: ITicketHistoryRepository.create()');
  }

  /**
   * Find all history records for a ticket, sorted by creation time (ascending).
   * Returns the complete audit trail for a ticket.
   *
   * @param {string} ticketId - The ticket ID to retrieve history for
   * @returns {Promise<Array>} - Array of history records sorted by created_at ascending
   * @throws {Error} - On invalid ticket ID or database error
   */
  async findByTicketId(ticketId) {
    throw new Error('Method not implemented: ITicketHistoryRepository.findByTicketId()');
  }
}

module.exports = ITicketHistoryRepository;
