# SPEC.md — Smart Triage Ticketing System

> **Phase 1 of 4** | V-Model Planning Method  
> **Version:** 1.0.0  
> **Date:** 2026-03-03  
> **Author:** Architecture Team (AI-Assisted)

---

## 1. Vision Statement

The **Smart Triage Ticketing System** is an AI-augmented customer support platform that eliminates the manual overhead of categorizing and prioritizing incoming tickets. When a customer submits a support request, the system automatically invokes a Large Language Model (Google Gemini) to classify the ticket's **category** (e.g., Billing, Technical Bug, Feature Request) and **priority** (High, Medium, Low) — then surfaces the enriched ticket to authenticated Support Agents on a real-time dashboard.

The system is a **full-stack application** consisting of:

- **Backend (Express.js):** The single source of truth for ticket lifecycle management, AI triage, and authentication.
- **Frontend (Next.js):** A customer-facing submission form and an agent-facing dashboard for ticket management.

The system must be:

- **Deterministic**: Given the same inputs, CRUD operations always produce the same state transitions.
- **Resilient**: If the AI provider is unavailable, the system degrades gracefully — tickets are saved and queued for deferred triage.
- **Auditable**: Every mutation (creation, status change, triage result) is logged with actor identity and timestamp.
- **Testable**: Business logic is completely decoupled from frameworks, enabling 80%+ unit test coverage without spinning up databases or HTTP servers.
- **Accessible**: The frontend uses a standardized design system (Shadcn/ui) for a clean, accessible, and professional interface.

---

## 2. Problem Domain

| Pain Point                  | Current State                                          | Target State                                          |
| --------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| Manual categorization       | Agents read every ticket and tag it by hand            | AI auto-classifies on submission                      |
| Inconsistent prioritization | Priority depends on which agent reads the ticket first | AI applies uniform priority rules                     |
| Slow first-response time    | Tickets sit in an unsorted queue                       | High-priority tickets surface immediately             |
| No audit trail              | Status changes are untracked                           | Full history of every mutation with actor + timestamp |
| Fragile integrations        | If an external service fails, the whole flow breaks    | Circuit-breaker pattern with retry queue              |

---

## 3. Personas

### 3.1 Customer (Unauthenticated)

- **Goal:** Submit a support ticket quickly via a simple public form.
- **Frontend Interaction:** Visits the public submission page (`/`), fills in title, description, and email, and submits.
- **Backend Interaction:** `POST /api/tickets` — provides `title`, `description`, `customer_email`.
- **Expectations:** Sees a success confirmation after submission. Does not see the dashboard. The form provides client-side validation and clear error feedback.

### 3.2 Support Agent (Authenticated)

- **Goal:** View, filter, and manage tickets on a dashboard.
- **Frontend Interaction:**
  - Logs in via a login page (`/login`) which stores the JWT in client state.
  - Views the protected dashboard (`/dashboard`) showing a data table or Kanban board of all tickets.
  - Filters tickets by status, priority, and category using dropdown controls.
  - Changes ticket status directly from the dashboard via inline controls (optimistic UI updates — no full page reload).
- **Backend Interaction:**
  - `GET /api/tickets` — paginated, filterable list of all tickets.
  - `PATCH /api/tickets/:id` — update ticket status (`Open` → `In Progress` → `Resolved`).
- **Expectations:** Only sees tickets after logging in via JWT. Dashboard reflects changes instantly with optimistic updates, reverting on error.

### 3.3 System / AI Actor (Internal)

- **Goal:** Automatically enrich every new ticket with `category` and `priority`.
- **Interactions:** Internal use case triggered after ticket creation — calls Gemini API, parses structured JSON response, updates the ticket record.
- **Expectations:** If the AI call fails, the ticket is persisted with `pending_triage` status and the system retries autonomously.

---

## 4. System Goals & Quality Attributes

