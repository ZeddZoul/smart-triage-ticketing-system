/**
 * IAgentRepository — Abstract Boundary
 *
 * Contract for agent persistence operations.
 * Implemented by: MongoAgentRepository
 * Used by: RegisterAgentUseCase, LoginAgentUseCase
 *
 * @see DESIGN.md §4.2 (Interface Contracts)
 */

class IAgentRepository {
  /**
   * Create a new agent in the repository.
   *
   * @param {object} agentData - Validated agent data
   * @param {string} agentData.email - Unique email
   * @param {string} agentData.password_hash - bcrypt hash
   * @param {string} agentData.name - Agent full name
   * @param {string} agentData.role - Agent role (default 'agent')
   *
   * @returns {Promise<object>} - Created agent (without password_hash) with id, created_at, updated_at
   * @throws {Error} - On duplicate email (ConflictError) or database error
   */
  async create(agentData) {
    throw new Error('Method not implemented: IAgentRepository.create()');
  }

  /**
   * Find an agent by email.
   *
   * @param {string} email - Agent email (case-sensitive, unique)
   * @returns {Promise<object|null>} - Agent object (with password_hash for login flow) or null if not found
   * @throws {Error} - On database error
   */
  async findByEmail(email) {
    throw new Error('Method not implemented: IAgentRepository.findByEmail()');
  }

  /**
   * Find an agent by ID.
   *
   * @param {string} id - ObjectId string
   * @returns {Promise<object|null>} - Agent object (without password_hash) or null if not found
   * @throws {Error} - On invalid ID format or database error
   */
  async findById(id) {
    throw new Error('Method not implemented: IAgentRepository.findById()');
  }
}

module.exports = IAgentRepository;
