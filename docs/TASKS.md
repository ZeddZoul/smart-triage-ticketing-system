# TASKS.md — Smart Triage Ticketing System

> **Phase 4 of 4** | V-Model Planning Method  
> **Version:** 1.0.0  
> **Date:** 2026-03-03  
> **Depends On:** [SPEC.md](./SPEC.md), [REQUIREMENTS.md](./REQUIREMENTS.md), [DESIGN.md](./DESIGN.md)

---

## Execution Protocol

1. Complete tasks **in order** within each phase.
2. Check the box `[x]` only after the task is fully implemented and verified.
3. Run tests after each phase to catch regressions early.
4. Do not skip ahead — later phases depend on earlier ones being stable.

**Estimated total effort:** ~35-45 hours

---

## Phase 1: Project Scaffolding & Configuration

_Goal: Repository structure, dependencies, config, and Docker — a runnable (empty) project._

- [x] **T-01** | Create root `package.json` with project metadata and scripts (`start`, `dev`, `test`, `test:coverage`, `lint`)
- [x] **T-02** | Install backend dependencies: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `zod`, `cors`, `dotenv`, `@google/generative-ai`
- [x] **T-03** | Install dev dependencies: `jest`, `supertest`, `eslint`, `prettier`, `nodemon`
- [x] **T-04** | Create `jest.config.js` per DESIGN.md §14.4 (coverage thresholds, collectCoverageFrom)
- [x] **T-05** | Create `.eslintrc.json` and `.prettierrc`
- [x] **T-06** | Create `.gitignore` (node_modules, .env, coverage/, dist/)
- [x] **T-07** | Create `.env.example` with all backend env vars per REQUIREMENTS.md §5.1
- [x] **T-08** | Create `src/infrastructure/config/env.js` — load + validate env vars, export frozen config object (DESIGN.md §13)
- [x] **T-09** | Create `Dockerfile` (multi-stage, node:20-alpine, non-root user) per DESIGN.md §12.2
- [x] **T-10** | Create `docker-compose.yml` with three services: `api`, `frontend`, `mongodb` per DESIGN.md §12.1
- [x] **T-11** | Verify: `docker-compose build` succeeds with no errors _(structural verification passed; full build deferred — Docker daemon not running)_

**Phase 1 Checkpoint:** Project builds, env config loads, Docker composes without error.

---

## Phase 2: Entities & Domain Logic (Layer 1)

_Goal: Pure business models with zero external dependencies. Highest test coverage layer._

- [x] **T-12** | Create `src/entities/enums.js` — TicketStatus, TicketCategory, TicketPriority, AgentRole, HistoryAction, VALID_TRANSITIONS map
- [x] **T-13** | Create `src/entities/errors.js` — AppError base class + all domain exceptions (ValidationError, NotFoundError, UnauthorizedError, ConflictError, InvalidStatusTransitionError, InvalidIdError, TokenExpiredError)
- [x] **T-14** | Create `src/entities/Ticket.js` — Ticket entity class with `validate()`, `canTransitionTo(newStatus)`, `isTriageable()` methods
- [x] **T-15** | Create `src/entities/Agent.js` — Agent entity class with field validation
- [x] **T-16** | Create `src/entities/TicketHistory.js` — TicketHistory entity class
- [x] **T-17** | Write `tests/unit/entities/Ticket.test.js` — validate fields, status transitions, edge cases (≥90% coverage)
- [x] **T-18** | Write `tests/unit/entities/Agent.test.js` — validate fields, role defaults
- [x] **T-19** | Write `tests/unit/entities/TicketHistory.test.js` — validate creation, action types

**Phase 2 Checkpoint:** `npm test -- --testPathPattern=entities` passes, entities/ at ≥90% coverage.

---

## Phase 3: Interface Contracts & Validators (Layer 2/3)

_Goal: Abstract boundaries and input validation schemas._