| ID   | Goal                                           | Metric                                                                                              | Priority   |
| ---- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------- |
| G-01 | AI-powered triage on every new ticket          | 100% of tickets receive a triage attempt within 30 seconds of creation                              | **Must**   |
| G-02 | Graceful degradation when AI is unavailable    | 0% ticket creation failures due to AI downtime; tickets saved as `pending_triage`                   | **Must**   |
| G-03 | JWT-secured agent dashboard                    | All `/api/tickets` GET/PATCH routes return 401 without valid token                                  | **Must**   |
| G-04 | Auditable status transitions                   | Every PATCH generates a `TicketHistory` record with agentId + timestamp                             | **Should** |
| G-05 | 80%+ unit test coverage on core business logic | Jest coverage report on `entities/`, `useCases/`, and `validators/`                                 | **Must**   |
| G-06 | Sub-200ms p95 response time for CRUD endpoints | Measured under 100 concurrent connections (excluding AI latency)                                    | **Should** |
| G-07 | Containerized one-command setup                | `docker-compose up` spins up API + MongoDB, fully functional                                        | **Must**   |
| G-08 | Retry mechanism with circuit breaker           | Failed AI calls retry up to 3 times with exponential backoff before marking `triage_failed`         | **Should** |
| G-09 | Public ticket submission form                  | Customer can submit a ticket via a clean, validated form with success/error feedback                | **Must**   |
| G-10 | Authenticated agent dashboard                  | Agents log in and see a filterable, paginated data table of tickets with inline status updates      | **Must**   |
| G-11 | Consistent design system                       | All frontend pages use Shadcn/ui components with Tailwind CSS for a professional, accessible UI     | **Must**   |
| G-12 | Optimistic UI updates                          | Status changes on the dashboard reflect immediately without a full page reload; revert on API error | **Should** |

---

## 5. Architectural Philosophy: Clean Architecture

The backend strictly follows **Clean Architecture** (Robert C. Martin) to guarantee that business logic is framework-agnostic and independently testable.

### 5.1 Layer Dependency Rule

```
  ┌─────────────────────────────────────────────┐
  │           Frameworks & Drivers               │
  │  (Express, Mongoose, Gemini SDK, JWT lib)    │
  ├─────────────────────────────────────────────┤
  │           Interface Adapters                 │
  │  (Controllers, Presenters, Gateways)         │
  ├─────────────────────────────────────────────┤
  │           Application Use Cases              │
  │  (CreateTicket, TriageTicket, UpdateStatus)  │
  ├─────────────────────────────────────────────┤
  │           Enterprise Entities                │
  │  (Ticket, Agent, TicketHistory)              │
  └─────────────────────────────────────────────┘

  Dependencies point INWARD only.
  Inner layers NEVER import from outer layers.
```

### 5.2 Key Principles

| Principle                 | Application in This System                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependency Inversion**  | Use cases depend on **repository interfaces** (abstract), not on Mongoose models (concrete). Infrastructure implements those interfaces.                                          |
| **Single Responsibility** | Each use case class does exactly one thing: `CreateTicketUseCase`, `TriageTicketUseCase`, `UpdateTicketStatusUseCase`, `GetTicketsUseCase`.                                       |
| **Interface Segregation** | The `ITicketRepository` interface exposes only what use cases need (`create`, `findById`, `findAll`, `updateStatus`). Mongoose-specific methods stay in the infrastructure layer. |
| **Open/Closed**           | Adding a new AI provider (e.g., swapping Gemini for Claude) requires only a new `IAITriageService` implementation — zero changes to use cases.                                    |
| **Testability**           | Use cases accept repository and service interfaces via constructor injection. Tests inject in-memory fakes — no database, no network.                                             |

### 5.3 Frontend Architecture: Next.js App Router

The frontend follows **Next.js App Router** conventions with a clear separation between public and protected routes:

```
  ┌─────────────────────────────────────────────┐
  │           UI Components (Shadcn/ui)          │
  │  (Button, Input, Table, Badge, Card, Dialog) │
  ├─────────────────────────────────────────────┤
  │           Page Components                    │
  │  (SubmitForm, LoginForm, Dashboard)          │
  ├─────────────────────────────────────────────┤
  │           API Client Layer                   │
  │  (fetch wrappers for /api/tickets, /auth)    │
  ├─────────────────────────────────────────────┤
  │           Auth Context / Middleware          │
  │  (JWT storage, protected route guard)        │
  └─────────────────────────────────────────────┘
```

