/**
 * Ticket Entity — Ticket.js
 *
 * Domain model representing a customer support ticket.
 * Pure business logic: validation, state transitions, triage eligibility.
 * Zero external dependencies (entities layer).
 *
 * @see DESIGN.md §2 (Entities layer)
 * @see SPEC.md §6 (Domain Model)
 */

const { ValidationError, InvalidStatusTransitionError } = require('./errors');
const { TicketStatus, TicketCategory, TicketPriority, VALID_TRANSITIONS } = require('./enums');

class Ticket {
  /**
   * Create a Ticket entity.
   *
   * @param {object} data - Ticket data
   * @param {string} data.id - Unique ticket ID (ObjectId string)
   * @param {string} data.title - Ticket title (1-200 chars)
   * @param {string} data.description - Ticket description (1-5000 chars)
   * @param {string} data.customer_email - Customer email
   * @param {string} data.status - Current status (from TicketStatus enum)
   * @param {string|null} data.category - AI-assigned category (from TicketCategory enum or null)
   * @param {string|null} data.priority - AI-assigned priority (from TicketPriority enum or null)
   * @param {number} data.triage_attempts - Number of AI triage attempts (default: 0)
   * @param {Date} data.created_at - Ticket creation timestamp
   * @param {Date} data.updated_at - Last update timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.customer_email = data.customer_email;
    this.status = data.status;
    this.category = data.category || null;
    this.priority = data.priority || null;
    this.triage_attempts = data.triage_attempts || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Validate ticket fields against domain constraints.
   * Throws ValidationError if any constraint is violated.
   *
   * Constraints:
   *   - title: 1-200 characters, required, non-whitespace
   *   - description: 1-5000 characters, required, non-whitespace
   *   - customer_email: valid email format, required
   *   - status: must be a valid TicketStatus
   *   - category: must be null or valid TicketCategory
   *   - priority: must be null or valid TicketPriority
   *   - triage_attempts: non-negative integer
   *   - created_at / updated_at: valid Date objects
   */
  validate() {
    const errors = [];

    // Title validation
    if (!this.title || typeof this.title !== 'string') {
      errors.push('title is required and must be a string');
    } else if (this.title.trim().length === 0) {
      errors.push('title cannot be empty or whitespace');
    } else if (this.title.length < 1 || this.title.length > 200) {
      errors.push('title must be between 1 and 200 characters');
    }

    // Description validation
    if (!this.description || typeof this.description !== 'string') {
      errors.push('description is required and must be a string');
    } else if (this.description.trim().length === 0) {
      errors.push('description cannot be empty or whitespace');
    } else if (this.description.length < 1 || this.description.length > 5000) {
      errors.push('description must be between 1 and 5000 characters');
    }

    // Email validation (basic)
    if (!this.customer_email || !this.customer_email.includes('@')) {
      errors.push('customer_email is required and must be a valid email');
    }

    // Status validation
    const validStatuses = Object.values(TicketStatus);
    if (!validStatuses.includes(this.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }

    // Category validation (nullable, free-form string)
    if (this.category !== null) {
      if (typeof this.category !== 'string' || this.category.trim().length === 0) {
        errors.push('category must be a non-empty string or null');
      }
    }

    // Priority validation (nullable, free-form string)
    if (this.priority !== null) {
      if (typeof this.priority !== 'string' || this.priority.trim().length === 0) {
        errors.push('priority must be a non-empty string or null');
      }
    }

    // Triage attempts validation
    if (!Number.isInteger(this.triage_attempts) || this.triage_attempts < 0) {
      errors.push('triage_attempts must be a non-negative integer');
    }

    // Timestamps validation
    if (!(this.created_at instanceof Date)) {
      errors.push('created_at must be a valid Date');
    }
    if (!(this.updated_at instanceof Date)) {
      errors.push('updated_at must be a valid Date');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Ticket validation failed: ${errors.join('; ')}`, {
        errors,
      });
    }
  }

  /**
   * Check if a transition from current status to a new status is allowed.
   *
   * @param {string} newStatus - Target status
   * @returns {boolean} true if transition is allowed, false otherwise
   */
  canTransitionTo(newStatus) {
    const allowed = VALID_TRANSITIONS[this.status] || [];
    return allowed.includes(newStatus);
  }

  /**
   * Attempt to transition to a new status.
   * Throws InvalidStatusTransitionError if transition is not allowed.
   *
   * @param {string} newStatus - Target status
   */
  transitionTo(newStatus) {
    if (!this.canTransitionTo(newStatus)) {
      const allowed = VALID_TRANSITIONS[this.status] || [];
      throw new InvalidStatusTransitionError(
        `Cannot transition from ${this.status} to ${newStatus}. ` +
        `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`,
        {
          currentStatus: this.status,
          attemptedStatus: newStatus,
          allowedTransitions: allowed,
        },
      );
    }
    this.status = newStatus;
    this.updated_at = new Date();
  }

  /**
   * Check if this ticket is eligible for AI triage.
   * Only tickets in pending_triage or triage_failed status are triageable.
   *
   * @returns {boolean}
   */
  isTriageable() {
    return (
      this.status === TicketStatus.PENDING_TRIAGE ||
      this.status === TicketStatus.TRIAGE_FAILED
    );
  }

  /**
   * Convert entity to plain object (for responses, logging).
   *
   * @returns {object}
   */
  toObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      customer_email: this.customer_email,
      status: this.status,
      category: this.category,
      priority: this.priority,
      triage_attempts: this.triage_attempts,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Ticket;
