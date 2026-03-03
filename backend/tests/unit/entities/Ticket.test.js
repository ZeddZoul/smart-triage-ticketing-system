/**
 * Ticket Entity Tests — Ticket.test.js
 *
 * Comprehensive tests for Ticket domain model:
 *   - Field validation
 *   - Status transitions
 *   - Triage eligibility
 *   - Edge cases
 *
 * @see src/entities/Ticket.js
 * @see DESIGN.md §14 (Test Strategy)
 */

const Ticket = require('../../../src/entities/Ticket');
const { ValidationError, InvalidStatusTransitionError } = require('../../../src/entities/errors');
const { TicketStatus, TicketCategory, TicketPriority } = require('../../../src/entities/enums');

describe('Ticket Entity', () => {
  const validTicketData = {
    id: '507f1f77bcf86cd799439011',
    title: 'Login button not working',
    description: 'The login button on the homepage does not respond to clicks.',
    customer_email: 'user@example.com',
    status: TicketStatus.OPEN,
    category: TicketCategory.TECHNICAL_BUG,
    priority: TicketPriority.HIGH,
    triage_attempts: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('Constructor', () => {
    test('creates a valid ticket with all fields', () => {
      const ticket = new Ticket(validTicketData);
      expect(ticket.id).toBe(validTicketData.id);
      expect(ticket.title).toBe(validTicketData.title);
      expect(ticket.status).toBe(TicketStatus.OPEN);
      expect(ticket.category).toBe(TicketCategory.TECHNICAL_BUG);
    });

    test('initializes nullable fields to null when not provided', () => {
      const data = { ...validTicketData, category: undefined, priority: undefined };
      const ticket = new Ticket(data);
      expect(ticket.category).toBeNull();
      expect(ticket.priority).toBeNull();
    });

    test('defaults triage_attempts to 0', () => {
      const data = { ...validTicketData };
      delete data.triage_attempts;
      const ticket = new Ticket(data);
      expect(ticket.triage_attempts).toBe(0);
    });
  });

  describe('validate()', () => {
    test('passes validation for valid ticket', () => {
      const ticket = new Ticket(validTicketData);
      expect(() => ticket.validate()).not.toThrow();
    });

    test('throws ValidationError when title is missing', () => {
      const data = { ...validTicketData, title: undefined };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/title is required/);
    });

    test('throws ValidationError when title is whitespace', () => {
      const data = { ...validTicketData, title: '   ' };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/title cannot be empty or whitespace/);
    });

    test('throws ValidationError when title exceeds 200 characters', () => {
      const data = { ...validTicketData, title: 'x'.repeat(201) };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/must be between 1 and 200 characters/);
    });

    test('throws ValidationError when description is missing', () => {
      const data = { ...validTicketData, description: undefined };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/description is required/);
    });

    test('throws ValidationError when description exceeds 5000 characters', () => {
      const data = { ...validTicketData, description: 'x'.repeat(5001) };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/must be between 1 and 5000 characters/);
    });

    test('throws ValidationError when email is invalid', () => {
      const data = { ...validTicketData, customer_email: 'not-an-email' };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/customer_email.*valid email/);
    });

    test('throws ValidationError when status is invalid', () => {
      const data = { ...validTicketData, status: 'INVALID_STATUS' };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/status must be one of/);
    });

    test('throws ValidationError when category is invalid (non-null)', () => {
      const data = { ...validTicketData, category: 'INVALID_CATEGORY' };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/category must be one of/);
    });

    test('passes validation when category is null', () => {
      const data = { ...validTicketData, category: null };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).not.toThrow();
    });

    test('throws ValidationError when priority is invalid (non-null)', () => {
      const data = { ...validTicketData, priority: 'URGENT' };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/priority must be one of/);
    });

    test('throws ValidationError when triage_attempts is negative', () => {
      const data = { ...validTicketData, triage_attempts: -1 };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/triage_attempts must be a non-negative integer/);
    });

    test('throws ValidationError when created_at is not a Date', () => {
      const data = { ...validTicketData, created_at: '2026-03-03' };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/created_at must be a valid Date/);
    });

    test('throws ValidationError when updated_at is not a Date', () => {
      const data = { ...validTicketData, updated_at: null };
      const ticket = new Ticket(data);
      expect(() => ticket.validate()).toThrow(ValidationError);
      expect(() => ticket.validate()).toThrow(/updated_at must be a valid Date/);
    });
  });

  describe('canTransitionTo()', () => {
    test('allows Open → In Progress', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.OPEN });
      expect(ticket.canTransitionTo(TicketStatus.IN_PROGRESS)).toBe(true);
    });

    test('allows Open → Resolved', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.OPEN });
      expect(ticket.canTransitionTo(TicketStatus.RESOLVED)).toBe(true);
    });

    test('disallows Open → Closed (invalid transition)', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.OPEN });
      expect(ticket.canTransitionTo(TicketStatus.CLOSED)).toBe(false);
    });

    test('allows In Progress → Open', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.IN_PROGRESS });
      expect(ticket.canTransitionTo(TicketStatus.OPEN)).toBe(true);
    });

    test('allows In Progress → Resolved', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.IN_PROGRESS });
      expect(ticket.canTransitionTo(TicketStatus.RESOLVED)).toBe(true);
    });

    test('allows Resolved → Open', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.RESOLVED });
      expect(ticket.canTransitionTo(TicketStatus.OPEN)).toBe(true);
    });

    test('allows Resolved → Closed', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.RESOLVED });
      expect(ticket.canTransitionTo(TicketStatus.CLOSED)).toBe(true);
    });

    test('disallows Closed → any state (terminal state)', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.CLOSED });
      expect(ticket.canTransitionTo(TicketStatus.OPEN)).toBe(false);
      expect(ticket.canTransitionTo(TicketStatus.RESOLVED)).toBe(false);
    });

    test('allows pending_triage → Open', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.PENDING_TRIAGE });
      expect(ticket.canTransitionTo(TicketStatus.OPEN)).toBe(true);
    });

    test('allows triage_failed → Open', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.TRIAGE_FAILED });
      expect(ticket.canTransitionTo(TicketStatus.OPEN)).toBe(true);
    });
  });

  describe('transitionTo()', () => {
    test('updates status when transition is valid', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.OPEN });
      const beforeUpdate = new Date(ticket.updated_at.getTime() - 1000); // 1 second before
      ticket.transitionTo(TicketStatus.IN_PROGRESS);
      expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
      expect(ticket.updated_at.getTime()).toBeGreaterThan(beforeUpdate.getTime());
    });

    test('throws InvalidStatusTransitionError for disallowed transition', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.OPEN });
      expect(() => ticket.transitionTo(TicketStatus.CLOSED)).toThrow(
        InvalidStatusTransitionError,
      );
    });

    test('includes helpful error details on invalid transition', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.OPEN });
      expect(() => ticket.transitionTo(TicketStatus.CLOSED)).toThrow(
        /Cannot transition from Open to Closed/,
      );
    });
  });

  describe('isTriageable()', () => {
    test('returns true for pending_triage status', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.PENDING_TRIAGE });
      expect(ticket.isTriageable()).toBe(true);
    });

    test('returns true for triage_failed status', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.TRIAGE_FAILED });
      expect(ticket.isTriageable()).toBe(true);
    });

    test('returns false for Open status', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.OPEN });
      expect(ticket.isTriageable()).toBe(false);
    });

    test('returns false for In Progress status', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.IN_PROGRESS });
      expect(ticket.isTriageable()).toBe(false);
    });

    test('returns false for Resolved status', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.RESOLVED });
      expect(ticket.isTriageable()).toBe(false);
    });

    test('returns false for Closed status', () => {
      const ticket = new Ticket({ ...validTicketData, status: TicketStatus.CLOSED });
      expect(ticket.isTriageable()).toBe(false);
    });
  });

  describe('toObject()', () => {
    test('returns plain object with all fields', () => {
      const ticket = new Ticket(validTicketData);
      const obj = ticket.toObject();
      expect(obj).toEqual(validTicketData);
    });

    test('does not mutate ticket when modifying returned object', () => {
      const ticket = new Ticket(validTicketData);
      const obj = ticket.toObject();
      obj.title = 'Modified';
      expect(ticket.title).toBe(validTicketData.title);
    });
  });
});