| Principle                        | Frontend Application                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Route-based code splitting**   | Next.js App Router automatically splits pages — `/` (public), `/login` (public), `/dashboard` (protected).                           |
| **Server vs. Client components** | Pages use Client Components for interactivity (forms, filters, optimistic updates). Layout and static content use Server Components. |
| **Standardized UI**              | All components built on Shadcn/ui primitives — ensures consistency, accessibility (ARIA), and theming.                               |
| **Optimistic Updates**           | Dashboard status changes update local state immediately, then sync with the API. On error, revert and show a toast.                  |
| **Auth Guard**                   | A middleware or context provider checks for JWT before rendering `/dashboard`. Redirects to `/login` if unauthenticated.             |

### 5.4 Separation of Concerns Map

| Concern                              | Layer                | Location                                          | Depends On                                              |
| ------------------------------------ | -------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Ticket data shape & validation rules | **Entity**           | `src/entities/Ticket.js`                          | Nothing                                                 |
| Agent data shape                     | **Entity**           | `src/entities/Agent.js`                           | Nothing                                                 |
| "Create a ticket and trigger triage" | **Use Case**         | `src/useCases/CreateTicketUseCase.js`             | Entity, `ITicketRepository`, `IAITriageService`         |
| "Classify ticket via AI"             | **Use Case**         | `src/useCases/TriageTicketUseCase.js`             | Entity, `IAITriageService`, `ITicketRepository`         |
| "Update ticket status"               | **Use Case**         | `src/useCases/UpdateTicketStatusUseCase.js`       | Entity, `ITicketRepository`, `ITicketHistoryRepository` |
| "List tickets with filters"          | **Use Case**         | `src/useCases/GetTicketsUseCase.js`               | `ITicketRepository`                                     |
| HTTP request/response mapping        | **Controller**       | `src/controllers/ticketController.js`             | Use Cases                                               |
| Auth token verification              | **Middleware**       | `src/infrastructure/middleware/authMiddleware.js` | JWT library                                             |
| Input validation schemas             | **Middleware**       | `src/infrastructure/validators/`                  | Zod                                                     |
| MongoDB persistence                  | **Infrastructure**   | `src/infrastructure/database/`                    | Mongoose, Entity                                        |
| Gemini API client                    | **Infrastructure**   | `src/infrastructure/ai/GeminiTriageService.js`    | Gemini SDK, `IAITriageService` interface                |
| Retry / Circuit Breaker              | **Infrastructure**   | `src/infrastructure/ai/RetryHandler.js`           | —                                                       |
| Customer ticket submission form      | **Frontend Page**    | `frontend/app/page.tsx`                           | API Client, Shadcn/ui                                   |
| Agent login form                     | **Frontend Page**    | `frontend/app/login/page.tsx`                     | API Client, Auth Context                                |
| Agent dashboard (ticket table)       | **Frontend Page**    | `frontend/app/dashboard/page.tsx`                 | API Client, Auth Context, Shadcn/ui                     |
| API client (fetch wrappers)          | **Frontend Lib**     | `frontend/lib/api.ts`                             | Backend REST API                                        |
| Auth context (JWT state)             | **Frontend Context** | `frontend/lib/auth-context.tsx`                   | Browser localStorage                                    |

---

## 6. Core Domain Model (Conceptual)

### 6.1 Ticket Lifecycle (State Machine)

```
  ┌───────────┐   AI Success   ┌────────┐   Agent    ┌─────────────┐   Agent    ┌──────────┐
  │  Created   │ ─────────────▶ │  Open  │ ─────────▶ │ In Progress │ ─────────▶ │ Resolved │
  └───────────┘                 └────────┘            └─────────────┘            └──────────┘
        │                                                                              │
        │  AI Failure                                                                  │
        ▼                                                                              │
  ┌────────────────┐   Retry Success   ┌────────┐                                     │
  │ pending_triage  │ ────────────────▶ │  Open  │                                     │
  └────────────────┘                    └────────┘                                     │
        │                                                                              │
        │  Max retries exceeded                                                        │
        ▼                                                                              │
  ┌───────────────┐                                                                    │
  │ triage_failed │  (Manual triage required by agent)                                 │
  └───────────────┘                                                                    │
```

### 6.2 Ticket Entity (Conceptual Fields)

