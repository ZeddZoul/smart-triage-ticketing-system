/**
 * Agent Entity — Agent.js
 *
 * Domain model representing a support agent.
 * Pure business logic: validation, field rules.
 * Zero external dependencies (entities layer).
 *
 * @see DESIGN.md §2 (Entities layer)
 */

const { ValidationError } = require('./errors');
const { AgentRole } = require('./enums');

class Agent {
  /**
   * Create an Agent entity.
   *
   * @param {object} data - Agent data
   * @param {string} data.id - Unique agent ID (ObjectId string)
   * @param {string} data.email - Agent email (unique, required)
   * @param {string} data.password_hash - Hashed password (bcrypt, required)
   * @param {string} data.name - Agent full name (required)
   * @param {string} data.role - Agent role (from AgentRole enum, default: 'agent')
   * @param {Date} data.created_at - Account creation timestamp
   * @param {Date} data.updated_at - Last update timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.name = data.name;
    this.role = data.role || AgentRole.AGENT;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Validate agent fields against domain constraints.
   * Throws ValidationError if any constraint is violated.
   *
   * Constraints:
   *   - email: valid format, required, must be unique (checked by repository)
   *   - password_hash: non-empty string, required
   *   - name: 1-100 characters, required, non-whitespace
   *   - role: must be a valid AgentRole
   *   - created_at / updated_at: valid Date objects
   */
  validate() {
    const errors = [];

    // Email validation
    if (!this.email || !this.email.includes('@') || !this.email.includes('.')) {
      errors.push('email is required and must be a valid email format');
    }

    // Password hash validation
    if (!this.password_hash || typeof this.password_hash !== 'string') {
      errors.push('password_hash is required and must be a non-empty string');
    }

    // Name validation
    if (!this.name || typeof this.name !== 'string') {
      errors.push('name is required and must be a string');
    } else if (this.name.trim().length === 0) {
      errors.push('name cannot be empty or whitespace');
    } else if (this.name.length < 1 || this.name.length > 100) {
      errors.push('name must be between 1 and 100 characters');
    }

    // Role validation
    const validRoles = Object.values(AgentRole);
    if (!validRoles.includes(this.role)) {
      errors.push(`role must be one of: ${validRoles.join(', ')}`);
    }

    // Timestamps validation
    if (!(this.created_at instanceof Date)) {
      errors.push('created_at must be a valid Date');
    }
    if (!(this.updated_at instanceof Date)) {
      errors.push('updated_at must be a valid Date');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Agent validation failed: ${errors.join('; ')}`, {
        errors,
      });
    }
  }

  /**
   * Convert entity to plain object (for responses, logging).
   * IMPORTANT: Does not include password_hash for security.
   *
   * @returns {object}
   */
  toObject() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Convert entity to object including password hash (internal use only).
   * Used by repository layer for database operations.
   *
   * @returns {object}
   */
  toObjectWithPassword() {
    return {
      id: this.id,
      email: this.email,
      password_hash: this.password_hash,
      name: this.name,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Agent;
