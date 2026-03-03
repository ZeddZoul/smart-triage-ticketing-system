/**
 * Agent Entity Tests — Agent.test.js
 *
 * Comprehensive tests for Agent domain model:
 *   - Field validation
 *   - Role defaults
 *   - Object serialization (with and without password)
 *   - Edge cases
 *
 * @see src/entities/Agent.js
 * @see DESIGN.md §14 (Test Strategy)
 */

const Agent = require('../../../src/entities/Agent');
const { ValidationError } = require('../../../src/entities/errors');
const { AgentRole } = require('../../../src/entities/enums');

describe('Agent Entity', () => {
  const validAgentData = {
    id: '507f1f77bcf86cd799439012',
    email: 'agent@example.com',
    password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH',
    name: 'Alice Johnson',
    role: AgentRole.AGENT,
    created_at: new Date('2026-03-03T10:00:00Z'),
    updated_at: new Date('2026-03-03T10:00:00Z'),
  };

  describe('Constructor', () => {
    test('creates a valid agent with all fields', () => {
      const agent = new Agent(validAgentData);
      expect(agent.id).toBe(validAgentData.id);
      expect(agent.email).toBe(validAgentData.email);
      expect(agent.name).toBe(validAgentData.name);
      expect(agent.role).toBe(AgentRole.AGENT);
    });

    test('defaults role to AGENT when not provided', () => {
      const data = { ...validAgentData };
      delete data.role;
      const agent = new Agent(data);
      expect(agent.role).toBe(AgentRole.AGENT);
    });

    test('stores provided role when specified', () => {
      const data = { ...validAgentData, role: AgentRole.ADMIN };
      const agent = new Agent(data);
      expect(agent.role).toBe(AgentRole.ADMIN);
    });
  });

  describe('validate()', () => {
    test('passes validation for valid agent', () => {
      const agent = new Agent(validAgentData);
      expect(() => agent.validate()).not.toThrow();
    });

    test('throws ValidationError when email is missing', () => {
      const data = { ...validAgentData, email: undefined };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/email is required/);
    });

    test('throws ValidationError when email lacks @', () => {
      const data = { ...validAgentData, email: 'invalid.email' };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/valid email format/);
    });

    test('throws ValidationError when email lacks domain', () => {
      const data = { ...validAgentData, email: 'invalid@' };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/valid email format/);
    });

    test('throws ValidationError when password_hash is missing', () => {
      const data = { ...validAgentData, password_hash: undefined };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/password_hash is required/);
    });

    test('throws ValidationError when password_hash is empty string', () => {
      const data = { ...validAgentData, password_hash: '' };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/password_hash is required/);
    });

    test('throws ValidationError when name is missing', () => {
      const data = { ...validAgentData, name: undefined };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/name is required/);
    });

    test('throws ValidationError when name is whitespace', () => {
      const data = { ...validAgentData, name: '   ' };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/name cannot be empty or whitespace/);
    });

    test('throws ValidationError when name exceeds 100 characters', () => {
      const data = { ...validAgentData, name: 'x'.repeat(101) };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/must be between 1 and 100 characters/);
    });

    test('throws ValidationError when role is invalid', () => {
      const data = { ...validAgentData, role: 'SUPER_ADMIN' };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/role must be one of/);
    });

    test('throws ValidationError when created_at is not a Date', () => {
      const data = { ...validAgentData, created_at: '2026-03-03' };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/created_at must be a valid Date/);
    });

    test('throws ValidationError when updated_at is not a Date', () => {
      const data = { ...validAgentData, updated_at: null };
      const agent = new Agent(data);
      expect(() => agent.validate()).toThrow(ValidationError);
      expect(() => agent.validate()).toThrow(/updated_at must be a valid Date/);
    });
  });

  describe('toObject()', () => {
    test('returns plain object without password_hash', () => {
      const agent = new Agent(validAgentData);
      const obj = agent.toObject();
      expect(obj).toEqual({
        id: validAgentData.id,
        email: validAgentData.email,
        name: validAgentData.name,
        role: validAgentData.role,
        created_at: validAgentData.created_at,
        updated_at: validAgentData.updated_at,
      });
      expect(obj).not.toHaveProperty('password_hash');
    });

    test('does not mutate agent when modifying returned object', () => {
      const agent = new Agent(validAgentData);
      const obj = agent.toObject();
      obj.name = 'Modified';
      expect(agent.name).toBe(validAgentData.name);
    });
  });

  describe('toObjectWithPassword()', () => {
    test('returns plain object including password_hash', () => {
      const agent = new Agent(validAgentData);
      const obj = agent.toObjectWithPassword();
      expect(obj).toEqual(validAgentData);
      expect(obj).toHaveProperty('password_hash');
      expect(obj.password_hash).toBe(validAgentData.password_hash);
    });

    test('is used internally by repository layer', () => {
      // This test documents the intended use case
      const agent = new Agent(validAgentData);
      const obj = agent.toObjectWithPassword();
      // Repository would use this to store in database
      expect(obj.password_hash).toBeDefined();
    });
  });

  describe('Role validation', () => {
    test('accepts AGENT role', () => {
      const data = { ...validAgentData, role: AgentRole.AGENT };
      const agent = new Agent(data);
      expect(() => agent.validate()).not.toThrow();
    });

    test('accepts ADMIN role', () => {
      const data = { ...validAgentData, role: AgentRole.ADMIN };
      const agent = new Agent(data);
      expect(() => agent.validate()).not.toThrow();
    });

    test('accepts READ_ONLY role', () => {
      const data = { ...validAgentData, role: AgentRole.READ_ONLY };
      const agent = new Agent(data);
      expect(() => agent.validate()).not.toThrow();
    });
  });
});
