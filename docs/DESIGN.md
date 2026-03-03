# DESIGN.md — Smart Triage Ticketing System

> **Phase 3 of 4** | V-Model Planning Method  
> **Version:** 1.0.0  
> **Date:** 2026-03-03  
> **Depends On:** [SPEC.md](./SPEC.md), [REQUIREMENTS.md](./REQUIREMENTS.md)

---

## 1. Document Purpose

This document defines the **concrete technical design** for the full Smart Triage system: backend folder structure (Clean Architecture), frontend folder structure (Next.js App Router), module boundaries, MongoDB schemas, interface contracts, dependency wiring, frontend component architecture, and the full API specification. Every decision traces back to a requirement in REQUIREMENTS.md.

---

## 2. Folder Structure (Clean Architecture)

```
smart-triage-ticketing-system/
├── docs/
│   ├── SPEC.md
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   └── TASKS.md
├── backend/
│   ├── src/
│   │   ├── entities/                          # Layer 1: Enterprise Business Rules
│   │   │   ├── Ticket.js                      #   Ticket domain model + validation
│   │   │   ├── Agent.js                       #   Agent domain model
│   │   │   ├── TicketHistory.js               #   Audit trail domain model
│   │   │   └── enums.js                       #   Shared enums (Status, Priority, Category)
│   │   │
│   │   ├── useCases/                          # Layer 2: Application Business Rules
│   │   │   ├── CreateTicketUseCase.js         #   FR-01, FR-02
│   │   │   ├── TriageTicketUseCase.js         #   FR-03, FR-04
│   │   │   ├── GetTicketsUseCase.js           #   FR-05
│   │   │   ├── GetTicketByIdUseCase.js        #   FR-06
│   │   │   ├── UpdateTicketStatusUseCase.js   #   FR-07
│   │   │   ├── RegisterAgentUseCase.js        #   FR-08
│   │   │   └── LoginAgentUseCase.js           #   FR-09
│   │   │
│   │   ├── interfaces/                        # Layer 3: Interface Adapters
│   │   │   ├── repositories/                  #   Abstract repository contracts
│   │   │   │   ├── ITicketRepository.js
│   │   │   │   ├── IAgentRepository.js
│   │   │   │   └── ITicketHistoryRepository.js
│   │   │   ├── services/                      #   Abstract service contracts
│   │   │   │   ├── IAITriageService.js
│   │   │   │   └── IAuthService.js
│   │   │   ├── controllers/                   #   Express route handlers
│   │   │   │   ├── ticketController.js
│   │   │   │   └── authController.js
│   │   │   └── presenters/                    #   Response formatting
│   │   │       ├── ticketPresenter.js
│   │   │       └── errorPresenter.js
│   │   │
│   │   ├── infrastructure/                    # Layer 4: Frameworks & Drivers
│   │   │   ├── database/
│   │   │   │   ├── connection.js              #   Mongoose connection setup
│   │   │   │   ├── models/
│   │   │   │   │   ├── TicketModel.js         #   Mongoose schema + model
│   │   │   │   │   ├── AgentModel.js          #   Mongoose schema + model
│   │   │   │   │   └── TicketHistoryModel.js  #   Mongoose schema + model
│   │   │   │   └── repositories/
│   │   │   │       ├── MongoTicketRepository.js
│   │   │   │       ├── MongoAgentRepository.js
│   │   │   │       └── MongoTicketHistoryRepository.js
│   │   │   ├── ai/
│   │   │   │   ├── GeminiTriageService.js     #   Gemini SDK integration
│   │   │   │   └── RetryHandler.js            #   Exponential backoff + circuit breaker
│   │   │   ├── auth/
│   │   │   │   └── JwtAuthService.js          #   JWT sign/verify implementation
│   │   │   ├── middleware/
│   │   │   │   ├── authMiddleware.js           #   JWT route protection
│   │   │   │   ├── errorMiddleware.js          #   Global error handler
│   │   │   │   └── validationMiddleware.js     #   Zod schema validation
│   │   │   ├── validators/
│   │   │   │   ├── ticketValidators.js         #   Zod schemas for ticket endpoints
│   │   │   │   └── authValidators.js           #   Zod schemas for auth endpoints
│   │   │   └── config/
│   │   │       └── env.js                      #   Environment variable loader + validation
│   │   │
│   │   ├── routes/                             #   Express router definitions
│   │   │   ├── ticketRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   └── healthRoutes.js
│   │   │
│   │   ├── container.js                        #   Composition Root (DI wiring)
│   │   ├── app.js                              #   Express app setup (middleware, routes)
│   │   └── server.js                           #   HTTP server bootstrap + graceful shutdown
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── entities/
│   │   │   │   ├── Ticket.test.js
│   │   │   │   ├── Agent.test.js
│   │   │   │   └── TicketHistory.test.js
│   │   │   ├── useCases/
│   │   │   │   ├── CreateTicketUseCase.test.js
│   │   │   │   ├── TriageTicketUseCase.test.js
│   │   │   │   ├── GetTicketsUseCase.test.js
│   │   │   │   ├── GetTicketByIdUseCase.test.js
│   │   │   │   ├── UpdateTicketStatusUseCase.test.js
│   │   │   │   ├── RegisterAgentUseCase.test.js
│   │   │   │   └── LoginAgentUseCase.test.js
│   │   │   └── validators/
│   │   │       ├── ticketValidators.test.js
│   │   │       └── authValidators.test.js
│   │   ├── integration/
│   │   │   ├── ticketRoutes.test.js
│   │   │   ├── authRoutes.test.js
│   │   │   └── healthRoutes.test.js
│   │   ├── helpers/
│   │   │   ├── fakeTicketRepository.js
│   │   │   ├── fakeAgentRepository.js
│   │   │   ├── fakeTicketHistoryRepository.js
│   │   │   ├── fakeAITriageService.js
│   │   │   ├── fakeAuthService.js
│   │   │   └── testFactory.js                #   Factory functions for test data
│   │   └── setup.js                           #   Jest global setup
│   │
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── jest.config.js
│   └── package.json
│
├── frontend/                                   # (see §17 for full frontend structure)
├── .gitignore
├── docker-compose.yml
├── AI_JOURNEY.md
└── README.md
```

