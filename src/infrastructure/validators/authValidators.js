/**
 * Auth Validation Schemas — authValidators.js
 *
 * Zod schemas for auth-related endpoints.
 * Used by: validationMiddleware (src/infrastructure/middleware/validationMiddleware.js)
 * Tests: tests/unit/validators/authValidators.test.js
 *
 * @see REQUIREMENTS.md §9 (Zod Schemas)
 * @see DESIGN.md §7.2 (Middleware Pipeline)
 */

const { z } = require('zod');

// ─────────────────────────────────────────────────────────────────────────────
// Register Agent Schema (POST /api/auth/register)
// ─────────────────────────────────────────────────────────────────────────────

const registerAgentSchema = z.object({
  email: z
    .string()
    .email('email must be a valid email address')
    .transform((v) => v.trim().toLowerCase()),

  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .max(128, 'password must not exceed 128 characters'),

  name: z
    .string()
    .min(2, 'name must be at least 2 characters')
    .max(100, 'name must not exceed 100 characters')
    .transform((v) => v.trim()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Login Agent Schema (POST /api/auth/login)
// ─────────────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .email('email must be a valid email address')
    .transform((v) => v.trim().toLowerCase()),

  password: z
    .string()
    .min(1, 'password is required')
    .max(128, 'password must not exceed 128 characters'),
});

module.exports = {
  registerAgentSchema,
  loginSchema,
};
