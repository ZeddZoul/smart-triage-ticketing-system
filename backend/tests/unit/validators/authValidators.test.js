/**
 * Auth Validators Tests — authValidators.test.js
 *
 * Comprehensive tests for Zod auth validation schemas.
 * Covers:
 *   - Valid inputs
 *   - Each field invalid
 *   - Field transformations (trim, lowercase)
 *   - Edge cases (min/max boundaries)
 *
 * @see src/infrastructure/validators/authValidators.js
 * @see DESIGN.md §14 (Test Strategy)
 */

const {
  registerAgentSchema,
  loginSchema,
} = require('../../../src/infrastructure/validators/authValidators');

describe('Auth Validation Schemas', () => {
  describe('registerAgentSchema', () => {
    const validData = {
      email: 'agent@example.com',
      password: 'securepassword123',
      name: 'Alice Johnson',
    };

    test('passes validation for valid data', () => {
      const result = registerAgentSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    test('lowercases email', () => {
      const data = { ...validData, email: 'Agent@EXAMPLE.COM' };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('agent@example.com');
    });

    test('throws when email has leading/trailing whitespace', () => {
      const data = { ...validData, email: '  agent@example.com  ' };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('valid email');
    });

    test('trims name whitespace', () => {
      const data = { ...validData, name: '  Alice Johnson  ' };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Alice Johnson');
    });

    test('throws when email is missing', () => {
      const data = { ...validData };
      delete data.email;
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('throws when email is invalid', () => {
      const data = { ...validData, email: 'not-an-email' };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('valid email');
    });

    test('throws when password is missing', () => {
      const data = { ...validData };
      delete data.password;
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('throws when password is less than 8 characters', () => {
      const data = { ...validData, password: 'short' };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('at least 8');
    });

    test('passes when password is exactly 8 characters', () => {
      const data = { ...validData, password: 'pass1234' };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('throws when password exceeds 128 characters', () => {
      const data = { ...validData, password: 'x'.repeat(129) };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('exceed 128');
    });

    test('passes when password is exactly 128 characters', () => {
      const data = { ...validData, password: 'x'.repeat(128) };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('throws when name is missing', () => {
      const data = { ...validData };
      delete data.name;
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('throws when name is less than 2 characters', () => {
      const data = { ...validData, name: 'A' };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('at least 2');
    });

    test('passes when name is exactly 2 characters', () => {
      const data = { ...validData, name: 'Al' };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('throws when name exceeds 100 characters', () => {
      const data = { ...validData, name: 'x'.repeat(101) };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('exceed 100');
    });

    test('passes when name is exactly 100 characters', () => {
      const data = { ...validData, name: 'x'.repeat(100) };
      const result = registerAgentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    const validData = {
      email: 'agent@example.com',
      password: 'mypassword',
    };

    test('passes validation for valid data', () => {
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    test('lowercases email', () => {
      const data = { ...validData, email: 'Agent@EXAMPLE.COM' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('agent@example.com');
    });

    test('throws when email has leading/trailing whitespace', () => {
      const data = { ...validData, email: '  agent@example.com  ' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('valid email');
    });

    test('throws when email is missing', () => {
      const data = { ...validData };
      delete data.email;
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('throws when email is invalid', () => {
      const data = { ...validData, email: 'not-an-email' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('valid email');
    });

    test('throws when password is missing', () => {
      const data = { ...validData };
      delete data.password;
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('throws when password is empty string', () => {
      const data = { ...validData, password: '' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('required');
    });

    test('passes when password is exactly 1 character', () => {
      const data = { ...validData, password: 'x' };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('throws when password exceeds 128 characters', () => {
      const data = { ...validData, password: 'x'.repeat(129) };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('exceed 128');
    });

    test('passes when password is exactly 128 characters', () => {
      const data = { ...validData, password: 'x'.repeat(128) };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