### 2.2 Frontend Folder Structure (Next.js App Router)

```
frontend/
├── app/
│   ├── layout.tsx                         #   Root layout (html, body, Toaster, AuthProvider)
│   ├── page.tsx                           #   FR-13: Customer ticket submission form
│   ├── login/
│   │   └── page.tsx                       #   FR-14: Agent login page
│   └── dashboard/
│       ├── layout.tsx                     #   FR-15: Auth guard wrapper
│       └── page.tsx                       #   FR-16, FR-17: Agent dashboard (data table)
│
├── components/
│   ├── ui/                                #   Shadcn/ui primitives (auto-generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   ├── select.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── skeleton.tsx
│   │   └── label.tsx
│   ├── ticket-form.tsx                    #   Submission form component
│   ├── login-form.tsx                     #   Login form component
│   ├── ticket-table.tsx                   #   Dashboard data table
│   ├── ticket-filters.tsx                 #   Filter dropdowns (status, priority, category)
│   ├── status-badge.tsx                   #   Color-coded status badge
│   ├── priority-badge.tsx                 #   Color-coded priority badge
│   ├── status-select.tsx                  #   Inline status change dropdown
│   ├── pagination.tsx                     #   Pagination controls
│   └── navbar.tsx                         #   Top navigation bar
│
├── lib/
│   ├── api.ts                             #   Fetch wrappers for backend API
│   ├── auth-context.tsx                   #   React context for JWT + agent state
│   ├── utils.ts                           #   Shadcn/ui cn() utility
│   └── types.ts                           #   TypeScript types (Ticket, Agent, Pagination)
│
├── .env.local                             #   NEXT_PUBLIC_API_URL
├── components.json                        #   Shadcn/ui config
├── next.config.js                         #   Next.js configuration
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── Dockerfile
```

### 2.3 Backend Layer Dependency Enforcement

```
┌──────────────────────────────────────────────────────────────────┐
│  RULE: Imports point INWARD only. Never skip layers outward.    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  entities/           →  imports NOTHING (pure JS, zero deps)     │
│  useCases/           →  imports entities/, interfaces/           │
│  interfaces/         →  imports useCases/, entities/             │
│  infrastructure/     →  imports interfaces/, entities/           │
│  routes/             →  imports interfaces/controllers/          │
│  container.js        →  imports EVERYTHING (wires all layers)    │
│  app.js              →  imports routes/, infrastructure/middleware│
│  server.js           →  imports app.js, infrastructure/database  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.4 Composition Root (`container.js`)

The **single place** where concrete implementations are bound to abstract interfaces:

```
container.js responsibilities:
  1. Instantiate infrastructure:
     - MongoTicketRepository        → implements ITicketRepository
     - MongoAgentRepository         → implements IAgentRepository
     - MongoTicketHistoryRepository → implements ITicketHistoryRepository
     - GeminiTriageService          → implements IAITriageService
     - JwtAuthService               → implements IAuthService

  2. Instantiate use cases (inject infrastructure):
     - CreateTicketUseCase(ticketRepo, historyRepo, triageService)
     - TriageTicketUseCase(ticketRepo, historyRepo, aiService, retryHandler)
     - GetTicketsUseCase(ticketRepo)
     - GetTicketByIdUseCase(ticketRepo)
     - UpdateTicketStatusUseCase(ticketRepo, historyRepo)
     - RegisterAgentUseCase(agentRepo, authService)
     - LoginAgentUseCase(agentRepo, authService)

  3. Instantiate controllers (inject use cases):
     - TicketController(createTicket, getTickets, getTicketById, updateStatus)
     - AuthController(register, login)

  4. Export controllers for route binding
```

---

## 3. MongoDB Schemas (Mongoose)

### 3.1 Ticket Schema

**Collection:** `tickets`  
**Traces to:** FR-01, FR-02, FR-03, FR-05, FR-06, FR-07  
**Indexes:** Compound and single-field for query performance (NFR-02.2)

```javascript
// backend/src/infrastructure/database/models/TicketModel.js

const TicketSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    customer_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Open",
        "In Progress",
        "Resolved",
        "pending_triage",
        "triage_failed",
      ],
      default: "pending_triage",
      index: true,
    },
    category: {
      type: String,
      enum: ["Billing", "Technical Bug", "Feature Request", null],
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low", null],
      default: null,
      index: true,
    },
    triageAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // auto createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound indexes for common dashboard queries
TicketSchema.index({ status: 1, priority: 1 });
TicketSchema.index({ status: 1, category: 1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ status: 1, createdAt: -1 });
```

### 3.2 Agent Schema

**Collection:** `agents`  
**Traces to:** FR-08, FR-09, NFR-01.1

```javascript
// backend/src/infrastructure/database/models/AgentModel.js

const AgentSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    role: {
      type: String,
      required: true,
      enum: ["agent", "admin", "read_only"],
      default: "agent",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash; // NFR-01.4: never expose password
        delete ret.__v;
        return ret;
      },
    },
  },
);
```

### 3.3 TicketHistory Schema

**Collection:** `ticket_histories`  
**Traces to:** FR-11, G-04

```javascript
// backend/src/infrastructure/database/models/TicketHistoryModel.js

const TicketHistorySchema = new Schema(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["created", "triage_completed", "triage_failed", "status_change"],
    },
    previousValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      type: String, // ObjectId string or 'system'
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false, // We manage our own timestamp field
  },
);

