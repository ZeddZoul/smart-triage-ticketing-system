# AI Journey — Smart Triage Ticketing System

> A comprehensive record of the AI-assisted development process: research, planning, complex prompts, errors, corrections, and lessons learned.

---

## 0. Pre-Development Research & Planning

### Understanding Smart Triage Systems

Before writing a single line of code or even drafting the specification, I conducted research — both manual and AI-assisted — to understand what a smart triage ticketing system is, how they work in industry, and what the established norms are.

**What I researched:**

- **Triage concepts:** How triage is used in support systems to classify and prioritize tickets — borrowed from medical triage where severity determines treatment order.
- **Industry norms:** Standard ticket lifecycle states (Open → In Progress → Resolved → Closed), standard classification categories (Billing, Technical Bug, Feature Request), and priority levels (High, Medium, Low).
- **AI classification patterns:** How LLMs are used for auto-categorization — sending title + description as context, receiving structured JSON with category and priority.
- **Graceful degradation:** The critical requirement that AI failure must never block ticket creation. This is a real-world constraint — you can't reject a customer's support request because your AI provider is down.
- **Clean Architecture applicability:** How to structure an AI-powered system so the AI service is a pluggable infrastructure detail, not a core dependency.

**How AI helped during research:**

I used AI to rapidly understand the domain, explore architectural patterns for AI-integrated systems, and identify edge cases I might otherwise miss (e.g., what happens when the AI returns a valid JSON but with an invalid category? What if the model hallucinates a new priority level?).

### Preparing the Scaffolding Prompt & V-Model Documents

Armed with this domain understanding, I then prepared the project's foundational documents using the **V-Model planning method** — a structured approach where each phase validates against the previous one:

1. **SPEC.md** — Vision, goals, non-functional requirements, and technology choices
2. **REQUIREMENTS.md** — 884 lines of traceable, testable functional requirements with acceptance criteria
3. **DESIGN.md** — Detailed technical design covering all layers, schemas, middleware, and error handling
4. **TASKS.md** — 110 sequenced tasks across 14 phases with dependency graph

This upfront planning investment paid off enormously. Because every requirement was traceable to a spec goal, and every task was traceable to a requirement, the actual implementation phase was remarkably smooth. The AI could generate accurate, context-aware code because the prompts referenced specific requirement IDs and design section numbers (e.g., "implement FR-02 per DESIGN.md §5.1"). This avoided the fluff that typically plagues AI-assisted development — where the AI guesses at requirements and produces generic boilerplate. Instead, every generated module had a clear purpose, clear interfaces, and clear test criteria from day one.

**Key lesson:** The time spent on structured planning before touching code minimized errors, avoided rework, and made the AI significantly more effective as a development partner. The V-Model documents served as a shared contract between me and the AI — eliminating ambiguity.

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

- Resets `triage_attempts` to 0 before re-invoking `TriageTicketUseCase`, giving the ticket a full fresh set of retries
- Records the agent who initiated the retriage in the audit trail (`performed_by_agent_id`), unlike initial triage which is system-initiated
- Uses `toast.warning()` (not error) when triage completes without success — the ticket isn't lost, just still pending
- The retriage button is conditionally rendered only for retriageable statuses, preventing UI clutter

---

### Prompt 5: Multi-Feature Enhancement (Search, Stats, Registration, AI Journey)

**Prompt (paraphrased):**

> "Implement agent registration page, text search across ticket titles/descriptions, dashboard stats with counts by status/priority/category, remove dashboard link from navbar, update README with routes, and rewrite the AI Journey document with full research context."

**Why it was complex:** This was a batch feature request touching 12+ files across the full stack. Each sub-feature required different skills:

