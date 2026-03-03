/**
 * IAITriageService — Abstract Boundary
 *
 * Contract for AI-powered ticket classification.
 * Implemented by: GeminiTriageService (with RetryHandler)
 * Used by: TriageTicketUseCase
 *
 * @see DESIGN.md §4.4 (Interface Contracts)
 * @see DESIGN.md §9 (AI Integration)
 */

class IAITriageService {
  /**
   * Classify a ticket by invoking the AI model with title and description.
   * Returns structured classification result.
   *
   * Retry strategy is handled internally (RetryHandler):
   *   - Exponential backoff: 1s → 2s → 4s
   *   - Max 3 attempts
   *   - Throws ExternalServiceError on final failure
   *
   * @param {string} title - Ticket title (constraint: 1-200 chars)
   * @param {string} description - Ticket description (constraint: 1-5000 chars)
   *
   * @returns {Promise<object>} - { category: string, priority: string }
   *   where category ∈ {Billing, Technical Bug, Feature Request}
   *   and priority ∈ {Low, Medium, High}
   *
   * @throws {ExternalServiceError} - On API failure after retries, timeout, or
   *         unparseable response. Caller should handle gracefully (set status to triage_failed).
   * @throws {ValidationError} - On invalid input parameters
   */
  async classifyTicket(title, description) {
    throw new Error('Method not implemented: IAITriageService.classifyTicket()');
  }
}

module.exports = IAITriageService;