// Efficient lookup: all history for a given ticket, chronological
TicketHistorySchema.index({ ticketId: 1, timestamp: 1 });
```

### 3.4 Index Summary

| Collection         | Index                           | Type     | Purpose                |
| ------------------ | ------------------------------- | -------- | ---------------------- |
| `tickets`          | `{ status: 1 }`                 | Single   | Filter by status       |
| `tickets`          | `{ priority: 1 }`               | Single   | Filter by priority     |
| `tickets`          | `{ category: 1 }`               | Single   | Filter by category     |
| `tickets`          | `{ customer_email: 1 }`         | Single   | Lookup by email        |
| `tickets`          | `{ createdAt: -1 }`             | Single   | Default sort           |
| `tickets`          | `{ status: 1, priority: 1 }`    | Compound | Dashboard filter combo |
| `tickets`          | `{ status: 1, category: 1 }`    | Compound | Dashboard filter combo |
| `tickets`          | `{ status: 1, createdAt: -1 }`  | Compound | Filtered + sorted      |
| `agents`           | `{ email: 1 }`                  | Unique   | Login lookup           |
| `ticket_histories` | `{ ticketId: 1, timestamp: 1 }` | Compound | Audit trail per ticket |

---

## 4. Interface Contracts (Abstract Boundaries)

These are the contracts that **use cases depend on** and **infrastructure implements**. They define the seam between business logic and external concerns.

### 4.1 ITicketRepository

```
Interface: ITicketRepository
Location:  backend/src/interfaces/repositories/ITicketRepository.js
Used by:   CreateTicketUseCase, TriageTicketUseCase, GetTicketsUseCase,
           GetTicketByIdUseCase, UpdateTicketStatusUseCase

Methods:
  create(ticketData)
    @param  {Object} ticketData  - { title, description, customer_email, status, category, priority, triageAttempts }
    @returns {Object}            - Created ticket with id and timestamps

  findById(id)
    @param  {string} id
    @returns {Object|null}       - Ticket object or null if not found

  findAll(filters, pagination, sort)
    @param  {Object} filters     - { status?, priority?, category? }
    @param  {Object} pagination  - { page: number, limit: number }
    @param  {Object} sort        - { sortBy: string, sortOrder: 'asc'|'desc' }
    @returns {Object}            - { data: Ticket[], total: number }

  updateById(id, updateData)
    @param  {string} id
    @param  {Object} updateData  - Fields to update (e.g., { status, category, priority, triageAttempts })
    @returns {Object|null}       - Updated ticket or null if not found

  findByStatus(status)
    @param  {string} status
    @returns {Array}             - Tickets matching the status (for retry queue)
```

### 4.2 IAgentRepository

```
Interface: IAgentRepository
Location:  backend/src/interfaces/repositories/IAgentRepository.js
Used by:   RegisterAgentUseCase, LoginAgentUseCase

Methods:
  create(agentData)
    @param  {Object} agentData   - { email, passwordHash, name, role }
    @returns {Object}            - Created agent (without passwordHash)

  findByEmail(email)
    @param  {string} email
    @returns {Object|null}       - Agent object (with passwordHash for login verification) or null
```

### 4.3 ITicketHistoryRepository

```
Interface: ITicketHistoryRepository
Location:  backend/src/interfaces/repositories/ITicketHistoryRepository.js
Used by:   CreateTicketUseCase, TriageTicketUseCase, UpdateTicketStatusUseCase

Methods:
  create(historyData)
    @param  {Object} historyData - { ticketId, action, previousValue, newValue, performedBy }
    @returns {Object}            - Created history record with timestamp

  findByTicketId(ticketId)
    @param  {string} ticketId
    @returns {Array}             - All history records for the ticket, sorted by timestamp asc
```

### 4.4 IAITriageService

```
Interface: IAITriageService
Location:  backend/src/interfaces/services/IAITriageService.js
Used by:   TriageTicketUseCase

Methods:
  classifyTicket(title, description)
    @param  {string} title
    @param  {string} description
    @returns {Object}            - { category: string, priority: string }
    @throws  {Error}             - On API failure, timeout, or unparseable response
```

### 4.5 IAuthService

```
Interface: IAuthService
Location:  backend/src/interfaces/services/IAuthService.js
Used by:   RegisterAgentUseCase, LoginAgentUseCase, authMiddleware

Methods:
  hashPassword(plaintext)
    @param  {string} plaintext
    @returns {string}            - bcrypt hash

  comparePassword(plaintext, hash)
    @param  {string} plaintext
    @param  {string} hash
    @returns {boolean}           - true if match

  generateToken(payload)
    @param  {Object} payload     - { agentId, email, role }
    @returns {string}            - Signed JWT string

  verifyToken(token)
    @param  {string} token
    @returns {Object}            - Decoded payload { agentId, email, role }
    @throws  {Error}             - On invalid or expired token
```

---

## 5. Use Case Designs (Detailed)

### 5.1 CreateTicketUseCase

```
Class:    CreateTicketUseCase
Traces:   FR-01, FR-02
Depends:  ITicketRepository, ITicketHistoryRepository, TriageTicketUseCase

Input DTO:
  { title: string, description: string, customer_email: string }

Flow:
  1. Create ticket via ticketRepo.create({
       title, description, customer_email,
       status: 'pending_triage',
       category: null,
       priority: null,
       triageAttempts: 0
     })
  2. Create history record via historyRepo.create({
       ticketId: ticket.id,
       action: 'created',
       previousValue: null,
       newValue: { status: 'pending_triage' },
       performedBy: 'system'
     })
  3. Attempt triage (non-blocking):
     try {
       result = await triageUseCase.execute(ticket.id)
       return result   // ticket with category + priority + status='Open'
     } catch (error) {
       return ticket   // ticket with status='pending_triage' — customer still gets 201
     }

Output DTO:
  { id, title, description, customer_email, status, category, priority,
    triageAttempts, createdAt, updatedAt }
