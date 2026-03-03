/**
 * Ticket Validation Schemas — ticketValidators.js
 *
 * Zod schemas for ticket-related endpoints.
 * Used by: validationMiddleware (src/infrastructure/middleware/validationMiddleware.js)
 * Tests: tests/unit/validators/ticketValidators.test.js
 *
 * @see REQUIREMENTS.md §9 (Zod Schemas)
 * @see DESIGN.md §7.2 (Middleware Pipeline)
 */

const { z } = require('zod');
const { TicketStatus, TicketCategory, TicketPriority } = require('../../entities/enums');

// ─────────────────────────────────────────────────────────────────────────────
// Create Ticket Schema (POST /api/tickets)
// ─────────────────────────────────────────────────────────────────────────────

const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'title must be at least 5 characters')
    .max(200, 'title must not exceed 200 characters')
    .transform((v) => v.trim()),

  description: z
    .string()
    .min(10, 'description must be at least 10 characters')
    .max(5000, 'description must not exceed 5000 characters')
    .transform((v) => v.trim()),

  customer_email: z
    .string()
    .email('customer_email must be a valid email address')
    .transform((v) => v.trim().toLowerCase()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Update Ticket Status Schema (PATCH /api/tickets/:id)
// ─────────────────────────────────────────────────────────────────────────────

const updateTicketStatusSchema = z.object({
  status: z.enum([
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ]),
});

// ─────────────────────────────────────────────────────────────────────────────
// Ticket Query Params Schema (GET /api/tickets?...)
// ─────────────────────────────────────────────────────────────────────────────

const ticketQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .refine((v) => v >= 1, 'page must be >= 1'),

  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .refine((v) => v >= 1 && v <= 100, 'limit must be between 1 and 100'),

  status: z.enum([...Object.values(TicketStatus)]).optional(),

  priority: z.enum([...Object.values(TicketPriority)]).optional(),

  category: z.enum([...Object.values(TicketCategory)]).optional(),

  sortBy: z
    .enum(['created_at', 'updated_at', 'priority'])
    .default('created_at')
    .optional(),

  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

module.exports = {
  createTicketSchema,
  updateTicketStatusSchema,
  ticketQuerySchema,
};
