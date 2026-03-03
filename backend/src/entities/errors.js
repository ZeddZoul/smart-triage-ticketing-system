/**
 * Domain Exception Hierarchy — errors.js
 *
 * All application exceptions inherit from AppError.
 * Each domain layer can throw specific exceptions.
 * HTTP status codes are assigned by middleware (errorMiddleware.js).
 *
 * @see DESIGN.md §8 (Error Classes)
 * @see REQUIREMENTS.md §8 (Error Response Contract)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Base Application Error
// ─────────────────────────────────────────────────────────────────────────────

class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Unique error code (e.g., 'VALIDATION_ERROR')
   * @param {object} details - Optional error details for debugging
   */
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Preserve stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Domain-Specific Exceptions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when entity validation fails (invalid field values, constraints).
 * HTTP: 400 Bad Request
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when requested resource is not found in repository.
 * HTTP: 404 Not Found
 */
class NotFoundError extends AppError {
  constructor(message, details = {}) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when user lacks required authentication or authorization.
 * HTTP: 401 Unauthorized or 403 Forbidden
 */
class UnauthorizedError extends AppError {
  constructor(message, details = {}) {
    super(message, 'UNAUTHORIZED', details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Thrown when unique constraint is violated (e.g., duplicate email).
 * HTTP: 409 Conflict
 */
class ConflictError extends AppError {
  constructor(message, details = {}) {
    super(message, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

/**
 * Thrown when attempted state transition is not allowed by the state machine.
 * HTTP: 422 Unprocessable Entity
 */
class InvalidStatusTransitionError extends AppError {
  constructor(message, details = {}) {
    super(message, 'INVALID_STATUS_TRANSITION', details);
    this.name = 'InvalidStatusTransitionError';
  }
}

/**
 * Thrown when provided ID is malformed (not ObjectId format).
 * HTTP: 400 Bad Request
 */
class InvalidIdError extends AppError {
  constructor(message, details = {}) {
    super(message, 'INVALID_ID', details);
    this.name = 'InvalidIdError';
  }
}

/**
 * Thrown when JWT token is expired or invalid.
 * HTTP: 401 Unauthorized
 */
class TokenExpiredError extends AppError {
  constructor(message, details = {}) {
    super(message, 'TOKEN_EXPIRED', details);
    this.name = 'TokenExpiredError';
  }
}

/**
 * Thrown when an external service (e.g., AI/Gemini) fails after retries.
 * HTTP: 503 Service Unavailable (graceful degradation)
 */
class ExternalServiceError extends AppError {
  constructor(message, details = {}) {
    super(message, 'EXTERNAL_SERVICE_ERROR', details);
    this.name = 'ExternalServiceError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  InvalidStatusTransitionError,
  InvalidIdError,
  TokenExpiredError,
  ExternalServiceError,
};