```

### 5.2 TriageTicketUseCase

```
Class:    TriageTicketUseCase
Traces:   FR-03, FR-04
Depends:  ITicketRepository, ITicketHistoryRepository, IAITriageService

Input:    ticketId: string

Flow:
  1. Fetch ticket via ticketRepo.findById(ticketId)
  2. If ticket is null → throw NotFoundError
  3. Call aiService.classifyTicket(ticket.title, ticket.description)
  4. Validate AI response:
     - category must be in ['Billing', 'Technical Bug', 'Feature Request']
     - priority must be in ['High', 'Medium', 'Low']
     - If invalid → treat as failure
  5. On SUCCESS:
     - Update ticket: { status: 'Open', category, priority, triageAttempts: ticket.triageAttempts + 1 }
     - Create history: { action: 'triage_completed', newValue: { category, priority } }
     - Return updated ticket
  6. On FAILURE:
     - Increment triageAttempts
     - If triageAttempts >= MAX_RETRIES:
         - Update ticket: { status: 'triage_failed' }
         - Create history: { action: 'triage_failed' }
     - Else:
         - Update ticket: { status: 'pending_triage', triageAttempts: ticket.triageAttempts + 1 }
     - Throw error (caller decides how to handle)

Output DTO (success):
  { id, title, description, customer_email, status: 'Open', category, priority,
    triageAttempts, createdAt, updatedAt }
```

### 5.3 UpdateTicketStatusUseCase

```
Class:    UpdateTicketStatusUseCase
Traces:   FR-07
Depends:  ITicketRepository, ITicketHistoryRepository

Input DTO:
  { ticketId: string, newStatus: string, agentId: string }

Valid Transitions (state machine):
  'Open'           → ['In Progress', 'Resolved']
  'In Progress'    → ['Open', 'Resolved']
  'Resolved'       → ['Open']
  'pending_triage' → ['Open']
  'triage_failed'  → ['Open']

Flow:
  1. Fetch ticket via ticketRepo.findById(ticketId)
  2. If ticket is null → throw NotFoundError
  3. Validate transition: check if newStatus is in VALID_TRANSITIONS[ticket.status]
     - If invalid → throw InvalidStatusTransitionError
  4. Update ticket: ticketRepo.updateById(ticketId, { status: newStatus })
  5. Create history: historyRepo.create({
       ticketId,
       action: 'status_change',
       previousValue: { status: ticket.status },
       newValue: { status: newStatus },
       performedBy: agentId
     })
  6. Return updated ticket

Output DTO:
  { id, title, description, customer_email, status, category, priority,
    triageAttempts, createdAt, updatedAt }
```

### 5.4 GetTicketsUseCase

```
Class:    GetTicketsUseCase
Traces:   FR-05
Depends:  ITicketRepository

Input DTO:
  {
    page: number (default 1),
    limit: number (default 10, max 100),
    status?: string,
    priority?: string,
    category?: string,
    sortBy: string (default 'createdAt'),
    sortOrder: 'asc' | 'desc' (default 'desc')
  }

Flow:
  1. Clamp limit: Math.min(limit, 100)
  2. Build filters object from non-null status/priority/category
  3. Call ticketRepo.findAll(filters, { page, limit }, { sortBy, sortOrder })
  4. Compute pagination metadata:
     - totalPages = Math.ceil(total / limit)
  5. Return { data, pagination: { page, limit, total, totalPages } }

Output DTO:
  {
    data: Ticket[],
    pagination: { page: number, limit: number, total: number, totalPages: number }
  }
```

### 5.5 GetTicketByIdUseCase

```
Class:    GetTicketByIdUseCase
Traces:   FR-06
Depends:  ITicketRepository

Input:    ticketId: string

Flow:
  1. Fetch ticket via ticketRepo.findById(ticketId)
  2. If ticket is null → throw NotFoundError
  3. Return ticket

Output DTO:
  { id, title, description, customer_email, status, category, priority,
    triageAttempts, createdAt, updatedAt }
```

### 5.6 RegisterAgentUseCase

```
Class:    RegisterAgentUseCase
Traces:   FR-08
Depends:  IAgentRepository, IAuthService

Input DTO:
  { email: string, password: string, name: string }

Flow:
  1. Check if agent exists: agentRepo.findByEmail(email)
     - If exists → throw ConflictError('Email already registered')
  2. Hash password: authService.hashPassword(password)
  3. Create agent: agentRepo.create({ email, passwordHash, name, role: 'agent' })
  4. Return agent (without passwordHash)

Output DTO:
  { id, email, name, role }
```

### 5.7 LoginAgentUseCase

```
Class:    LoginAgentUseCase
Traces:   FR-09
Depends:  IAgentRepository, IAuthService

Input DTO:
  { email: string, password: string }

Flow:
  1. Find agent: agentRepo.findByEmail(email)
     - If not found → throw UnauthorizedError('Invalid credentials')
  2. Compare password: authService.comparePassword(password, agent.passwordHash)
     - If mismatch → throw UnauthorizedError('Invalid credentials')  [same message]
  3. Generate token: authService.generateToken({ agentId: agent.id, email: agent.email, role: agent.role })
  4. Return { token, agent: { id, email, name, role } }

Output DTO:
  { token: string, agent: { id, email, name, role } }
```

---

## 6. Controller Design (Interface Adapters)

Controllers are thin — they parse HTTP input, call use cases, and format HTTP output.

### 6.1 TicketController

```
Class: TicketController
Constructor: (createTicketUseCase, getTicketsUseCase, getTicketByIdUseCase, updateTicketStatusUseCase)

