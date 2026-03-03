# AI Journey — Smart Triage Ticketing System

> A record of significant AI-assisted development decisions, complex prompts, errors, and corrections during the build process.

---

## 1. Complex Prompts

### Prompt 1: Clean Architecture Entity Design with State Machine

**Prompt (paraphrased):**

> "Create the Ticket entity in `src/entities/Ticket.js` following Clean Architecture. It must include: validation for all fields (title 1-200 chars, description 1-5000, valid email, etc.), a state machine with `VALID_TRANSITIONS` defining allowed status transitions (Open ↔ In Progress ↔ Resolved, pending_triage/triage_failed → Open, Closed is terminal), methods `canTransitionTo()`, `transitionTo()`, `isTriageable()`, and `toObject()`. Throw domain-specific errors (`ValidationError`, `InvalidStatusTransitionError`) with meaningful details. The entity must have zero infrastructure dependencies."

**Why it was complex:** This single prompt required the AI to synthesize multiple concerns — data validation, state machine logic, domain error types, and Clean Architecture boundary rules — into a single cohesive module. The state machine needed careful modeling to prevent invalid transitions while allowing recovery paths (triage_failed → Open).

**Result:** The generated entity correctly implemented all six status states, the bidirectional transition map, and proper error hierarchies. The `isTriageable()` method elegantly checked if a ticket could be re-triaged. All 40 unit tests passed on first run.

---

### Prompt 2: Integration Test Architecture with Dependency Override

**Prompt (paraphrased):**

> "Write integration tests for all ticket routes using supertest. Tests must NOT require a running MongoDB — inject fake use cases through `createApp(overrides)`. The container should accept an `overrides` object that replaces any dependency. Test: POST (valid/invalid/AI-failure), GET with JWT auth and filters, GET by ID (found/not-found), PATCH with valid/invalid transitions. Mock the auth by injecting a fake authService into the container that accepts a known token."

**Why it was complex:** The challenge was designing a testing architecture where HTTP-level tests could run in complete isolation from databases and external services. This required the AI to understand the DI container's override mechanism, fake the auth verification flow end-to-end, and simulate different use case outcomes (success, validation error, not found, AI failure) through injected mock functions.

**Result:** 16 integration tests covering all routes. The `createApp(overrides)` pattern allowed each test to inject custom behavior — for example, making `createTicketUseCase.execute` throw to test error handling — while the real Express middleware stack (validation, error handling, auth) ran normally.

---

### Prompt 3: Optimistic UI Updates with Rollback

**Prompt (paraphrased):**

> "Build the dashboard page with optimistic status updates. On status dropdown change: (1) immediately update the ticket's status in local React state, (2) PATCH the backend in the background, (3) on failure: revert the local state to the previous value and show an error toast. The StatusSelect component must only show valid transition targets based on the current status, mirroring the backend's VALID_TRANSITIONS map."

**Why it was complex:** This required coordinating multiple React concerns — local state snapshots for rollback, async API calls, error boundaries, and a state machine that had to match the backend exactly. The AI needed to capture `previousTickets` before the optimistic write, perform the mutation, then conditionally revert on catch — all while managing loading states to prevent double-updates.

**Result:** The dashboard correctly implements optimistic updates. The `handleStatusChange` function captures the pre-mutation state, applies the update immediately for instant UI feedback, and reverts with a toast notification if the PATCH fails. The StatusSelect component mirrors `VALID_TRANSITIONS` from the shared types module.

---

## 2. AI Error and Correction

### Error: Timing-Dependent Test Failure in Ticket Entity

**What happened:** After generating the `Ticket.test.js` test suite, one test intermittently failed:

```javascript
// Original (buggy) test
it('updates updated_at on transitionTo', () => {
  const ticket = createTicket({ status: 'Open' });
  const before = new Date('2099-01-01'); // Hardcoded future date
  ticket.transitionTo('In Progress');
  expect(ticket.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
});
```

The test used a hardcoded future date (`2099-01-01`) as the comparison baseline. Since `transitionTo()` sets `updated_at = new Date()` (current time), the assertion `current >= future` always failed.

**AI's correction:** The test was rewritten to use a dynamically computed baseline:

```javascript
it('updates updated_at on transitionTo', () => {
  const ticket = createTicket({ status: 'Open' });
  const before = new Date(Date.now() - 1000); // 1 second ago
  ticket.transitionTo('In Progress');
  expect(ticket.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
});
```

**Lesson:** AI-generated tests with hardcoded temporal values can introduce subtle timing bugs. Always use relative timestamps (`Date.now()`) for time-comparison assertions.

---

## 3. RBAC Verification Scenario

### How to implement Role-Based Access Control

The system already defines three roles in `src/entities/enums.js`:

```javascript
const AgentRole = Object.freeze({
  AGENT: 'agent',
  ADMIN: 'admin',
  READ_ONLY: 'read_only',
});
```

**Implementation steps:**

