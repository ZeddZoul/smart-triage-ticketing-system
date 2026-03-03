/**
 * TicketHistory Entity — TicketHistory.js
 *
 * Domain model representing an audit trail entry for a ticket.
 * Immutable: once created, history records are never modified.
 * Pure business logic: validation only.
 * Zero external dependencies (entities layer).
 *
 * @see DESIGN.md §2 (Entities layer)
 * @see SPEC.md §6 (Audit Trail)
 */

const { ValidationError } = require('./errors');
const { HistoryAction, TicketStatus } = require('./enums');

class TicketHistory {
  /**
   * Create a TicketHistory entity.
   *
   * @param {object} data - History record data
   * @param {string} data.id - Unique record ID (ObjectId string)
   * @param {string} data.ticket_id - ID of the ticket this history belongs to
   * @param {string} data.action - Action type (from HistoryAction enum)
   * @param {string|null} data.performed_by_agent_id - ID of agent who performed action (null for system actions)
   * @param {object|null} data.previous_value - Previous state (before action), nullable
   * @param {object|null} data.new_value - New state (after action), nullable
   * @param {string|null} data.notes - Optional notes about the action
   * @param {Date} data.created_at - When this action was recorded
   */
  constructor(data) {
    this.id = data.id;
    this.ticket_id = data.ticket_id;
    this.action = data.action;
    this.performed_by_agent_id = data.performed_by_agent_id || null;
    this.previous_value = data.previous_value || null;
    this.new_value = data.new_value || null;
    this.notes = data.notes || null;
    this.created_at = data.created_at;
  }

  /**
   * Validate history record fields against domain constraints.
   * Throws ValidationError if any constraint is violated.
   *
   * Constraints:
   *   - ticket_id: non-empty string, required
   *   - action: must be a valid HistoryAction
   *   - performed_by_agent_id: string (agent ID) or null (for system actions)
   *   - previous_value: object or null
   *   - new_value: object or null
   *   - notes: string or null (if present, max 500 chars)
   *   - created_at: valid Date object
   */
  validate() {
    const errors = [];

    // Ticket ID validation
    if (!this.ticket_id || typeof this.ticket_id !== 'string') {
      errors.push('ticket_id is required and must be a string');
    }

    // Action validation
    const validActions = Object.values(HistoryAction);
    if (!validActions.includes(this.action)) {
      errors.push(`action must be one of: ${validActions.join(', ')}`);
    }

    // Performed by agent ID validation (nullable)
    if (this.performed_by_agent_id !== null) {
      if (
        typeof this.performed_by_agent_id !== 'string' ||
        this.performed_by_agent_id.trim() === ''
      ) {
        errors.push('performed_by_agent_id must be a non-empty string or null');
      }
    }

    // Previous value validation (should be object or null)
    if (this.previous_value !== null && typeof this.previous_value !== 'object') {
      errors.push('previous_value must be an object or null');
    }

    // New value validation (should be object or null)
    if (this.new_value !== null && typeof this.new_value !== 'object') {
      errors.push('new_value must be an object or null');
    }

    // Notes validation (nullable, max 500 chars)
    if (this.notes !== null) {
      if (typeof this.notes !== 'string') {
        errors.push('notes must be a string or null');
      } else if (this.notes.length > 500) {
        errors.push('notes must not exceed 500 characters');
      }
    }

    // Timestamp validation
    if (!(this.created_at instanceof Date)) {
      errors.push('created_at must be a valid Date');
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `TicketHistory validation failed: ${errors.join('; ')}`,
        {
          errors,
        },
      );
    }
  }

  /**
   * Convert entity to plain object (for responses, logging).
   *
   * @returns {object}
   */
  toObject() {
    return {
      id: this.id,
      ticket_id: this.ticket_id,
      action: this.action,
      performed_by_agent_id: this.performed_by_agent_id,
      previous_value: this.previous_value,
      new_value: this.new_value,
      notes: this.notes,
      created_at: this.created_at,
    };
  }

  /**
   * Create a 'created' action history entry (for new ticket creation).
   * Static factory method for convenience.
   *
   * @param {object} params
   * @param {string} params.id - Unique record ID
   * @param {string} params.ticket_id - Ticket ID
   * @param {object} params.new_ticket - The created ticket data
   * @returns {TicketHistory}
   */
  static created({ id, ticket_id, new_ticket }) {
    return new TicketHistory({
      id,
      ticket_id,
      action: HistoryAction.CREATED,
      performed_by_agent_id: null, // Customer action
      previous_value: null,
      new_value: new_ticket,
      notes: 'Ticket created by customer',
      created_at: new Date(),
    });
  }

  /**
   * Create a 'triage_completed' action history entry.
   * Static factory method for convenience.
   *
   * @param {object} params
   * @param {string} params.id - Unique record ID
   * @param {string} params.ticket_id - Ticket ID
   * @param {object} params.previous_state - State before triage
   * @param {object} params.new_state - State after triage
   * @returns {TicketHistory}
   */
  static triageCompleted({ id, ticket_id, previous_state, new_state }) {
    return new TicketHistory({
      id,
      ticket_id,
      action: HistoryAction.TRIAGE_COMPLETED,
      performed_by_agent_id: null, // System action
      previous_value: previous_state,
      new_value: new_state,
      notes: `Triage completed: category=${new_state.category}, priority=${new_state.priority}`,
      created_at: new Date(),
    });
  }

  /**
   * Create a 'triage_failed' action history entry.
   * Static factory method for convenience.
   *
   * @param {object} params
   * @param {string} params.id - Unique record ID
   * @param {string} params.ticket_id - Ticket ID
   * @param {number} params.attempt_count - Number of failed attempts
   * @returns {TicketHistory}
   */
  static triageFailed({ id, ticket_id, attempt_count }) {
    return new TicketHistory({
      id,
      ticket_id,
      action: HistoryAction.TRIAGE_FAILED,
      performed_by_agent_id: null, // System action
      previous_value: null,
      new_value: null,
      notes: `Triage failed after ${attempt_count} attempts. Ticket entered triage_failed state.`,
      created_at: new Date(),
    });
  }

  /**
   * Create a 'status_changed' action history entry.
   * Static factory method for convenience.
   *
   * @param {object} params
   * @param {string} params.id - Unique record ID
   * @param {string} params.ticket_id - Ticket ID
   * @param {string} params.agent_id - Agent who made the change
   * @param {string} params.previous_status - Old status
   * @param {string} params.new_status - New status
   * @returns {TicketHistory}
   */
  static statusChanged({ id, ticket_id, agent_id, previous_status, new_status }) {
    return new TicketHistory({
      id,
      ticket_id,
      action: HistoryAction.STATUS_CHANGED,
      performed_by_agent_id: agent_id,
      previous_value: { status: previous_status },
      new_value: { status: new_status },
      notes: `Status changed by agent: ${previous_status} → ${new_status}`,
      created_at: new Date(),
    });
  }
}

module.exports = TicketHistory;