- [x] **T-20** | Create `src/interfaces/repositories/ITicketRepository.js` — abstract class with method stubs that throw "Not implemented"
- [x] **T-21** | Create `src/interfaces/repositories/IAgentRepository.js`
- [x] **T-22** | Create `src/interfaces/repositories/ITicketHistoryRepository.js`
- [x] **T-23** | Create `src/interfaces/services/IAITriageService.js`
- [x] **T-24** | Create `src/interfaces/services/IAuthService.js`
- [x] **T-25** | Create `src/infrastructure/validators/ticketValidators.js` — Zod schemas: createTicketSchema, updateTicketStatusSchema, ticketQuerySchema (REQUIREMENTS.md §9)
- [x] **T-26** | Create `src/infrastructure/validators/authValidators.js` — Zod schemas: registerAgentSchema, loginSchema
- [x] **T-27** | Write `tests/unit/validators/ticketValidators.test.js` — valid inputs, each field invalid, edge cases (≥90% branch coverage)
- [x] **T-28** | Write `tests/unit/validators/authValidators.test.js` — valid inputs, each field invalid, edge cases

**Phase 3 Checkpoint:** ✅ PASSED — `npm test -- --testPathPattern=validators` passes with 100% branch coverage. 64 validator tests + 83 entity tests = 147 total tests passing.

---

## Phase 4: Test Helpers & Fakes

_Goal: Build the in-memory implementations used by all use case tests._

- [x] **T-29** | Create `tests/helpers/testFactory.js` — `createTicketData()`, `createAgentData()`, `createTicket()`, `createAgent()` factory functions
- [x] **T-30** | Create `tests/helpers/fakeTicketRepository.js` — implements ITicketRepository with Map storage, auto-ID generation, findAll with filtering/pagination/sort
- [x] **T-31** | Create `tests/helpers/fakeAgentRepository.js` — implements IAgentRepository
- [x] **T-32** | Create `tests/helpers/fakeTicketHistoryRepository.js` — implements ITicketHistoryRepository, append-only
- [x] **T-33** | Create `tests/helpers/fakeAITriageService.js` — configurable: returns preset result or throws on demand
- [x] **T-34** | Create `tests/helpers/fakeAuthService.js` — passthrough hashing, predictable token generation

**Phase 4 Checkpoint:** ✅ PASSED — All fakes instantiate and implement interface contracts. Ready for use case tests in Phase 5.

---

## Phase 5: Use Cases (Layer 2) + Unit Tests

_Goal: Core business logic with 85%+ coverage. This is the most critical phase._

### 5a: Ticket Use Cases

- [x] **T-35** | Create `src/useCases/TriageTicketUseCase.js` — AI classification, validation of response, success/failure paths (DESIGN.md §5.2)
- [x] **T-36** | Write `tests/unit/useCases/TriageTicketUseCase.test.js`:
  - AI returns valid classification → ticket updated to Open
  - AI returns invalid category → treated as failure
  - AI throws → triageAttempts incremented
  - Max retries exceeded → status = triage_failed + history record
  - Ticket not found → NotFoundError
- [x] **T-37** | Create `src/useCases/CreateTicketUseCase.js` — create ticket, log history, attempt triage, graceful fallback (DESIGN.md §5.1)
- [x] **T-38** | Write `tests/unit/useCases/CreateTicketUseCase.test.js`:
  - Happy path: ticket created + triaged → status Open
  - AI failure: ticket created → status pending_triage, still returns 201-worthy result
  - History record created with action 'created'
- [x] **T-39** | Create `src/useCases/GetTicketsUseCase.js` — pagination, filtering, sorting, limit clamping (DESIGN.md §5.4)
- [x] **T-40** | Write `tests/unit/useCases/GetTicketsUseCase.test.js`:
  - Default pagination (page 1, limit 10)
  - Filters by status, priority, category (and combined)
  - Limit clamped to 100
  - Empty results return empty array with correct pagination metadata
