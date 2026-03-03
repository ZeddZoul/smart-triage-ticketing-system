/**
 * TicketHistory Entity Tests — TicketHistory.test.js
 *
 * Comprehensive tests for TicketHistory domain model:
 *   - Field validation
 *   - Static factory methods
 *   - Immutability concept
 *   - Edge cases
 *
 * @see src/entities/TicketHistory.js
 * @see DESIGN.md §14 (Test Strategy)
 */

const TicketHistory = require('../../../src/entities/TicketHistory');
const { ValidationError } = require('../../../src/entities/errors');
const { HistoryAction } = require('../../../src/entities/enums');

describe('TicketHistory Entity', () => {
  const validHistoryData = {
    id: '507f1f77bcf86cd799439013',
    ticket_id: '507f1f77bcf86cd799439011',
    action: HistoryAction.CREATED,
    performed_by_agent_id: null,
    previous_value: null,
    new_value: {
      id: '507f1f77bcf86cd799439011',
      title: 'Test Ticket',
      status: 'pending_triage',
    },
    notes: 'Ticket created by customer',
    created_at: new Date('2026-03-03T10:00:00Z'),
  };

  describe('Constructor', () => {
    test('creates a valid history record with all fields', () => {
      const history = new TicketHistory(validHistoryData);
      expect(history.id).toBe(validHistoryData.id);
      expect(history.ticket_id).toBe(validHistoryData.ticket_id);
      expect(history.action).toBe(HistoryAction.CREATED);
    });

    test('initializes nullable fields to null when not provided', () => {
      const data = { ...validHistoryData };
      delete data.performed_by_agent_id;
      delete data.notes;
      const history = new TicketHistory(data);
      expect(history.performed_by_agent_id).toBeNull();
      expect(history.notes).toBeNull();
    });
  });

  describe('validate()', () => {
    test('passes validation for valid history record', () => {
      const history = new TicketHistory(validHistoryData);
      expect(() => history.validate()).not.toThrow();
    });

    test('throws ValidationError when ticket_id is missing', () => {
      const data = { ...validHistoryData, ticket_id: undefined };
      const history = new TicketHistory(data);
      expect(() => history.validate()).toThrow(ValidationError);
      expect(() => history.validate()).toThrow(/ticket_id is required/);
    });

    test('throws ValidationError when action is invalid', () => {
      const data = { ...validHistoryData, action: 'INVALID_ACTION' };
      const history = new TicketHistory(data);
      expect(() => history.validate()).toThrow(ValidationError);
      expect(() => history.validate()).toThrow(/action must be one of/);
    });

    test('converts empty string performed_by_agent_id to null', () => {
      const data = { ...validHistoryData, performed_by_agent_id: '' };
      const history = new TicketHistory(data);
      expect(history.performed_by_agent_id).toBeNull();
      expect(() => history.validate()).not.toThrow();
    });

    test('passes validation when performed_by_agent_id is null', () => {
      const data = { ...validHistoryData, performed_by_agent_id: null };
      const history = new TicketHistory(data);
      expect(() => history.validate()).not.toThrow();
    });

    test('passes validation when performed_by_agent_id is a valid agent ID', () => {
      const data = { ...validHistoryData, performed_by_agent_id: '507f1f77bcf86cd799439012' };
      const history = new TicketHistory(data);
      expect(() => history.validate()).not.toThrow();
    });

    test('throws ValidationError when previous_value is not object or null', () => {
      const data = { ...validHistoryData, previous_value: 'string' };
      const history = new TicketHistory(data);
      expect(() => history.validate()).toThrow(ValidationError);
      expect(() => history.validate()).toThrow(/previous_value must be an object or null/);
    });

    test('passes validation when previous_value is null', () => {
      const data = { ...validHistoryData, previous_value: null };
      const history = new TicketHistory(data);
      expect(() => history.validate()).not.toThrow();
    });

    test('throws ValidationError when new_value is not object or null', () => {
      const data = { ...validHistoryData, new_value: 123 };
      const history = new TicketHistory(data);
      expect(() => history.validate()).toThrow(ValidationError);
      expect(() => history.validate()).toThrow(/new_value must be an object or null/);
    });

    test('throws ValidationError when notes exceeds 500 characters', () => {
      const data = { ...validHistoryData, notes: 'x'.repeat(501) };
      const history = new TicketHistory(data);
      expect(() => history.validate()).toThrow(ValidationError);
      expect(() => history.validate()).toThrow(/notes must not exceed 500 characters/);
    });

    test('throws ValidationError when created_at is not a Date', () => {
      const data = { ...validHistoryData, created_at: '2026-03-03' };
      const history = new TicketHistory(data);
      expect(() => history.validate()).toThrow(ValidationError);
      expect(() => history.validate()).toThrow(/created_at must be a valid Date/);
    });
  });

  describe('Static Factory Methods', () => {
    describe('created()', () => {
      test('creates a history record with CREATED action', () => {
        const newTicket = {
          id: '507f1f77bcf86cd799439011',
          title: 'Test',
          status: 'pending_triage',
        };
        const history = TicketHistory.created({
          id: '507f1f77bcf86cd799439013',
          ticket_id: '507f1f77bcf86cd799439011',
          new_ticket: newTicket,
        });

        expect(history.action).toBe(HistoryAction.CREATED);
        expect(history.performed_by_agent_id).toBeNull();
        expect(history.previous_value).toBeNull();
        expect(history.new_value).toEqual(newTicket);
        expect(history.notes).toContain('created by customer');
      });

      test('created() record passes validation', () => {
        const history = TicketHistory.created({
          id: '507f1f77bcf86cd799439013',
          ticket_id: '507f1f77bcf86cd799439011',
          new_ticket: { id: 'test', title: 'Test' },
        });
        expect(() => history.validate()).not.toThrow();
      });
    });

    describe('triageCompleted()', () => {
      test('creates a history record with TRIAGE_COMPLETED action', () => {
        const previous = { status: 'pending_triage', category: null };
        const newState = { status: 'Open', category: 'Billing', priority: 'High' };

        const history = TicketHistory.triageCompleted({
          id: '507f1f77bcf86cd799439013',
          ticket_id: '507f1f77bcf86cd799439011',
          previous_state: previous,
          new_state: newState,
        });

        expect(history.action).toBe(HistoryAction.TRIAGE_COMPLETED);
        expect(history.performed_by_agent_id).toBeNull();
        expect(history.previous_value).toEqual(previous);
        expect(history.new_value).toEqual(newState);
        expect(history.notes).toContain('Triage completed');
      });

      test('triageCompleted() record passes validation', () => {
        const history = TicketHistory.triageCompleted({
          id: '507f1f77bcf86cd799439013',
          ticket_id: '507f1f77bcf86cd799439011',
          previous_state: {},
          new_state: { category: 'Billing' },
        });
        expect(() => history.validate()).not.toThrow();
      });
    });

    describe('triageFailed()', () => {
      test('creates a history record with TRIAGE_FAILED action', () => {
        const history = TicketHistory.triageFailed({
          id: '507f1f77bcf86cd799439013',
          ticket_id: '507f1f77bcf86cd799439011',
          attempt_count: 3,
        });

        expect(history.action).toBe(HistoryAction.TRIAGE_FAILED);
        expect(history.performed_by_agent_id).toBeNull();
        expect(history.previous_value).toBeNull();
        expect(history.new_value).toBeNull();
        expect(history.notes).toContain('after 3 attempts');
      });

      test('triageFailed() record passes validation', () => {
        const history = TicketHistory.triageFailed({
          id: '507f1f77bcf86cd799439013',
          ticket_id: '507f1f77bcf86cd799439011',
          attempt_count: 3,
        });
        expect(() => history.validate()).not.toThrow();
      });
    });

    describe('statusChanged()', () => {
      test('creates a history record with STATUS_CHANGED action', () => {
        const history = TicketHistory.statusChanged({
          id: '507f1f77bcf86cd799439013',
          ticket_id: '507f1f77bcf86cd799439011',
          agent_id: '507f1f77bcf86cd799439012',
          previous_status: 'Open',
          new_status: 'In Progress',
        });

        expect(history.action).toBe(HistoryAction.STATUS_CHANGED);
        expect(history.performed_by_agent_id).toBe('507f1f77bcf86cd799439012');
        expect(history.previous_value).toEqual({ status: 'Open' });
        expect(history.new_value).toEqual({ status: 'In Progress' });
        expect(history.notes).toContain('Open → In Progress');
      });

      test('statusChanged() record passes validation', () => {
        const history = TicketHistory.statusChanged({
          id: '507f1f77bcf86cd799439013',
          ticket_id: '507f1f77bcf86cd799439011',
          agent_id: 'agent-123',
          previous_status: 'Open',
          new_status: 'In Progress',
        });
        expect(() => history.validate()).not.toThrow();
      });
    });
  });

  describe('toObject()', () => {
    test('returns plain object with all fields', () => {
      const history = new TicketHistory(validHistoryData);
      const obj = history.toObject();
      expect(obj).toEqual(validHistoryData);
    });

    test('does not mutate history when modifying returned object', () => {
      const history = new TicketHistory(validHistoryData);
      const obj = history.toObject();
      obj.notes = 'Modified';
      expect(history.notes).toBe(validHistoryData.notes);
    });
  });
});
