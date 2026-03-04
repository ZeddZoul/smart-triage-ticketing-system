/**
 * ITicketRepository — Abstract Boundary
 *
 * Contract for ticket persistence operations.
 * Implemented by: MongoTicketRepository (src/infrastructure/database/repositories/)
 * Used by: All ticket-related use cases
 *
 * @see DESIGN.md §4.1 (Interface Contracts)
 */

class ITicketRepository {
  /**
   * Create a new ticket in the repository.
   *
   * @param {object} ticketData - Validated ticket data
   * @param {string} ticketData.title
   * @param {string} ticketData.description
   * @param {string} ticketData.customer_email
   * @param {string} ticketData.status - Initial status (usually 'pending_triage')
   * @param {string|null} ticketData.category - AI category (or null)
   * @param {string|null} ticketData.priority - AI priority (or null)
   * @param {number} ticketData.triage_attempts - Initial count (default 0)
   *
   * @returns {Promise<object>} - Created ticket with id, created_at, updated_at
   * @throws {Error} - On database error
   */
  async create(ticketData) {
    throw new Error('Method not implemented: ITicketRepository.create()');
  }

  /**
   * Find a ticket by ID.
   *
   * @param {string} id - ObjectId string
   * @returns {Promise<object|null>} - Ticket object or null if not found
   * @throws {Error} - On invalid ID format or database error
   */
  async findById(id) {
    throw new Error('Method not implemented: ITicketRepository.findById()');
  }

  /**
   * Find all tickets with optional filtering, pagination, and sorting.
   *
   * @param {object} filters - Optional filters
   * @param {string} filters.status - Filter by status
   * @param {string} filters.priority - Filter by priority
   * @param {string} filters.category - Filter by category
   *
   * @param {object} pagination
   * @param {number} pagination.page - 1-indexed page number (default 1)
   * @param {number} pagination.limit - Records per page (default 10, max 100)
   *
   * @param {object} sort
   * @param {string} sort.sortBy - Field to sort by (default 'created_at')
   * @param {string} sort.sortOrder - 'asc' or 'desc' (default 'desc')
   *
   * @returns {Promise<object>} - { data: Ticket[], total: number, page: number, limit: number }
   * @throws {Error} - On database error
   */
  async findAll(filters = {}, pagination = {}, sort = {}) {
    throw new Error('Method not implemented: ITicketRepository.findAll()');
  }

  /**
   * Update a ticket by ID.
   *
   * @param {string} id - ObjectId string
   * @param {object} updateData - Fields to update
   * @param {string} updateData.status - New status
   * @param {string} updateData.category - New category
   * @param {string} updateData.priority - New priority
   * @param {number} updateData.triage_attempts - New triage attempt count
   *
   * @returns {Promise<object|null>} - Updated ticket or null if not found
   * @throws {Error} - On invalid ID format or database error
   */
  async updateById(id, updateData) {
    throw new Error('Method not implemented: ITicketRepository.updateById()');
  }

  /**
   * Find all tickets with a specific status (for retry queue, triage backlog, etc.).
   *
   * @param {string} status - The status to filter by
   * @returns {Promise<Array>} - Array of tickets matching status
   * @throws {Error} - On database error
   */
  async findByStatus(status) {
    throw new Error('Method not implemented: ITicketRepository.findByStatus()');
  }

  /**
   * Get distinct (unique) values for category and priority across all tickets.
   *
   * @returns {Promise<{ categories: string[], priorities: string[] }>}
   * @throws {Error} - On database error
   */
  async getDistinctFacets() {
    throw new Error('Method not implemented: ITicketRepository.getDistinctFacets()');
  }
}

module.exports = ITicketRepository;