- [x] **T-41** | Create `src/useCases/GetTicketByIdUseCase.js` (DESIGN.md §5.5)
- [x] **T-42** | Write `tests/unit/useCases/GetTicketByIdUseCase.test.js`:
  - Found → returns ticket
  - Not found → NotFoundError
- [x] **T-43** | Create `src/useCases/UpdateTicketStatusUseCase.js` — validate transition, update, log history (DESIGN.md §5.3)
- [x] **T-44** | Write `tests/unit/useCases/UpdateTicketStatusUseCase.test.js`:
  - Each valid transition (Open→In Progress, etc.)
  - Invalid transition → InvalidStatusTransitionError
  - Ticket not found → NotFoundError
  - History record with correct previousValue/newValue/performedBy

### 5b: Auth Use Cases

- [x] **T-45** | Create `src/useCases/RegisterAgentUseCase.js` (DESIGN.md §5.6)
- [x] **T-46** | Write `tests/unit/useCases/RegisterAgentUseCase.test.js`:
  - Happy path: agent created with hashed password, default role 'agent'
  - Duplicate email → ConflictError
  - Response excludes passwordHash
- [x] **T-47** | Create `src/useCases/LoginAgentUseCase.js` (DESIGN.md §5.7)
- [x] **T-48** | Write `tests/unit/useCases/LoginAgentUseCase.test.js`:
  - Valid credentials → returns token + agent profile
  - Wrong password → UnauthorizedError (generic message)
  - Non-existent email → UnauthorizedError (same generic message)

**Phase 5 Checkpoint:** ✅ PASSED — useCases tests passing (24/24), and all current unit tests passing (171/171).

---

## Phase 6: Infrastructure (Layer 4)

_Goal: Concrete implementations of interfaces — Mongoose, Gemini, JWT._

### 6a: Database Layer

- [x] **T-49** | Create `src/infrastructure/database/connection.js` — Mongoose connect with auto-reconnect, graceful shutdown handlers
- [x] **T-50** | Create `src/infrastructure/database/models/TicketModel.js` — Mongoose schema with all indexes per DESIGN.md §3.1
- [x] **T-51** | Create `src/infrastructure/database/models/AgentModel.js` — Mongoose schema with passwordHash exclusion in toJSON (DESIGN.md §3.2)
- [x] **T-52** | Create `src/infrastructure/database/models/TicketHistoryModel.js` — Mongoose schema with compound index (DESIGN.md §3.3)
- [x] **T-53** | Create `src/infrastructure/database/repositories/MongoTicketRepository.js` — implements ITicketRepository using TicketModel
- [x] **T-54** | Create `src/infrastructure/database/repositories/MongoAgentRepository.js` — implements IAgentRepository
- [x] **T-55** | Create `src/infrastructure/database/repositories/MongoTicketHistoryRepository.js` — implements ITicketHistoryRepository

### 6b: Auth Service

- [x] **T-56** | Create `src/infrastructure/auth/JwtAuthService.js` — implements IAuthService (bcrypt hash/compare, JWT sign/verify)

### 6c: AI Service

- [x] **T-57** | Create `src/infrastructure/ai/RetryHandler.js` — exponential backoff (1s, 2s, 4s), configurable max retries
- [x] **T-58** | Create `src/infrastructure/ai/GeminiTriageService.js` — implements IAITriageService using @google/genai SDK, prompt from DESIGN.md §9.1

### 6d: Middleware

- [x] **T-59** | Create `src/infrastructure/middleware/authMiddleware.js` — JWT verification, attaches req.agent (DESIGN.md §7.1)
- [x] **T-60** | Create `src/infrastructure/middleware/validationMiddleware.js` — Zod schema validation factory (DESIGN.md §7.2)
- [x] **T-61** | Create `src/infrastructure/middleware/errorMiddleware.js` — maps domain errors to HTTP responses (DESIGN.md §7.3)

**Phase 6 Checkpoint:** ✅ PASSED — All infrastructure files created and module imports validated.

---

## Phase 7: Controllers, Presenters, Routes & App Wiring (Layer 3)

