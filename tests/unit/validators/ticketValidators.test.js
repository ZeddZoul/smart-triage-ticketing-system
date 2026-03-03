/**
 * Ticket Validators Tests — ticketValidators.test.js
 *
 * Comprehensive tests for Zod ticket validation schemas.
 * Covers:
 *   - Valid inputs
 *   - Each field invalid
 *   - Field transformations (trim, lowercase)
 *   - Edge cases (min/max boundaries)
 *
 * @see src/infrastructure/validators/ticketValidators.js
 * @see DESIGN.md §14 (Test Strategy)
 */

const {
  createTicketSchema,
  updateTicketStatusSchema,
  ticketQuerySchema,
} = require('../../../src/infrastructure/validators/ticketValidators');
const { TicketStatus } = require('../../../src/entities/enums');

describe('Ticket Validation Schemas', () => {
  describe('createTicketSchema', () => {
    const validData = {
      title: 'Login button not working',
      description: 'The login button on the homepage does not respond to clicks.',
      customer_email: 'user@example.com',
    };

    test('passes validation for valid data', () => {
      const result = createTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    test('trims title whitespace', () => {
      const data = { ...validData, title: '  Login button  ' };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Login button');
    });

    test('trims description whitespace', () => {
      const data = { ...validData, description: '  Test description  ' };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.description).toBe('Test description');
    });

    test('lowercases email', () => {
      const data = { ...validData, customer_email: 'User@EXAMPLE.COM' };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.customer_email).toBe('user@example.com');
    });

    test('throws when title is missing', () => {
      const data = { ...validData };
      delete data.title;
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('throws when title is less than 5 characters', () => {
      const data = { ...validData, title: 'Test' };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('at least 5');
    });

    test('throws when title exceeds 200 characters', () => {
      const data = { ...validData, title: 'x'.repeat(201) };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('exceed 200');
    });

    test('passes when title is exactly 5 characters', () => {
      const data = { ...validData, title: 'Exact' };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('passes when title is exactly 200 characters', () => {
      const data = { ...validData, title: 'x'.repeat(200) };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('throws when description is missing', () => {
      const data = { ...validData };
      delete data.description;
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('throws when description is less than 10 characters', () => {
      const data = { ...validData, description: '123456789' };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('at least 10');
    });

    test('throws when description exceeds 5000 characters', () => {
      const data = { ...validData, description: 'x'.repeat(5001) };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('exceed 5000');
    });

    test('passes when description is exactly 10 characters', () => {
      const data = { ...validData, description: '1234567890' };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('passes when description is exactly 5000 characters', () => {
      const data = { ...validData, description: 'x'.repeat(5000) };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('throws when customer_email is missing', () => {
      const data = { ...validData };
      delete data.customer_email;
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('throws when customer_email is invalid', () => {
      const data = { ...validData, customer_email: 'not-an-email' };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('valid email');
    });

    test('transforms email: lowercase', () => {
      const data = { ...validData, customer_email: 'USER@EXAMPLE.COM' };
      const result = createTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.customer_email).toBe('user@example.com');
    });
  });

  describe('updateTicketStatusSchema', () => {
    test('passes for valid status: Open', () => {
      const result = updateTicketStatusSchema.safeParse({
        status: TicketStatus.OPEN,
      });
      expect(result.success).toBe(true);
    });

    test('passes for valid status: In Progress', () => {
      const result = updateTicketStatusSchema.safeParse({
        status: TicketStatus.IN_PROGRESS,
      });
      expect(result.success).toBe(true);
    });

    test('passes for valid status: Resolved', () => {
      const result = updateTicketStatusSchema.safeParse({
        status: TicketStatus.RESOLVED,
      });
      expect(result.success).toBe(true);
    });

    test('passes for valid status: Closed', () => {
      const result = updateTicketStatusSchema.safeParse({
        status: TicketStatus.CLOSED,
      });
      expect(result.success).toBe(true);
    });

    test('throws for invalid status', () => {
      const result = updateTicketStatusSchema.safeParse({
        status: 'INVALID_STATUS',
      });
      expect(result.success).toBe(false);
    });

    test('throws when status is missing', () => {
      const result = updateTicketStatusSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('ticketQuerySchema', () => {
    test('passes for empty query params (all defaults)', () => {
      const result = ticketQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
      expect(result.data.sortBy).toBe('created_at');
      expect(result.data.sortOrder).toBe('desc');
    });

    test('parses page from string to number', () => {
      const result = ticketQuerySchema.safeParse({ page: '2' });
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(2);
    });

    test('parses limit from string to number', () => {
      const result = ticketQuerySchema.safeParse({ limit: '25' });
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(25);
    });

    test('throws when page is less than 1', () => {
      const result = ticketQuerySchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });

    test('throws when limit is less than 1', () => {
      const result = ticketQuerySchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
    });

    test('throws when limit exceeds 100', () => {
      const result = ticketQuerySchema.safeParse({ limit: '101' });
      expect(result.success).toBe(false);
    });

    test('passes when limit is exactly 100', () => {
      const result = ticketQuerySchema.safeParse({ limit: '100' });
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(100);
    });

    test('filters by status', () => {
      const result = ticketQuerySchema.safeParse({
        status: TicketStatus.OPEN,
      });
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(TicketStatus.OPEN);
    });

    test('filters by priority', () => {
      const result = ticketQuerySchema.safeParse({ priority: 'High' });
      expect(result.success).toBe(true);
      expect(result.data.priority).toBe('High');
    });

    test('filters by category', () => {
      const result = ticketQuerySchema.safeParse({
        category: 'Technical Bug',
      });
      expect(result.success).toBe(true);
      expect(result.data.category).toBe('Technical Bug');
    });

    test('sorts by created_at', () => {
      const result = ticketQuerySchema.safeParse({ sortBy: 'created_at' });
      expect(result.success).toBe(true);
      expect(result.data.sortBy).toBe('created_at');
    });

    test('sorts by updated_at', () => {
      const result = ticketQuerySchema.safeParse({ sortBy: 'updated_at' });
      expect(result.success).toBe(true);
      expect(result.data.sortBy).toBe('updated_at');
    });

    test('sorts by priority', () => {
      const result = ticketQuerySchema.safeParse({ sortBy: 'priority' });
      expect(result.success).toBe(true);
      expect(result.data.sortBy).toBe('priority');
    });

    test('sorts in ascending order', () => {
      const result = ticketQuerySchema.safeParse({ sortOrder: 'asc' });
      expect(result.success).toBe(true);
      expect(result.data.sortOrder).toBe('asc');
    });

    test('combines multiple filters', () => {
      const result = ticketQuerySchema.safeParse({
        page: '2',
        limit: '20',
        status: TicketStatus.IN_PROGRESS,
        priority: 'High',
      });
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(20);
      expect(result.data.status).toBe(TicketStatus.IN_PROGRESS);
      expect(result.data.priority).toBe('High');
    });
  });
});