- **Registration page:** New React component with Zod validation (including confirm password with `.refine()`), new Next.js route, cross-linking between login/register forms.
- **Search:** Full-stack implementation — backend Zod validator update, MongoDB `$regex` with `$or` across title and description, use case filter propagation, fake repository update for test compatibility, frontend debounced input with 400ms delay.
- **Dashboard stats:** Summary cards computing counts from the current ticket dataset, responsive grid layout.
- **Navbar refactor:** Strategic UX decision to hide the dashboard link from navigation (since it's an internal tool for assessors to test directly via URL).

**Result:** All features implemented cohesively. The search uses case-insensitive regex with proper escaping of special characters to prevent regex injection. The stats component provides at-a-glance visibility into the ticket pipeline health.

---

### Prompt 6: Ticket Detail Page with History Timeline (Full-Stack)

**Prompt (paraphrased):**

> "Add a ticket detail page at `/tickets/:id` so agents can view the full description, update status, retriage, and see the complete activity history timeline."

**Why it was complex:** This required a new backend endpoint, a new use case, DI wiring, and a rich frontend page:

1. **Backend — `GetTicketHistoryUseCase`:** New use case that validates the ticket exists (throws `NotFoundError` if not), then fetches all history records sorted chronologically.
2. **Backend — New Route:** `GET /api/tickets/:id/history` with auth middleware, `getHistory` controller method, wired through the DI container as the 6th constructor parameter.
3. **Frontend — Detail Page:** Full ticket view with a 2-column layout (description card + details sidebar), inline `StatusSelect` for status updates, retriage button for failed tickets, and a visual activity timeline.
4. **History Timeline Component:** Custom timeline with colored dots per action type (blue for created, green for triage completed, red for triage failed, purple for status changed), showing status transitions, category/priority assignments, agent IDs, and notes.
5. **Navigation Integration:** Ticket titles in the dashboard table are now clickable `<Link>` elements that navigate to the detail page. Auth guard layout ensures unauthenticated users are redirected.

**Key design decisions:**

- The detail page fetches ticket and history in parallel (`Promise.all`) for faster load
- After any status change or retriage, both ticket and history are re-fetched to keep the timeline current
- The timeline renders newest-last (chronological) to read like a natural activity log
- Agent IDs are shown as last-6-character suffixes for readability without exposing full IDs

---

### Prompt 7: UI/UX Polish & Public-Facing Cleanup

**Prompt (paraphrased across multiple iterations):**

> "Fix the textarea shrinking issue. Make the ticket form and login form wider. Remove the Dashboard link from the navbar. Remove the Agent Login and Submit Ticket buttons from the navbar — the public UI should only show the ticket submission form. Document agent access routes in the README instead."

**Why it was complex:** This was a UX-driven series of refinements requiring careful reasoning about what a public-facing customer sees versus what an internal agent needs. The key decision was to intentionally hide all agent-facing routes (`/login`, `/register`, `/dashboard`) from the public navigation — customers should only see the clean ticket submission form. Agent routes are accessed via direct URLs documented in the README.

**Changes made:**

- **Textarea fix:** Replaced CSS `field-sizing-content` (which caused the textarea to collapse to 1 line) with `min-h-[120px]` and `resize-y` for a proper default height with manual resize capability.
- **Form widths:** Changed both `ticket-form.tsx` and `login-form.tsx` from narrow `max-w-md` to `w-full max-w-xl` for better readability on desktop.
- **Navbar simplification:** The unauthenticated state renders no buttons at all (just the logo). Authenticated state shows agent name + Logout. This creates a clean separation between the customer-facing and agent-facing experiences.
- **README documentation:** Added an "Agent Access" section with direct URLs to `/login`, `/register`, `/dashboard` and the default seeded credentials.

**Key design decision:** Rather than adding role-based conditional rendering in the navbar, the cleaner solution was to make the public UI completely unaware of the agent portal. This follows the principle of least privilege in UX — customers don't need to know an agent portal exists.

---

### Prompt 8: Backend Folder Restructure for Monorepo Layout

**Prompt (verbatim):**

> "Since we have a frontend folder, let us also have a backend folder for uniformity. The steering and docs should remain in root folder as they are not specific to one."

**Why it was complex:** This was a structural refactoring that required moving all backend source code, tests, configuration files, and build artifacts into a `backend/` subdirectory — while ensuring that all relative import paths, Docker build contexts, environment file references, CI scripts, and documentation stayed consistent. The risk was breaking the 187-test suite or the Docker setup with a misplaced path.

**What moved to `backend/`:**

- `src/`, `tests/` — all source and test code
- `package.json`, `pnpm-lock.yaml` — dependency manifest
- `jest.config.js`, `.eslintrc.json`, `.prettierrc` — tooling config
- `.env`, `.env.example` — environment configuration
- `Dockerfile` — container build

**What stayed in root (project-level):**

- `README.md`, `AI_JOURNEY.md` — documentation
- `docs/` (SPEC, REQUIREMENTS, DESIGN, TASKS) — steering documents
- `.steering/` — project steering
- `docker-compose.yml` — orchestrates both backend and frontend
- `.gitignore` — covers the entire repo

**Key updates:**

- `docker-compose.yml`: Backend build context changed from `.` to `./backend`, env_file from `.env` to `./backend/.env`
- `README.md`: All manual setup commands, testing commands, and project structure tree updated
- No import/require path changes needed — `src/` and `tests/` maintain their relative positions within `backend/`

**Verification:** All 187 tests passed immediately after the move, confirming that the restructure was purely organizational with zero functional impact.

---

## 2. AI Errors, Hallucinations & Corrections

### Error 1: Frontend-Backend Data Format Mismatch

**What happened:** After implementing the full backend and frontend independently (as the V-Model allowed parallel tracks after Phase 1), we connected them for the first time during manual testing. The frontend immediately broke with the error:

> `Cannot read properties of undefined (reading 'id')`

**Root cause:** The AI generated the frontend API client (`api.ts`) expecting backend responses to be wrapped in a `{ data: Ticket }` envelope:

```typescript
// What the AI generated (WRONG)
export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  const response = await apiFetch<{ data: Ticket }>('/tickets', { ... });
  return response.data; // ← Expected { data: { id, title, ... } }
}
```

But the backend controllers return ticket objects directly (not wrapped):

```javascript
// What the backend actually returns
res.status(201).json(ticket); // → { id, title, status, ... }
```

So `response.data` was `undefined`, and accessing `undefined.id` threw the error.

**How it was caught:** Through manual testing — the very first ticket submission from the frontend UI triggered the error toast. This is exactly the kind of integration mismatch that unit tests can't catch (both sides tested fine in isolation), highlighting why end-to-end testing matters.

**The fix:** Updated four API functions (`createTicket`, `getTicketById`, `updateTicketStatus`, `registerAgent`) to read the response directly without unwrapping:

```typescript
// Fixed
export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  return apiFetch<Ticket>('/tickets', { ... }); // ← Direct, no .data wrapper
}
```

**Lesson:** When the AI generates client and server code in separate phases, it can make inconsistent assumptions about response shapes. This wasn't a hallucination per se — both patterns (wrapped vs. direct) are valid — but the AI didn't maintain consistency between the two codebases. The V-Model's integration testing phase (Phase 8) caught backend-internal issues, but the frontend-backend integration gap was only exposed during manual testing. This reinforces the importance of contract testing or shared response schemas in full-stack AI-generated projects.

---

### Error 2: Timing-Dependent Test Failure in Ticket Entity

**What happened:** After generating the `Ticket.test.js` test suite, one test intermittently failed:

```javascript
// Original (buggy) test
it("updates updated_at on transitionTo", () => {
  const ticket = createTicket({ status: "Open" });
  const before = new Date("2099-01-01"); // Hardcoded future date
  ticket.transitionTo("In Progress");
  expect(ticket.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
});
```

The test used a hardcoded future date (`2099-01-01`) as the comparison baseline. Since `transitionTo()` sets `updated_at = new Date()` (current time), the assertion `current >= future` always failed.

**AI's correction:** The test was rewritten to use a dynamically computed baseline:

```javascript
it("updates updated_at on transitionTo", () => {
  const ticket = createTicket({ status: "Open" });
  const before = new Date(Date.now() - 1000); // 1 second ago
  ticket.transitionTo("In Progress");
  expect(ticket.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
});
```

**Lesson:** AI-generated tests with hardcoded temporal values can introduce subtle timing bugs. Always use relative timestamps (`Date.now()`) for time-comparison assertions.

---

### Error 3: Mongoose Deprecation Warning (`new` option)

**What happened:** The AI generated the `MongoTicketRepository.updateById` method using the Mongoose `{ new: true }` option:

```javascript
const doc = await TicketModel.findByIdAndUpdate(id, updateData, {
  new: true,
  runValidators: true,
  lean: true,
});
```

This produced a runtime warning:

> `[MONGOOSE] Warning: the 'new' option for findOneAndUpdate() is deprecated. Use returnDocument: 'after' instead.`

**The fix:** Replaced `{ new: true }` with `{ returnDocument: 'after' }`.

**Lesson:** AI models are trained on data with a cutoff date and can generate code using APIs that have since been deprecated. This is a minor form of "knowledge staleness" rather than hallucination — the code was correct for older Mongoose versions but outdated for the version we installed.

---

### Note on Hallucinations

Throughout this project, the AI did **not** produce hallucinated API calls, invented library functions, or fabricated features. The errors described above were all **consistency errors** (frontend/backend mismatch), **temporal bugs** (hardcoded dates), or **knowledge staleness** (deprecated APIs) — not hallucinations in the traditional sense. This is largely attributable to the comprehensive V-Model planning documents that gave the AI specific, verifiable requirements to work against rather than allowing it to invent solutions.

---

## 3. RBAC Verification Scenario

### How to implement Role-Based Access Control

The system already defines three roles in `backend/src/entities/enums.js`:

```javascript
const AgentRole = Object.freeze({
  AGENT: "agent",
  ADMIN: "admin",
  READ_ONLY: "read_only",
});
```

**Implementation steps:**

1. **Create `authorize(requiredRoles)` middleware** in `backend/src/infrastructure/middleware/`:

```javascript
function authorize(requiredRoles) {
  return (req, res, next) => {
    if (!req.agent || !requiredRoles.includes(req.agent.role)) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      });
    }
    next();
  };
}
```

2. **Apply to routes** in `backend/src/routes/ticketRoutes.js`:

```javascript
router.get(
  "/",
  auth,
  authorize(["agent", "admin", "read_only"]),
  validate(ticketQuerySchema, "query"),
  controller.getAll,
);
router.patch(
  "/:id",
  auth,
  authorize(["agent", "admin"]),
  validate(updateTicketStatusSchema),
  controller.updateStatus,
);
```

3. **Protect registration** in `backend/src/routes/authRoutes.js`:

```javascript
router.post(
  "/register",
  auth,
  authorize(["admin"]),
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

3. **Retry with backoff** → `RetryHandler` implements exponential backoff (base delay × 2^attempt). After `MAX_TRIAGE_RETRIES` (default 3) failures, the ticket status transitions to `triage_failed`, and a `TRIAGE_FAILED` history record is logged.

4. **Manual recovery** → Agents see `triage_failed` tickets in the dashboard. They can click "Retriage" to re-run AI classification, or manually update the status to `Open`.

5. **Agent-initiated retriage** → The `RetriageTicketUseCase` resets `triage_attempts` to 0 and delegates to `TriageTicketUseCase` for a fresh set of retries. If it fails again, the ticket remains in its current state (no error thrown to the agent).

**Verification test (from `backend/tests/unit/useCases/CreateTicketUseCase.test.js`):**

```javascript
it("AI failure: ticket created -> status pending_triage and still returns result", async () => {
  fakeAITriageService.setError(new Error("API unavailable"));
  const result = await useCase.execute(createTicketData());
  expect(result).toBeDefined();
  expect(result.status).toBe("pending_triage");
});
```

**Key design decisions:**

- AI errors are wrapped in `ExternalServiceError` — never exposed to customers
- `RetryHandler` uses exponential backoff: `baseDelay × 2^(attempt - 1)`
- Ticket creation and AI triage are intentionally decoupled — a triage failure is logged but never blocks ticket creation
- The system provides both automated (retriage button) and manual (status update) recovery paths