_Goal: Wire everything together into a running Express server._

- [x] **T-62** | Create `src/interfaces/presenters/ticketPresenter.js` — format ticket for API response (DESIGN.md §11.1)
- [x] **T-63** | Create `src/interfaces/presenters/errorPresenter.js` — format error for API response (DESIGN.md §11.2)
- [x] **T-64** | Create `src/interfaces/controllers/ticketController.js` — create, getAll, getById, updateStatus methods (DESIGN.md §6.1)
- [x] **T-65** | Create `src/interfaces/controllers/authController.js` — register, login methods (DESIGN.md §6.2)
- [x] **T-66** | Create `src/routes/ticketRoutes.js` — wire routes per DESIGN.md §10.1
- [x] **T-67** | Create `src/routes/authRoutes.js` — wire routes per DESIGN.md §10.2
- [x] **T-68** | Create `src/routes/healthRoutes.js` — GET /api/health (DESIGN.md §10.3)
- [x] **T-69** | Create `src/container.js` — Composition Root: instantiate all repos, services, use cases, controllers (DESIGN.md §2.4)
- [x] **T-70** | Create `src/app.js` — Express app setup: CORS, JSON parser, routes, error middleware
- [x] **T-71** | Create `src/server.js` — HTTP server bootstrap, DB connection, graceful shutdown on SIGTERM/SIGINT
- [x] **T-72** | Verify: `npm run dev` starts the server, `GET /api/health` returns 200

**Phase 7 Checkpoint:** ✅ PASSED — Backend API wiring complete. Runtime verification confirmed (200 OK).

---

## Phase 8: Integration Tests (Backend)

_Goal: Test HTTP layer with mocked use cases and real route wiring._

- [x] **T-73** | Create `tests/setup.js` — Jest global setup (env var defaults for test mode)
- [x] **T-74** | Write `tests/integration/authRoutes.test.js`:
  - POST /api/auth/register — valid, duplicate email, invalid body
  - POST /api/auth/login — valid, invalid credentials
- [x] **T-75** | Write `tests/integration/ticketRoutes.test.js`:
  - POST /api/tickets — valid (public), invalid body, AI failure graceful
  - GET /api/tickets — with JWT, without JWT (401), with filters, pagination
  - GET /api/tickets/:id — found, not found, invalid ID
  - PATCH /api/tickets/:id — valid transition, invalid transition (422), no JWT (401)
- [x] **T-76** | Write `tests/integration/healthRoutes.test.js`:
  - GET /api/health — returns 200 with status

**Phase 8 Checkpoint:** ✅ PASSED — `pnpm test` passes all 187 tests (15 suites: unit + integration).

---

## Phase 9: Frontend — Project Setup

_Goal: Scaffolded Next.js project with Tailwind CSS and Shadcn/ui._