| Field            | Type         | Description                                                            |
| ---------------- | ------------ | ---------------------------------------------------------------------- |
| `id`             | ObjectId     | MongoDB-generated unique identifier                                    |
| `title`          | String       | Short summary of the issue (required, 5-200 chars)                     |
| `description`    | String       | Detailed issue description (required, 10-5000 chars)                   |
| `customer_email` | String       | Submitter's email address (required, valid email)                      |
| `status`         | Enum         | `Open`, `In Progress`, `Resolved`, `pending_triage`, `triage_failed`   |
| `category`       | Enum \| null | `Billing`, `Technical Bug`, `Feature Request`, or `null` before triage |
| `priority`       | Enum \| null | `High`, `Medium`, `Low`, or `null` before triage                       |
| `triageAttempts` | Number       | Count of AI classification attempts (for retry logic)                  |
| `createdAt`      | DateTime     | Timestamp of ticket creation                                           |
| `updatedAt`      | DateTime     | Timestamp of last modification                                         |

### 6.3 Agent Entity (Conceptual Fields)

| Field          | Type     | Description                                           |
| -------------- | -------- | ----------------------------------------------------- |
| `id`           | ObjectId | Unique identifier                                     |
| `email`        | String   | Agent's login email                                   |
| `passwordHash` | String   | bcrypt-hashed password                                |
| `name`         | String   | Display name                                          |
| `role`         | Enum     | `agent` (extensible to `admin`, `read_only` for RBAC) |
| `createdAt`    | DateTime | Account creation timestamp                            |

### 6.4 TicketHistory Entity (Audit Trail)

| Field           | Type               | Description                                                     |
| --------------- | ------------------ | --------------------------------------------------------------- |
| `id`            | ObjectId           | Unique identifier                                               |
| `ticketId`      | ObjectId           | Reference to the parent ticket                                  |
| `action`        | String             | `status_change`, `triage_completed`, `triage_failed`, `created` |
| `previousValue` | Mixed              | Value before the change (e.g., previous status)                 |
| `newValue`      | Mixed              | Value after the change (e.g., new status)                       |
| `performedBy`   | ObjectId \| String | Agent ID or `system` for AI actions                             |
| `timestamp`     | DateTime           | When the action occurred                                        |

---

## 7. Integration Points

| Integration                | Protocol                     | Failure Mode               | Mitigation                                                                                                    |
| -------------------------- | ---------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **MongoDB**                | TCP (Mongoose driver)        | Connection lost            | Mongoose auto-reconnect + health check endpoint                                                               |
| **Gemini AI API**          | HTTPS (REST/gRPC via SDK)    | Timeout / 5xx / Rate limit | Circuit breaker: 3 retries with exponential backoff (1s, 2s, 4s). After max retries → `triage_failed` status. |
| **JWT Auth**               | Stateless token verification | Invalid/expired token      | Return `401 Unauthorized` with clear error message                                                            |
| **Frontend → Backend API** | HTTP (fetch)                 | Network error / CORS       | Frontend shows user-friendly error toast; retry button on transient failures                                  |

---

## 8. Testability Strategy

The Clean Architecture enables a **testing pyramid** that maximizes coverage while minimizing execution time:

```
            ┌──────────────┐
            │  E2E / API   │  ← Supertest + real MongoDB (via testcontainers or in-memory)
            │   Tests      │     ~10% of test suite
            ├──────────────┤
            │ Integration  │  ← Controllers with mocked use cases
            │   Tests      │     ~20% of test suite
            ├──────────────┤
            │   Unit       │  ← Use cases with injected fakes
            │   Tests      │     ~70% of test suite — THIS IS WHERE 80% COVERAGE LIVES
            └──────────────┘
```

### 8.1 What Gets Tested at Each Level

| Level           | Target                                                                            | Dependencies                           | Speed            |
| --------------- | --------------------------------------------------------------------------------- | -------------------------------------- | ---------------- |
| **Unit**        | Entities (validation logic), Use Cases (business rules), Validators (Zod schemas) | In-memory fakes for repos & AI service | < 1ms per test   |
| **Integration** | Controllers (HTTP layer)                                                          | Mocked use cases                       | < 10ms per test  |
| **E2E**         | Full request lifecycle (POST → DB → AI → Response)                                | Real MongoDB, mocked Gemini            | < 500ms per test |

### 8.2 Dependency Injection for Testability

```
// Production wiring (composition root)
const ticketRepo = new MongoTicketRepository();
const aiService = new GeminiTriageService();
const createTicket = new CreateTicketUseCase(ticketRepo, aiService);

// Test wiring
const ticketRepo = new InMemoryTicketRepository();
const aiService = new FakeTriageService({ category: 'Billing', priority: 'High' });
const createTicket = new CreateTicketUseCase(ticketRepo, aiService);
```

