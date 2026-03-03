# Project Structure — Smart Triage Ticketing System

## Top-Level Layout

```
smart-triage-ticketing-system/
├── .steering/              # Persistent project context (product, tech, structure)
├── docs/                   # V-Model planning documents (SPEC, REQUIREMENTS, DESIGN, TASKS)
├── backend/                # Backend source, tests, config (Express.js, Clean Architecture)
├── frontend/               # Frontend source (Next.js App Router)
├── docker-compose.yml      # 3-service orchestration (api, frontend, mongodb)
├── .gitignore              # Repository-wide ignores
├── README.md               # Setup, usage, architecture docs
└── AI_JOURNEY.md           # AI usage documentation (assessment deliverable)
```

## Backend — Clean Architecture Layers

### Layer 1: Entities (`backend/src/entities/`)

Pure domain models. **Zero external dependencies.** Business rules, validation, enums.

```
backend/src/entities/
├── Ticket.js               # Ticket domain model — validate(), canTransitionTo(), isTriageable()
├── Agent.js                # Agent domain model — field validation
├── TicketHistory.js        # Audit trail domain model
├── enums.js                # TicketStatus, TicketCategory, TicketPriority, AgentRole, VALID_TRANSITIONS
└── errors.js               # AppError base + domain exceptions (ValidationError, NotFoundError, etc.)
```

### Layer 2: Use Cases (`backend/src/useCases/`)

Application business logic. Depends only on entities and interface contracts.

```
backend/src/useCases/
├── CreateTicketUseCase.js         # FR-01, FR-02 — create + attempt triage
├── TriageTicketUseCase.js         # FR-03, FR-04 — AI classification with retry/fallback
├── GetTicketsUseCase.js           # FR-05 — paginated, filtered listing
├── GetTicketByIdUseCase.js        # FR-06 — single ticket retrieval
├── UpdateTicketStatusUseCase.js   # FR-07 — validated status transition + history
├── RegisterAgentUseCase.js        # FR-08 — agent registration with duplicate check
└── LoginAgentUseCase.js           # FR-09 — credential verification + JWT issuance
```

### Layer 3: Interface Adapters (`backend/src/interfaces/`)

Abstract contracts, controllers, presenters. Bridge between use cases and infrastructure.

```
backend/src/interfaces/
├── repositories/
│   ├── ITicketRepository.js           # Abstract: create, findById, findAll, update
│   ├── IAgentRepository.js            # Abstract: create, findByEmail, findById
│   └── ITicketHistoryRepository.js    # Abstract: create, findByTicketId
├── services/
│   ├── IAITriageService.js            # Abstract: classifyTicket(title, description)
│   └── IAuthService.js                # Abstract: hashPassword, comparePassword, generateToken, verifyToken
├── controllers/
│   ├── ticketController.js            # Express handlers: create, getAll, getById, updateStatus
│   └── authController.js              # Express handlers: register, login
└── presenters/
    ├── ticketPresenter.js             # Format ticket for API response
    └── errorPresenter.js              # Format error for API response
```

### Layer 4: Infrastructure (`backend/src/infrastructure/`)

Concrete implementations. Framework-specific code lives here.

```
backend/src/infrastructure/
├── database/
│   ├── connection.js                  # Mongoose connect, auto-reconnect, graceful shutdown
│   ├── models/
│   │   ├── TicketModel.js             # Mongoose schema (10 indexes)
│   │   ├── AgentModel.js              # Mongoose schema (passwordHash excluded from toJSON)
│   │   └── TicketHistoryModel.js      # Mongoose schema (compound index)
│   └── repositories/
│       ├── MongoTicketRepository.js   # ITicketRepository → Mongoose implementation
│       ├── MongoAgentRepository.js    # IAgentRepository → Mongoose implementation
│       └── MongoTicketHistoryRepository.js
├── ai/
│   ├── GeminiTriageService.js         # IAITriageService → @google/generative-ai SDK
│   └── RetryHandler.js                # Exponential backoff (1s, 2s, 4s), max 3 retries
├── auth/
│   └── JwtAuthService.js             # IAuthService → jsonwebtoken + bcryptjs
├── middleware/
│   ├── authMiddleware.js              # JWT verification, attaches req.agent
│   ├── validationMiddleware.js        # Zod schema validation factory
│   └── errorMiddleware.js             # Maps domain errors → HTTP responses
├── validators/
│   ├── ticketValidators.js            # Zod: createTicketSchema, updateTicketStatusSchema, ticketQuerySchema
│   └── authValidators.js             # Zod: registerAgentSchema, loginSchema
└── config/
    └── env.js                         # Env var loader + Zod validation, exports frozen config
```

### Wiring (`backend/src/`)

```
backend/src/
├── routes/
│   ├── ticketRoutes.js                # Express Router: /api/tickets
│   ├── authRoutes.js                  # Express Router: /api/auth
│   └── healthRoutes.js                # Express Router: /api/health
├── container.js                       # Composition Root — DI wiring (all repos, services, use cases, controllers)
├── app.js                             # Express app setup (CORS, JSON, routes, error middleware)
└── server.js                          # HTTP bootstrap, DB connection, graceful shutdown
```

