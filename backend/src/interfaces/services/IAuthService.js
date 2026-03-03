/**
 * IAuthService — Abstract Boundary
 *
 * Contract for authentication and authorization operations.
 * Implemented by: JwtAuthService
 * Used by: RegisterAgentUseCase, LoginAgentUseCase, authMiddleware
 *
 * @see DESIGN.md §4.5 (Interface Contracts)
 * @see REQUIREMENTS.md §5.1 (Auth Configuration)
 */

class IAuthService {
  /**
   * Hash a plaintext password using bcryptjs (configured salt rounds).
   *
   * @param {string} plaintext - The password to hash (constraint: 8-100 chars, validated upstream)
   * @returns {Promise<string>} - bcryptjs hash string
   * @throws {Error} - On hashing failure
   */
  async hashPassword(plaintext) {
    throw new Error('Method not implemented: IAuthService.hashPassword()');
  }

  /**
   * Compare a plaintext password against a bcryptjs hash.
   *
   * @param {string} plaintext - The password to check
   * @param {string} hash - The bcryptjs hash to compare against
   * @returns {Promise<boolean>} - true if match, false otherwise
   * @throws {Error} - On comparison failure
   */
  async comparePassword(plaintext, hash) {
    throw new Error('Method not implemented: IAuthService.comparePassword()');
  }

  /**
   * Generate a signed JWT token for an authenticated agent.
   *
   * @param {object} payload - Token payload
   * @param {string} payload.agentId - Agent ID (MongoDB ObjectId string)
   * @param {string} payload.email - Agent email
   * @param {string} payload.role - Agent role (agent|admin|read_only)
   *
   * @returns {Promise<string>} - Signed JWT token string (HS256 algorithm)
   * @throws {Error} - On signing failure
   */
  async generateToken(payload) {
    throw new Error('Method not implemented: IAuthService.generateToken()');
  }

  /**
   * Verify and decode a JWT token.
   *
   * @param {string} token - The JWT token string to verify
   * @returns {Promise<object>} - Decoded payload { agentId, email, role }
   * @throws {TokenExpiredError} - On expired token (throw with specific error type)
   * @throws {UnauthorizedError} - On invalid or tampered token
   */
  async verifyToken(token) {
    throw new Error('Method not implemented: IAuthService.verifyToken()');
  }
}

module.exports = IAuthService;