Methods:

  create(req, res, next)
    - Extract: { title, description, customer_email } from req.body (already validated by middleware)
    - Call: createTicketUseCase.execute({ title, description, customer_email })
    - Respond: 201, ticketPresenter.format(ticket)

  getAll(req, res, next)
    - Extract: { page, limit, status, priority, category, sortBy, sortOrder } from req.query
    - Call: getTicketsUseCase.execute(queryParams)
    - Respond: 200, { data: tickets.map(ticketPresenter.format), pagination }

  getById(req, res, next)
    - Extract: req.params.id
    - Call: getTicketByIdUseCase.execute(id)
    - Respond: 200, ticketPresenter.format(ticket)

  updateStatus(req, res, next)
    - Extract: req.params.id, req.body.status, req.agent.agentId (from JWT middleware)
    - Call: updateTicketStatusUseCase.execute({ ticketId: id, newStatus: status, agentId })
    - Respond: 200, ticketPresenter.format(ticket)
```

### 6.2 AuthController

```
Class: AuthController
Constructor: (registerAgentUseCase, loginAgentUseCase)

Methods:

  register(req, res, next)
    - Extract: { email, password, name } from req.body
    - Call: registerAgentUseCase.execute({ email, password, name })
    - Respond: 201, agent

  login(req, res, next)
    - Extract: { email, password } from req.body
    - Call: loginAgentUseCase.execute({ email, password })
    - Respond: 200, { token, agent }