## Frontend — Next.js App Router

```
frontend/
├── app/
│   ├── layout.tsx                     # Root layout: AuthProvider, Toaster, global styles
│   ├── page.tsx                       # Public: Customer ticket submission form
│   ├── login/
│   │   └── page.tsx                   # Public: Agent login form
│   └── dashboard/
│       ├── layout.tsx                 # Protected: Auth guard (redirects to /login)
│       └── page.tsx                   # Protected: Agent dashboard (table, filters, pagination)
├── components/
│   ├── ui/                            # Shadcn/ui primitives (auto-generated)
│   ├── ticket-form.tsx                # Submission form (React Hook Form + Zod)
│   ├── login-form.tsx                 # Login form (React Hook Form + Zod)
│   ├── ticket-table.tsx               # Dashboard data table
│   ├── ticket-filters.tsx             # Status/Priority/Category filter dropdowns
│   ├── status-badge.tsx               # Color-coded status badge
│   ├── priority-badge.tsx             # Color-coded priority badge
│   ├── status-select.tsx              # Inline status transition dropdown (optimistic)
│   ├── pagination.tsx                 # Previous/Next + page indicator
│   └── navbar.tsx                     # Top nav: logo, conditional links, agent name
├── lib/
│   ├── api.ts                         # Fetch wrappers: apiFetch(), CRUD functions
│   ├── auth-context.tsx               # AuthProvider + useAuth() hook (localStorage)
│   ├── types.ts                       # TypeScript types: Ticket, Agent, PaginationMeta, etc.
│   └── utils.ts                       # Shadcn cn() utility
├── .env.local                         # NEXT_PUBLIC_API_URL
├── Dockerfile                         # Multi-stage build, standalone output
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Test Structure

```
backend/tests/
├── unit/
│   ├── entities/                      # Ticket, Agent, TicketHistory tests (≥90% coverage)
│   ├── useCases/                      # All 7 use cases (≥85% coverage)
│   └── validators/                    # Zod schema tests (≥90% branch coverage)
├── integration/
│   ├── ticketRoutes.test.js           # Full HTTP lifecycle tests via Supertest
│   ├── authRoutes.test.js             # Auth endpoint tests
│   └── healthRoutes.test.js           # Health check tests
├── helpers/
│   ├── testFactory.js                 # Factory functions for test data
│   ├── fakeTicketRepository.js        # In-memory ITicketRepository (Map-based)
│   ├── fakeAgentRepository.js         # In-memory IAgentRepository
│   ├── fakeTicketHistoryRepository.js # In-memory ITicketHistoryRepository
│   ├── fakeAITriageService.js         # Configurable AI mock (preset results / throw on demand)
│   └── fakeAuthService.js             # Passthrough hashing, predictable tokens
└── setup.js                           # Jest global setup (env defaults)
```

## Naming Conventions

| Element                | Convention                           | Example                                            |
| ---------------------- | ------------------------------------ | -------------------------------------------------- |
| Backend files          | camelCase                            | `ticketController.js`, `CreateTicketUseCase.js`    |
| Entity/UseCase classes | PascalCase                           | `class Ticket`, `class CreateTicketUseCase`        |
| Frontend components    | kebab-case files, PascalCase exports | `ticket-form.tsx` → `export function TicketForm()` |
| Shadcn/ui components   | kebab-case                           | `ui/button.tsx`, `ui/card.tsx`                     |
| Test files             | `*.test.js` suffix                   | `Ticket.test.js`, `ticketRoutes.test.js`           |
| Environment vars       | SCREAMING_SNAKE                      | `MONGODB_URI`, `NEXT_PUBLIC_API_URL`               |
| API routes             | kebab-case, plural nouns             | `/api/tickets`, `/api/auth/login`                  |
| MongoDB collections    | lowercase plural                     | `tickets`, `agents`, `tickethistories`             |

## Import / Dependency Rules

1. **Entities** import nothing outside `backend/src/entities/`.
2. **Use Cases** import only from `backend/src/entities/` and `backend/src/interfaces/` (contracts).
3. **Interface Adapters** import from `backend/src/entities/` and `backend/src/useCases/`.
4. **Infrastructure** can import from any inner layer.
5. **No circular imports.** Dependency always flows inward.
6. **Composition Root** (`container.js`) is the only file that imports from all layers.
7. **Frontend** has its own dependency tree — never imports from `backend/src/`.

## Key Architectural Decisions

| Decision                         | Rationale                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Clean Architecture (4 layers)    | Testability, framework independence, clear boundaries                          |
| Composition Root DI              | No DI framework needed — manual wiring in `container.js`                       |
| In-memory fakes for testing      | Fast unit tests, no DB dependency, same interface as production                |
| Zod for validation               | Runtime type safety, shared between request validation and AI response parsing |
| Separate frontend/ directory     | Independent Next.js project, own `package.json`, own Dockerfile                |
| Optimistic UI for status updates | Instant feedback, revert on API failure with toast notification                |