1. **Create `authorize(requiredRoles)` middleware** in `src/infrastructure/middleware/`:

```javascript
function authorize(requiredRoles) {
  return (req, res, next) => {
    if (!req.agent || !requiredRoles.includes(req.agent.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    next();
  };
}
```

2. **Apply to routes** in `src/routes/ticketRoutes.js`:

```javascript
router.get(
  '/',
  auth,
  authorize(['agent', 'admin', 'read_only']),
  validate(ticketQuerySchema, 'query'),
  controller.getAll,
);
router.patch(
  '/:id',
  auth,
  authorize(['agent', 'admin']),
  validate(updateTicketStatusSchema),
  controller.updateStatus,
);
```

3. **Protect registration** in `src/routes/authRoutes.js`:

```javascript
router.post(
  '/register',
  auth,
  authorize(['admin']),
  validate(registerAgentSchema),
  controller.register,
);
```

4. **No changes needed** to entities, use cases, or repositories — RBAC is isolated in the middleware layer, consistent with Clean Architecture (dependencies point inward).

---

## 4. Graceful Failure Verification Scenario

### What happens when the Gemini API is unavailable

**Flow:**

1. **Customer submits a ticket** → `CreateTicketUseCase` creates the ticket with status `pending_triage` and calls `TriageTicketUseCase`.

2. **AI call fails** → `TriageTicketUseCase` catches the error, increments `triage_attempts`, and updates the ticket. The `CreateTicketUseCase` catches the triage failure and **still returns the created ticket** — the customer never sees an error.

3. **Retry exhaustion** → If `triage_attempts >= MAX_TRIAGE_RETRIES` (default 3), the ticket status transitions to `triage_failed`, and a `TRIAGE_FAILED` history record is created.

4. **Manual recovery** → Agents can see `triage_failed` tickets in the dashboard. The `StatusSelect` component shows `Open` as the only valid transition target. Agents can manually triage by reading the ticket and changing the status.

**Verification test (from `tests/unit/useCases/CreateTicketUseCase.test.js`):**

```javascript
it('AI failure: ticket created -> status pending_triage and still returns result', async () => {
  fakeAITriageService.setError(new Error('API unavailable'));
  const result = await useCase.execute(createTicketData());
  expect(result).toBeDefined();
  expect(result.status).toBe('pending_triage');
});
```

**Key design decisions:**

- AI errors are wrapped in `ExternalServiceError` — never exposed to customers
- `RetryHandler` uses exponential backoff: `baseDelay × 2^(attempt - 1)`
- Ticket creation and AI triage are intentionally decoupled — a triage failure is logged but never blocks ticket creation

---

### Prompt 4: Agent-Initiated Retriage Feature (Full-Stack)

**Prompt (verbatim):**

> "Add a retriage endpoint so that the agent can retriage tickets from the dashboard for tickets whose triaging failed. Add this prompt to the AI journey since it is an important and feature-rich prompt."

**Why it was complex:** This was a full-stack feature request that required changes across 7 files spanning 3 architectural layers. The AI needed to:

1. **Backend — Use Case (`RetriageTicketUseCase`):** Design a use case that validates only `pending_triage` or `triage_failed` tickets can be retriaged, resets `triage_attempts` to 0 for a fresh set of retries, creates an audit trail entry with `TRIAGE_STARTED` action (including the agent who initiated it), delegates to the existing `TriageTicketUseCase`, and gracefully handles triage re-failure (returns current ticket state instead of throwing).

2. **Backend — Controller & Routes:** Extend `TicketController` with a 5th constructor parameter and new `retriage()` method, add `POST /:id/retriage` route with auth middleware (agent-only, no public access).

3. **Backend — DI Container:** Wire `RetriageTicketUseCase` into the dependency injection container with proper dependency chain (`ticketRepository`, `ticketHistoryRepository`, `triageTicketUseCase`), pass it as the 5th parameter to `TicketController`, and expose it for test overrides.

4. **Frontend — API Client:** Add `retriageTicket()` function calling `POST /tickets/:id/retriage`.

5. **Frontend — Dashboard UI:** Add `retriagingId` state, a `handleRetriage` async handler with success/warning/error toasts (warning when triage didn't succeed but didn't throw), and pass callbacks to the table.

6. **Frontend — Ticket Table:** Add an "Actions" column with a "Retriage" button that only appears for `pending_triage` and `triage_failed` tickets, with loading state ("Triaging…") while the request is in flight.

**Key design decisions:**

- Resets `triage_attempts` to 0 before re-invoking `TriageTicketUseCase`, giving the ticket a full fresh set of retries rather than continuing from where it left off
- Records the agent who initiated the retriage in the audit trail (`performed_by_agent_id`), unlike initial triage which is system-initiated
- Uses `toast.warning()` (not error) when triage completes without success — the ticket isn't lost, just still pending
- The retriage button is conditionally rendered only for retriageable statuses, preventing UI clutter on already-triaged tickets