```

---

## 7. Middleware Pipeline

Request flows through middleware in this order:

```
Request
  │
  ├── 1. CORS (infrastructure/middleware)
  ├── 2. JSON body parser (express.json, 100kb limit)
  ├── 3. Route matching (routes/)
  │     ├── Public routes: POST /api/tickets, POST /api/auth/*, GET /api/health
  │     └── Protected routes: GET /api/tickets, PATCH /api/tickets/:id
  │           └── 4. authMiddleware (verify JWT, attach req.agent)
  ├── 5. validationMiddleware(schema) — Zod validation per route
  ├── 6. Controller method
  └── 7. errorMiddleware (global error → structured JSON response)
```

### 7.1 Auth Middleware Design

```
authMiddleware(authService)
  1. Extract token from Authorization header: "Bearer <token>"
  2. If no header or wrong format → throw UnauthorizedError
  3. Call authService.verifyToken(token)
  4. On success: attach decoded { agentId, email, role } to req.agent
  5. On failure (expired) → throw TokenExpiredError
  6. On failure (invalid) → throw UnauthorizedError
  7. Call next()
```

### 7.2 Validation Middleware Design

```
validate(zodSchema, source = 'body')
  Returns middleware function:
  1. Parse req[source] with zodSchema.safeParse()
  2. On success: replace req[source] with parsed (cleaned) data, call next()
  3. On failure: throw ValidationError with Zod error details
```

### 7.3 Error Middleware Design

```
errorMiddleware(err, req, res, next)
  Maps domain errors to HTTP responses:
    ValidationError         → 400, VALIDATION_ERROR
    InvalidIdError          → 400, INVALID_ID
    UnauthorizedError       → 401, UNAUTHORIZED
    TokenExpiredError       → 401, TOKEN_EXPIRED
    NotFoundError           → 404, NOT_FOUND
    ConflictError           → 409, CONFLICT
    InvalidStatusTransition → 422, INVALID_STATUS_TRANSITION
    Default (unknown)       → 500, INTERNAL_ERROR (log full error, return generic message)
```

---

## 8. Error Classes (Domain Exceptions)

```
backend/src/entities/ error hierarchy:

  AppError (base class)
  ├── ValidationError          (400)
  ├── InvalidIdError           (400)
  ├── UnauthorizedError        (401)
  ├── TokenExpiredError        (401)
  ├── NotFoundError            (404)
  ├── ConflictError            (409)
  └── InvalidStatusTransitionError (422)

All errors carry:
  - message: string (human-readable)
  - code: string (machine-readable error code)
  - statusCode: number (HTTP status)
  - details: array (optional, e.g., Zod field errors)
```

---

## 9. AI Integration Design

### 9.1 GeminiTriageService

```
Class: GeminiTriageService implements IAITriageService
Config: GEMINI_API_KEY, GEMINI_MODEL (from env)

classifyTicket(title, description):
  1. Construct prompt:
     """
     You are a customer support ticket classifier.
     Analyze the following support ticket and classify it.

     Title: ${title}
     Description: ${description}

     You must respond with ONLY a valid JSON object (no markdown, no explanation):
     {
       "category": "Billing" | "Technical Bug" | "Feature Request",
       "priority": "High" | "Medium" | "Low"
     }

     Classification rules:
     - "Billing": payment issues, invoices, charges, refunds, subscription
     - "Technical Bug": errors, crashes, broken features, performance issues
     - "Feature Request": new features, improvements, suggestions, enhancements
     - "High": service outage, data loss, security issue, payment failure
     - "Medium": feature broken but workaround exists, billing discrepancy
     - "Low": cosmetic issue, feature request, general question
     """

  2. Call Gemini SDK: model.generateContent(prompt)
  3. Extract text from response
  4. Parse JSON from response text (strip markdown code fences if present)
  5. Validate category ∈ ['Billing', 'Technical Bug', 'Feature Request']
  6. Validate priority ∈ ['High', 'Medium', 'Low']
  7. Return { category, priority }
  8. On any failure → throw Error with descriptive message
```

### 9.2 RetryHandler

```
Class: RetryHandler
Config: MAX_RETRIES (default 3), BASE_DELAY_MS (default 1000)

executeWithRetry(fn, maxRetries):
  for attempt = 1 to maxRetries:
    try:
      return await fn()
    catch (error):
      if attempt === maxRetries:
        throw error
      delay = BASE_DELAY_MS * Math.pow(2, attempt - 1)   // 1s, 2s, 4s
      await sleep(delay)

  Used by: TriageTicketUseCase wraps AI call in RetryHandler
```

---

## 10. Route Definitions

### 10.1 Ticket Routes

```
Router: /api/tickets

POST   /               → [validate(createTicketSchema)]           → ticketController.create
GET    /               → [authMiddleware, validate(ticketQuerySchema, 'query')]
                                                                   → ticketController.getAll
GET    /:id            → [authMiddleware]                          → ticketController.getById
PATCH  /:id            → [authMiddleware, validate(updateStatusSchema)]
                                                                   → ticketController.updateStatus
```

### 10.2 Auth Routes

```
Router: /api/auth

POST   /register       → [validate(registerSchema)]               → authController.register
POST   /login          → [validate(loginSchema)]                   → authController.login
```

### 10.3 Health Routes

```
Router: /api

GET    /health         →                                           → healthController.check
```

---

## 11. Presenter Design (Response Formatting)

### 11.1 Ticket Presenter

```
ticketPresenter.format(ticket):
  Returns:
  {
    id:             ticket._id || ticket.id,
    title:          ticket.title,
    description:    ticket.description,
    customer_email: ticket.customer_email,
    status:         ticket.status,
    category:       ticket.category,
    priority:       ticket.priority,
    triageAttempts: ticket.triageAttempts,
    createdAt:      ticket.createdAt,
    updatedAt:      ticket.updatedAt,
  }

  Purpose: Strips Mongoose internals (_id → id, __v removed),
           ensures consistent field order across all ticket responses.
```

### 11.2 Error Presenter

```
errorPresenter.format(error):
  Returns:
  {
    error: {
      code:    error.code,
      message: error.message,
      details: error.details || []
    }
  }
```

---

## 12. Docker Architecture

### 12.1 Services

```yaml
# docker-compose.yml defines three services:

services:
  api:
    build: .
    ports: "3000:3000"
    environment: loaded from .env
    depends_on: mongodb
    healthcheck: curl /api/health

  frontend:
    build: ./frontend
    ports: "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:3000/api
    depends_on: api

  mongodb:
    image: mongo:7
    ports: "27017:27017"
    volumes: persistent data volume
```

### 12.2 Backend Dockerfile Strategy

```dockerfile
# Multi-stage build:
# Stage 1: Install dependencies (cached layer)
# Stage 2: Copy source, set NODE_ENV=production, CMD ["node", "src/server.js"]

Base image: node:20-alpine
Workdir:    /app
User:       node (non-root)
Expose:     3000
```

### 12.3 Frontend Dockerfile Strategy

```dockerfile
# Multi-stage build:
# Stage 1: Install deps + build (next build)
# Stage 2: Production image with standalone output

Base image: node:20-alpine
Workdir:    /app
Build:      next build (standalone output)
User:       nextjs (non-root)
Expose:     3000
CMD:        ["node", "server.js"]
```

---

## 13. Configuration Management

### 13.1 env.js Design

```
backend/src/infrastructure/config/env.js

Responsibilities:
  1. Load environment variables via process.env
  2. Validate required vars are present (fail fast on startup)
  3. Apply defaults for optional vars
  4. Export a frozen config object

Exported Config Shape:
  {
    port:             number,
    nodeEnv:          string,
    mongodbUri:       string,
    jwtSecret:        string,
    jwtExpiresIn:     string,
    geminiApiKey:     string,
    geminiModel:      string,
    maxTriageRetries: number,
    corsOrigin:       string,
    bcryptSaltRounds: number,
    logLevel:         string,
  }
```

---

## 14. Test Strategy (Detailed)

### 14.1 Test Fakes (In-Memory Implementations)

| Fake                          | Implements                 | Storage               | Behavior                                                                |
| ----------------------------- | -------------------------- | --------------------- | ----------------------------------------------------------------------- |
| `FakeTicketRepository`        | `ITicketRepository`        | `Map<id, ticket>`     | Full CRUD, auto-generates ObjectId-like IDs                             |
| `FakeAgentRepository`         | `IAgentRepository`         | `Map<id, agent>`      | create, findByEmail                                                     |
| `FakeTicketHistoryRepository` | `ITicketHistoryRepository` | `Array<history>`      | Append-only, filterable by ticketId                                     |
| `FakeAITriageService`         | `IAITriageService`         | Configurable response | Returns preset `{ category, priority }` or throws                       |
| `FakeAuthService`             | `IAuthService`             | Passthrough           | hash → `"hashed_" + plain`, compare → string match, token → JSON string |

### 14.2 Test Factory

```
testFactory.js — Generates valid test data:

  createTicketData(overrides)   → { title, description, customer_email, ...overrides }
  createAgentData(overrides)    → { email, password, name, ...overrides }
  createTicket(overrides)       → Full ticket object with id, timestamps
  createAgent(overrides)        → Full agent object with id, timestamps
```

### 14.3 Coverage Targets

| Directory                        | Target          | Rationale                |
| -------------------------------- | --------------- | ------------------------ |
| `backend/src/entities/`                  | ≥ 90% lines     | Pure logic, easy to test |
| `backend/src/useCases/`                  | ≥ 85% lines     | Core business logic      |
| `backend/src/infrastructure/validators/` | ≥ 90% branches  | Input boundary defense   |
| `backend/src/interfaces/controllers/`    | ≥ 70% lines     | Thin, mostly delegation  |
| **Overall**                      | **≥ 80% lines** | **NFR-04.1 requirement** |

### 14.4 Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js", // bootstrap, not unit-testable
    "!src/infrastructure/config/env.js", // env-dependent
  ],
  coverageThresholds: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ["text", "text-summary", "lcov"],
};
```

---

## 15. Sequence Diagrams

### 15.1 Ticket Creation (Happy Path)

```
Customer              API Server          CreateTicketUC       TriageTicketUC       GeminiAI        MongoDB
   │                      │                    │                    │                  │               │
   │  POST /api/tickets   │                    │                    │                  │               │
   │─────────────────────▶│                    │                    │                  │               │
   │                      │  validate(body)    │                    │                  │               │
   │                      │───────┐            │                    │                  │               │
   │                      │◀──────┘            │                    │                  │               │
   │                      │                    │                    │                  │               │
   │                      │  execute(dto)      │                    │                  │               │
   │                      │───────────────────▶│                    │                  │               │
   │                      │                    │  repo.create()     │                  │               │
   │                      │                    │──────────────────────────────────────────────────────▶│
   │                      │                    │◀─────────────────────────────────────────────────────│
   │                      │                    │  historyRepo.create('created')                       │
   │                      │                    │──────────────────────────────────────────────────────▶│
   │                      │                    │                    │                  │               │
   │                      │                    │  triage.execute()  │                  │               │
   │                      │                    │───────────────────▶│                  │               │
   │                      │                    │                    │  classify()      │               │
   │                      │                    │                    │─────────────────▶│               │
   │                      │                    │                    │  {category,prio} │               │
   │                      │                    │                    │◀─────────────────│               │
   │                      │                    │                    │  repo.update()   │               │
   │                      │                    │                    │──────────────────────────────────▶│
   │                      │                    │                    │  history('triage_completed')     │
   │                      │                    │                    │──────────────────────────────────▶│
   │                      │                    │◀───────────────────│                  │               │
   │                      │◀───────────────────│                    │                  │               │
   │   201 { ticket }     │                    │                    │                  │               │
   │◀─────────────────────│                    │                    │                  │               │
```

### 15.2 Ticket Creation (AI Failure Path)

```
Customer              API Server          CreateTicketUC       TriageTicketUC       GeminiAI        MongoDB
   │                      │                    │                    │                  │               │
   │  POST /api/tickets   │                    │                    │                  │               │
   │─────────────────────▶│                    │                    │                  │               │
   │                      │  execute(dto)      │                    │                  │               │
   │                      │───────────────────▶│                    │                  │               │
   │                      │                    │  repo.create()     │                  │               │
   │                      │                    │──────────────────────────────────────────────────────▶│
   │                      │                    │  historyRepo.create('created')                       │
   │                      │                    │──────────────────────────────────────────────────────▶│
   │                      │                    │                    │                  │               │
   │                      │                    │  triage.execute()  │                  │               │
   │                      │                    │───────────────────▶│                  │               │
   │                      │                    │                    │  classify()      │               │
   │                      │                    │                    │─────────────────▶│               │
   │                      │                    │                    │    ❌ TIMEOUT     │               │
   │                      │                    │                    │◀─────────────────│               │
   │                      │                    │                    │  repo.update(pending_triage)     │
   │                      │                    │                    │──────────────────────────────────▶│
   │                      │                    │  catch → return    │                  │               │
   │                      │                    │  ticket as-is      │                  │               │
   │                      │◀───────────────────│                    │                  │               │
   │   201 { ticket }     │                    │                    │                  │               │
   │  (pending_triage)    │                    │                    │                  │               │
   │◀─────────────────────│                    │                    │                  │               │
```

---

## 16. RBAC Extension Point (Verification Scenario)

The current design supports future RBAC with minimal changes:

```
Current:  Agent.role = 'agent'  (single role)

Future Extension:
  1. Add roles to enums.js: ['agent', 'admin', 'read_only']
  2. Create authorize(requiredRoles) middleware:
     - Reads req.agent.role (set by authMiddleware)
     - Checks role ∈ requiredRoles
     - Returns 403 Forbidden if not authorized
  3. Apply to routes:
     - GET  /api/tickets     → authorize(['agent', 'admin', 'read_only'])
     - PATCH /api/tickets/:id → authorize(['agent', 'admin'])
     - POST /api/auth/register → authorize(['admin'])
  4. No changes to use cases or entities — RBAC lives entirely in middleware.
```

---

## 17. Frontend Architecture Design

### 17.1 API Client (`frontend/lib/api.ts`)

```
Const: API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

Helper: apiFetch(endpoint, options)
  - Prepends API_BASE to endpoint
  - Auto-attaches Authorization: Bearer <token> from auth context if available
  - Parses JSON response
  - On 401 → clears auth state, redirects to /login
  - On error → throws structured error for UI consumption

Exported Functions:
  createTicket(data)           → POST /tickets     (public, no token)
  getTickets(params)           → GET  /tickets     (authenticated)
  getTicketById(id)            → GET  /tickets/:id (authenticated)
  updateTicketStatus(id, data) → PATCH /tickets/:id (authenticated)
  loginAgent(credentials)      → POST /auth/login  (public)
  registerAgent(data)          → POST /auth/register (public)
```

### 17.2 Auth Context (`frontend/lib/auth-context.tsx`)

```
AuthProvider (wraps entire app in layout.tsx):

  State:
    - agent: { id, email, name, role } | null
    - token: string | null
    - isLoading: boolean

  On mount:
    - Read token from localStorage
    - If token exists and is valid, decode and set agent
    - If token is expired, clear state

  Methods:
    login(email, password):
      1. Call loginAgent(credentials)
      2. Store token in localStorage
      3. Set agent + token in state
      4. Redirect to /dashboard

    logout():
      1. Clear localStorage
      2. Clear state
      3. Redirect to /login

  Hook: useAuth()
    Returns: { agent, token, isLoading, login, logout, isAuthenticated }
```

### 17.3 Page Designs

#### 17.3.1 Submission Page (`/` — FR-13)

```
Layout:
  ┌─────────────────────────────────────────────────┐
  │  Navbar: "Smart Triage" logo  |  Agent Login →  │
  ├─────────────────────────────────────────────────┤
  │                                                  │
  │  ┌─────────── Card ────────────────────────┐    │
  │  │  "Submit a Support Ticket"                │    │
  │  │                                           │    │
  │  │  Title:        [ Input                  ] │    │
  │  │  Description:  [ Textarea               ] │    │
  │  │  Email:        [ Input                  ] │    │
  │  │                                           │    │
  │  │            [ Submit Ticket ]               │    │
  │  └───────────────────────────────────────────┘    │
  │                                                  │
  └──────────────────────────────────────────────────┘

  State: form fields, isSubmitting, success/error message
  Validation: Zod schema (same rules as backend) via React Hook Form
  On Submit: createTicket(data) → show success with ticket ID or error toast
```

#### 17.3.2 Login Page (`/login` — FR-14)

```
Layout:
  ┌─────────────────────────────────────────────────┐
  │  Navbar: "Smart Triage" logo  |  Submit Ticket  │
  ├─────────────────────────────────────────────────┤
  │                                                  │
  │  ┌─────────── Card ────────────────────────┐    │
  │  │  "Agent Login"                            │    │
  │  │                                           │    │
  │  │  Email:     [ Input                     ] │    │
  │  │  Password:  [ Input (password)          ] │    │
  │  │                                           │    │
  │  │              [ Sign In ]                   │    │
  │  └───────────────────────────────────────────┘    │
  │                                                  │
  └──────────────────────────────────────────────────┘

  State: form fields, isSubmitting, error message
  On Submit: auth.login(email, password) → redirect to /dashboard or show error
  Guard: if already authenticated, redirect to /dashboard
```

#### 17.3.3 Dashboard Page (`/dashboard` — FR-16, FR-17)

```
Layout:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Navbar: "Smart Triage" logo  |  Agent: {name}  |  [ Logout ]          │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  Filters:  [Status ▾]  [Priority ▾]  [Category ▾]     Showing 1-10/42  │
  │                                                                         │
  │  ┌──────────────────────────────────────────────────────────────────┐   │
  │  │ Title          │ Status     │ Category      │ Priority │ Created │   │
  │  ├────────────────┼────────────┼───────────────┼──────────┼─────────┤   │
  │  │ Login broken   │ [Open ▾]   │ Technical Bug │ 🔴 High  │ 2h ago  │   │
  │  │ Wrong charge   │ [Open ▾]   │ Billing       │ 🟡 Med   │ 5h ago  │   │
  │  │ Add dark mode  │ [Resolved] │ Feature Req.  │ 🟢 Low   │ 1d ago  │   │
  │  └──────────────────────────────────────────────────────────────────┘   │
  │                                                                         │
  │  ← Previous   Page 1 of 5   Next →                                     │
  └─────────────────────────────────────────────────────────────────────────┘

  Data Flow:
    1. On mount + filter change: GET /api/tickets?page=X&limit=10&status=Y&priority=Z
    2. Display tickets in Shadcn Table
    3. Status column: Select dropdown showing only valid next transitions
    4. On status change:
       a. Optimistic: immediately update local state
       b. Background: PATCH /api/tickets/:id { status }
       c. On success: confirm (no visual change)
       d. On failure: revert local state + show error toast

  Auth Guard: dashboard/layout.tsx checks useAuth().isAuthenticated
    - If not authenticated → redirect to /login
    - If loading → show skeleton
```

### 17.4 Component Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│  app/layout.tsx                                             │
│    └── AuthProvider                                         │
│         └── Toaster                                         │
│              └── Navbar                                      │
│                   └── <children>                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  app/page.tsx (/)                                           │
│    └── TicketForm                                           │
│         ├── uses: api.createTicket()                        │
│         ├── uses: Shadcn Input, Textarea, Button, Card      │
│         └── uses: React Hook Form + Zod                     │
│                                                             │
│  app/login/page.tsx (/login)                                │
│    └── LoginForm                                            │
│         ├── uses: useAuth().login()                         │
│         ├── uses: Shadcn Input, Button, Card                │
│         └── uses: React Hook Form + Zod                     │
│                                                             │
│  app/dashboard/layout.tsx                                   │
│    └── AuthGuard (redirects if not authenticated)           │
│                                                             │
│  app/dashboard/page.tsx (/dashboard)                        │
│    ├── TicketFilters                                        │
│    │    └── uses: Shadcn Select                             │
│    ├── TicketTable                                          │
│    │    ├── uses: api.getTickets()                          │
│    │    ├── StatusBadge (color-coded)                       │
│    │    ├── PriorityBadge (color-coded)                     │
│    │    └── StatusSelect (inline change → optimistic)       │
│    │         └── uses: api.updateTicketStatus()             │
│    └── Pagination                                           │
│         └── uses: Shadcn Button                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 17.5 Status Color Mapping

| Status           | Badge Variant | Tailwind Color                  |
| ---------------- | ------------- | ------------------------------- |
| `Open`           | `default`     | `bg-blue-100 text-blue-800`     |
| `In Progress`    | `secondary`   | `bg-yellow-100 text-yellow-800` |
| `Resolved`       | `success`     | `bg-green-100 text-green-800`   |
| `pending_triage` | `outline`     | `bg-gray-100 text-gray-600`     |
| `triage_failed`  | `destructive` | `bg-red-100 text-red-800`       |

### 17.6 Priority Color Mapping

| Priority | Badge Variant | Tailwind Color                  |
| -------- | ------------- | ------------------------------- |
| `High`   | `destructive` | `bg-red-100 text-red-800`       |
| `Medium` | `secondary`   | `bg-yellow-100 text-yellow-800` |
| `Low`    | `default`     | `bg-green-100 text-green-800`   |
| `null`   | `outline`     | `bg-gray-100 text-gray-500`     |

### 17.7 Valid Status Transitions (Frontend)

The frontend mirrors the backend state machine to show only valid options:

```
VALID_TRANSITIONS = {
  'Open':           ['In Progress', 'Resolved'],
  'In Progress':    ['Open', 'Resolved'],
  'Resolved':       ['Open'],
  'pending_triage': ['Open'],
  'triage_failed':  ['Open'],
}
```

---

> **Next Phase:** [TASKS.md](./TASKS.md) — Granular, checkbox-based execution plan with estimated effort per task.