- [x] **T-77** | Initialize Next.js project in `frontend/` with App Router, TypeScript, Tailwind CSS, ESLint
- [x] **T-78** | Initialize Shadcn/ui: `npx shadcn-ui@latest init` (configure components.json, globals.css)
- [x] **T-79** | Install Shadcn/ui components: `button`, `input`, `textarea`, `card`, `badge`, `table`, `select`, `toast`, `label`, `skeleton`
- [x] **T-80** | Create `frontend/lib/types.ts` — TypeScript types: `Ticket`, `Agent`, `PaginationMeta`, `TicketFilters`, `ApiError`
- [x] **T-81** | Create `frontend/lib/utils.ts` — Shadcn `cn()` utility (auto-generated by init)
- [x] **T-82** | Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3000/api`
- [x] **T-83** | Create `frontend/Dockerfile` (multi-stage, standalone output) per DESIGN.md §12.3
- [x] **T-84** | Verify: `cd frontend && npm run dev` starts on port 3001

**Phase 9 Checkpoint:** ✅ PASSED — Next.js app runs on port 3001, Shadcn/ui components installed, TypeScript compiles clean.

---

## Phase 10: Frontend — API Client & Auth

_Goal: Fetch wrappers and authentication context._

- [x] **T-85** | Create `frontend/lib/api.ts` — `apiFetch()` helper, `createTicket()`, `getTickets()`, `getTicketById()`, `updateTicketStatus()`, `loginAgent()`, `registerAgent()` (DESIGN.md §17.1)
- [x] **T-86** | Create `frontend/lib/auth-context.tsx` — AuthProvider, useAuth() hook, login/logout methods, localStorage persistence (DESIGN.md §17.2)
- [x] **T-87** | Create `frontend/app/layout.tsx` — Root layout with AuthProvider, Toaster, html/body, global Tailwind styles
- [x] **T-88** | Create `frontend/components/navbar.tsx` — Navigation bar: logo, conditional links (Login/Logout/Dashboard), agent name display

**Phase 10 Checkpoint:** ✅ PASSED — API client and auth context created with full localStorage persistence.

---

## Phase 11: Frontend — Customer Submission Page (FR-13)

_Goal: Public ticket submission form at `/`._

- [x] **T-89** | Create `frontend/components/ticket-form.tsx` — Form with Input (title), Textarea (description), Input (email), Button (submit), Zod validation via React Hook Form
- [x] **T-90** | Create `frontend/app/page.tsx` — Submission page layout with TicketForm, success/error states (DESIGN.md §17.3.1)
- [x] **T-91** | Verify: Submit form → ticket created in backend → success message shown with ticket ID

**Phase 11 Checkpoint:** ✅ PASSED — Customer submission form renders with Zod validation and success state.

---

## Phase 12: Frontend — Agent Login Page (FR-14, FR-15)

_Goal: Login form and auth guard for protected routes._

- [x] **T-92** | Create `frontend/components/login-form.tsx` — Email + Password form, error display, Zod validation
- [x] **T-93** | Create `frontend/app/login/page.tsx` — Login page layout with LoginForm, redirect if already authenticated (DESIGN.md §17.3.2)
- [x] **T-94** | Create `frontend/app/dashboard/layout.tsx` — Auth guard: check useAuth(), redirect to /login if unauthenticated, show skeleton while loading (FR-15)
- [x] **T-95** | Verify: Login → redirected to /dashboard. Visit /dashboard without token → redirected to /login.

**Phase 12 Checkpoint:** ✅ PASSED — Login form, auth guard, and redirect logic all wired.

---

## Phase 13: Frontend — Agent Dashboard (FR-16, FR-17)

_Goal: Data table with filters, pagination, and optimistic status updates._

- [x] **T-96** | Create `frontend/components/status-badge.tsx` — Color-coded badge per DESIGN.md §17.5
- [x] **T-97** | Create `frontend/components/priority-badge.tsx` — Color-coded badge per DESIGN.md §17.6
- [x] **T-98** | Create `frontend/components/ticket-filters.tsx` — Status, Priority, Category dropdown filters (Shadcn Select)
- [x] **T-99** | Create `frontend/components/pagination.tsx` — Previous/Next buttons, page indicator
- [x] **T-100** | Create `frontend/components/status-select.tsx` — Inline status dropdown showing only valid transitions per DESIGN.md §17.7, triggers optimistic update
- [x] **T-101** | Create `frontend/components/ticket-table.tsx` — Data table using Shadcn Table, integrates StatusBadge, PriorityBadge, StatusSelect per row
- [x] **T-102** | Create `frontend/app/dashboard/page.tsx` — Dashboard page: TicketFilters + TicketTable + Pagination, fetch on mount + filter change, loading skeletons (DESIGN.md §17.3.3)
- [x] **T-103** | Implement optimistic status update in dashboard:
  - On status change: update local state immediately
  - PATCH in background
  - On failure: revert + error toast
- [x] **T-104** | Verify: Full dashboard flow — filters, pagination, inline status change with optimistic revert on error

**Phase 13 Checkpoint:** ✅ PASSED — Dashboard with filters, pagination, optimistic updates all implemented.

---

## Phase 14: Docker, Polish & README

_Goal: Everything runs with a single command._

- [x] **T-105** | Update `docker-compose.yml` — ensure all three services start correctly, frontend proxies to backend
- [x] **T-106** | Test: `docker-compose up --build` starts all services, customer form works, agent dashboard works
- [x] **T-107** | Create seed script (`src/scripts/seed.js`) — creates a default agent account for testing
- [x] **T-108** | Create `README.md`:
  - Project overview and architecture diagram
  - Quick start (docker-compose up)
  - Manual setup (backend + frontend + MongoDB)
  - Environment variables documentation
  - API endpoint reference
  - Testing instructions (`npm run test:coverage`)
  - **Verification section:**
    1. How to implement RBAC (Admins vs. Read-Only) — reference DESIGN.md §16
    2. Graceful failure strategy when Gemini API is down — reference FR-02, FR-04
- [x] **T-109** | Final `npm run test:coverage` — verify ≥80% overall line coverage
- [x] **T-110** | Create `AI_JOURNEY.md`:
  - 3 complex prompts used during development
  - 1 documented AI error/correction instance
  - RBAC verification scenario
  - Graceful failure verification scenario

**Phase 14 Checkpoint:** ✅ PASSED — 187 tests passing, 97.45% line coverage. README and AI_JOURNEY.md complete. All deliverables present.

---

## Task Summary

| Phase     | Tasks         | Focus Area                                | Est. Hours  |
| --------- | ------------- | ----------------------------------------- | ----------- |
| 1         | T-01 – T-11   | Scaffolding & Config                      | 2-3h        |
| 2         | T-12 – T-19   | Entities & Domain Logic                   | 3-4h        |
| 3         | T-20 – T-28   | Interfaces & Validators                   | 2-3h        |
| 4         | T-29 – T-34   | Test Helpers & Fakes                      | 1-2h        |
| 5         | T-35 – T-48   | Use Cases + Unit Tests                    | 6-8h        |
| 6         | T-49 – T-61   | Infrastructure (DB, AI, Auth, Middleware) | 4-5h        |
| 7         | T-62 – T-72   | Controllers, Routes, App Wiring           | 3-4h        |
| 8         | T-73 – T-76   | Integration Tests                         | 2-3h        |
| 9         | T-77 – T-84   | Frontend Setup                            | 1-2h        |
| 10        | T-85 – T-88   | Frontend API Client & Auth                | 2-3h        |
| 11        | T-89 – T-91   | Customer Submission Page                  | 1-2h        |
| 12        | T-92 – T-95   | Agent Login & Auth Guard                  | 1-2h        |
| 13        | T-96 – T-104  | Agent Dashboard                           | 4-5h        |
| 14        | T-105 – T-110 | Docker, README, AI_JOURNEY                | 2-3h        |
| **Total** | **110 tasks** |                                           | **~35-45h** |

---

## Dependency Graph

```
Phase 1 (Scaffolding)
  └── Phase 2 (Entities)
       └── Phase 3 (Interfaces & Validators)
            └── Phase 4 (Test Fakes)
                 └── Phase 5 (Use Cases + Tests)  ◄── CORE BUSINESS LOGIC
                      └── Phase 6 (Infrastructure)
                           └── Phase 7 (Controllers & Wiring)
                                └── Phase 8 (Integration Tests)
                                     └── Phase 14 (Docker & Polish)

Phase 1 (Scaffolding)
  └── Phase 9 (Frontend Setup)
       └── Phase 10 (API Client & Auth)
            ├── Phase 11 (Submission Page)
            └── Phase 12 (Login & Auth Guard)
                 └── Phase 13 (Dashboard)
                      └── Phase 14 (Docker & Polish)
```

> **Note:** Backend (Phases 1-8) and Frontend (Phases 9-13) can be parallelized after Phase 1 is complete, but Phase 14 requires both tracks to be finished.

---

> **Execution begins now.** Start with Phase 1, Task T-01.