No change to the use case code. The **same class** runs in production and in tests — only the injected dependencies differ.

---

## 9. Non-Functional Constraints

| Constraint             | Details                                                |
| ---------------------- | ------------------------------------------------------ |
| **Runtime**            | Node.js 20 LTS                                         |
| **Backend Framework**  | Express.js 4.x                                         |
| **Frontend Framework** | Next.js 14+ (App Router)                               |
| **Frontend Styling**   | Tailwind CSS 3.x + Shadcn/ui                           |
| **Frontend Language**  | TypeScript 5.x                                         |
| **Database**           | MongoDB 7.x (via Mongoose 8.x ODM)                     |
| **AI Provider**        | Google Gemini (via `@google/generative-ai` SDK)        |
| **Auth**               | JWT (jsonwebtoken + bcryptjs)                          |
| **Validation**         | Zod (backend), Zod + React Hook Form (frontend)        |
| **Backend Testing**    | Jest 29.x with `--coverage`                            |
| **Containerization**   | Docker + docker-compose (Backend + Frontend + MongoDB) |
| **Code Style**         | ESLint + Prettier                                      |

---

## 10. Out of Scope

The following are explicitly **not** part of the deliverable for this phase:

- Email notifications to customers
- Real-time WebSocket push to the dashboard (REST polling is sufficient for MVP)
- Multi-tenancy / organization-level isolation
- File attachments on tickets
- Rate limiting on the public submission endpoint (future enhancement)
- Internationalization (i18n)
- Dark mode theming (can be added later via Shadcn/ui theming)
- Frontend unit/E2E testing (80% coverage target applies to backend business logic)

---

## 11. Success Criteria

| #   | Criterion                                                                                                          | Verification                                            |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 1   | A customer can create a ticket via `POST /api/tickets` and receive a response with AI-assigned category + priority | Automated E2E test                                      |
| 2   | If the AI is unreachable, the ticket is saved with `pending_triage` and no 500 error is returned to the customer   | Unit test on `CreateTicketUseCase` with failing AI mock |
| 3   | An agent can authenticate via `POST /api/auth/login` and receive a JWT                                             | Integration test                                        |
| 4   | An authenticated agent can list tickets with pagination and filters                                                | Integration test with query params                      |
| 5   | An authenticated agent can update ticket status, and a history record is created                                   | Unit test on `UpdateTicketStatusUseCase`                |
| 6   | All business logic achieves ≥ 80% code coverage                                                                    | `jest --coverage` report                                |
| 7   | `docker-compose up` starts the entire backend, frontend, and database                                              | Manual verification                                     |
| 8   | A customer can visit `/` and submit a ticket via the public form                                                   | Manual verification                                     |
| 9   | An agent can log in at `/login` and be redirected to `/dashboard`                                                  | Manual verification                                     |
| 10  | The dashboard displays tickets in a filterable, paginated data table                                               | Manual verification                                     |
| 11  | An agent can change ticket status from the dashboard without a page reload (optimistic UI)                         | Manual verification                                     |

---

## 12. Glossary

| Term                     | Definition                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Triage**               | The automated process of classifying a ticket's category and priority using AI                                                    |
| **Circuit Breaker**      | A resilience pattern that stops calling a failing service after repeated failures, allowing it to recover                         |
| **Use Case**             | A single unit of business logic, receiving input via a DTO and returning output via a DTO, with no knowledge of HTTP or databases |
| **Repository Interface** | An abstract contract defining data access methods, implemented by infrastructure (MongoDB)                                        |
| **Composition Root**     | The single place in the application where all dependencies are wired together (dependency injection)                              |
| **Audit Trail**          | A chronological record of every meaningful state change in the system                                                             |
| **Optimistic Update**    | A UI pattern where the frontend immediately reflects a change (e.g., status update) before the API confirms, reverting on failure |
| **Shadcn/ui**            | A collection of accessible, themeable React components built on Radix UI primitives and styled with Tailwind CSS                  |
| **App Router**           | Next.js routing system (v13+) using file-system based routing in the `app/` directory with React Server Components support        |

---

> **Next Phase:** [REQUIREMENTS.md](./REQUIREMENTS.md) — Functional requirements (CRUD, AI Triage, Auth) and non-functional requirements (performance, security, test coverage).
