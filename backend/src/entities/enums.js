/**
 * Domain Enumerations — enums.js
 *
 * Centralized definitions of all domain constants:
 * - Ticket statuses and valid transitions
 * - Ticket categories and priorities
 * - Agent roles
 * - History action types
 *
 * @see DESIGN.md §2 (Entities layer)
 * @see SPEC.md §6 (Domain Model & State Machine)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Ticket Status Enum
// ─────────────────────────────────────────────────────────────────────────────

const TicketStatus = Object.freeze({
  PENDING_TRIAGE: 'pending_triage',
  TRIAGE_FAILED: 'triage_failed',
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
});

// ─────────────────────────────────────────────────────────────────────────────
// Ticket Category — Common Values (AI-inferred, free-form strings)
// The AI may return these or any other descriptive category it deems appropriate.
// ─────────────────────────────────────────────────────────────────────────────

const TicketCategory = Object.freeze({
  BILLING: 'Billing',
  TECHNICAL_BUG: 'Technical Bug',
  FEATURE_REQUEST: 'Feature Request',
  ACCOUNT_ACCESS: 'Account Access',
  GENERAL_INQUIRY: 'General Inquiry',
});

// ─────────────────────────────────────────────────────────────────────────────
// Ticket Priority — Common Values (AI-inferred, free-form strings)
// The AI may return these or other priority levels it deems appropriate.
// ─────────────────────────────────────────────────────────────────────────────

const TicketPriority = Object.freeze({
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
});

// ─────────────────────────────────────────────────────────────────────────────
// Agent Role Enum
// ─────────────────────────────────────────────────────────────────────────────

const AgentRole = Object.freeze({
  AGENT: 'agent',
  ADMIN: 'admin',
  READ_ONLY: 'read_only',
});

// ─────────────────────────────────────────────────────────────────────────────
// History Action Enum (audit trail)
// ─────────────────────────────────────────────────────────────────────────────

const HistoryAction = Object.freeze({
  CREATED: 'created',
  TRIAGE_STARTED: 'triage_started',
  TRIAGE_COMPLETED: 'triage_completed',
  TRIAGE_FAILED: 'triage_failed',
  STATUS_CHANGED: 'status_changed',
});

// ─────────────────────────────────────────────────────────────────────────────
// Valid Status Transitions (State Machine)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Defines which status transitions are permitted.
 *
 * State Machine (from SPEC.md §6):
 *   pending_triage  ─┬→ Open (AI succeeded)
 *                    └→ triage_failed (AI exhausted retries)
 *
 *   triage_failed  → Open (agent can reopen after manual triage)
 *
 *   Open           → In Progress (agent starts work)
 *               or → Resolved (agent completes)
 *
 *   In Progress    → Open (agent needs clarification)
 *               or → Resolved (agent completes)
 *
 *   Resolved       → Open (customer appeals / incorrect resolution)
 *
 *   Closed         (terminal state, no transitions)
 */
const VALID_TRANSITIONS = Object.freeze({
  [TicketStatus.PENDING_TRIAGE]: [TicketStatus.OPEN],
  [TicketStatus.TRIAGE_FAILED]: [TicketStatus.OPEN],
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.OPEN, TicketStatus.RESOLVED],
  [TicketStatus.RESOLVED]: [TicketStatus.OPEN, TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [], // Terminal state
});

module.exports = {
  TicketStatus,
  TicketCategory,
  TicketPriority,
  AgentRole,
  HistoryAction,
  VALID_TRANSITIONS,
};
