# Smart Triage Ticketing System

An AI-powered support ticket triage and management system built with **Clean Architecture**. Customers submit tickets through a public form, Google Gemini AI automatically classifies them by category and priority, and support agents manage tickets through a real-time dashboard.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│  Ticket Form  │  Agent Login  │  Dashboard (filters, status)    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼─────────────────────────────────────┐
│                      Backend (Express.js)                        │
│                                                                  │
│  Layer 1: Entities       (Ticket, Agent, TicketHistory, Enums)   │
│  Layer 2: Use Cases      (Create, Triage, Get, Update, Auth)     │
│  Layer 3: Interfaces     (Controllers, Presenters, Repos)        │
│  Layer 4: Infrastructure (MongoDB, Gemini AI, JWT, Middleware)   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  MongoDB 7   │   Google Gemini 2.0 Flash                         │
└─────────────────────────────────────────────────────────────────┘
```

**Backend:** Node.js 20, Express, Mongoose, JWT, Zod validation  
**Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Shadcn/ui  
**AI:** Google Gemini 2.0 Flash via `@google/genai` SDK  
**Database:** MongoDB 7 with Mongoose ODM

---

## Quick Start (Docker)

The fastest way to run the entire system:

```bash
# 1. Clone and configure
git clone <repo-url>
cd smart-triage-ticketing-system
cp backend/.env.example backend/.env

# 2. Edit backend/.env — set your Gemini API key and a strong JWT secret
#    GEMINI_API_KEY=your-key-here
#    JWT_SECRET=your-strong-random-secret

# 3. Start all services
docker-compose up --build

# 4. Seed a default agent account
docker exec smart-triage-api node src/scripts/seed.js
```

| Service  | URL                       |
| -------- | ------------------------- |
| Frontend | http://localhost:3001     |
| Backend  | http://localhost:3000/api |
| MongoDB  | mongodb://localhost:27017 |

**Default Agent Credentials** (after seeding):

- Email: `agent@smarttriage.com`
- Password: `password123`

---

## Manual Setup

### Prerequisites

- Node.js 20+
- pnpm
- MongoDB 7 (running locally or via Docker)
- Google Gemini API key

### Backend

```bash
cd backend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Seed default agent
node src/scripts/seed.js

# Start development server
pnpm run dev
# → http://localhost:3000
```

### Frontend

```bash
cd frontend
pnpm install

# Start development server
pnpm run dev -- -p 3001
# → http://localhost:3001
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable             | Required | Default                 | Description                   |
| -------------------- | -------- | ----------------------- | ----------------------------- |
| `PORT`               | No       | `3000`                  | Server port                   |
| `NODE_ENV`           | No       | `development`           | Environment mode              |
| `MONGODB_URI`        | **Yes**  | —                       | MongoDB connection string     |
| `JWT_SECRET`         | **Yes**  | —                       | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN`     | No       | `24h`                   | Token expiration duration     |
| `BCRYPT_SALT_ROUNDS` | No       | `10`                    | bcrypt hashing rounds         |
| `GEMINI_API_KEY`     | **Yes**  | —                       | Google Gemini API key         |
| `GEMINI_MODEL`       | No       | `gemini-2.0-flash`      | Gemini model name             |
| `MAX_TRIAGE_RETRIES` | No       | `3`                     | Max AI triage retry attempts  |
| `CORS_ORIGIN`        | No       | `http://localhost:3001` | Allowed CORS origin           |
| `LOG_LEVEL`          | No       | `info`                  | Logging verbosity             |

### Frontend (`frontend/.env.local`)

| Variable              | Default                     | Description          |
| --------------------- | --------------------------- | -------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | Backend API base URL |

---

## API Endpoints

### Health

| Method | Endpoint      | Auth   | Description          |
| ------ | ------------- | ------ | -------------------- |
| GET    | `/api/health` | Public | Service health check |

### Tickets

| Method | Endpoint                  | Auth         | Description                |
| ------ | ------------------------- | ------------ | -------------------------- |
| POST   | `/api/tickets`            | Public       | Create a ticket (customer) |
| GET    | `/api/tickets`            | Bearer token | List tickets (paginated)   |
| GET    | `/api/tickets/:id`        | Bearer token | Get ticket by ID           |
| PATCH  | `/api/tickets/:id`        | Bearer token | Update ticket status       |
| POST   | `/api/tickets/:id/retriage` | Bearer token | Re-run AI triage on a failed ticket |
| GET    | `/api/tickets/:id/history`  | Bearer token | Get ticket audit history timeline |

**Query Parameters for GET /api/tickets:**

| Param       | Type   | Default      | Description                                     |
| ----------- | ------ | ------------ | ----------------------------------------------- |
| `page`      | number | `1`          | Page number                                     |
| `limit`     | number | `10`         | Items per page (max 100)                        |
| `status`    | string | —            | Filter: Open, In Progress, Resolved, etc.       |
| `priority`  | string | —            | Filter: High, Medium, Low                       |
| `category`  | string | —            | Filter: Technical Bug, Billing, Feature Request |
| `search`    | string | —            | Text search across ticket title & description   |
| `sortBy`    | string | `created_at` | Sort field                                      |
| `sortOrder` | string | `desc`       | Sort direction (asc/desc)                       |

### Authentication

| Method | Endpoint             | Auth   | Description           |
| ------ | -------------------- | ------ | --------------------- |
| POST   | `/api/auth/register` | Public | Register an agent     |
| POST   | `/api/auth/login`    | Public | Login and receive JWT |

---

## Frontend Routes

| Route         | Access          | Description                                    |
| ------------- | --------------- | ---------------------------------------------- |
| `/`           | Public          | Customer ticket submission form                |
| `/login`      | Public          | Agent login page                               |
| `/register`   | Public          | Agent registration page                        |
| `/dashboard`  | Authenticated   | Agent dashboard — ticket list, filters, search, stats |
| `/tickets/:id`| Authenticated   | Ticket detail — full description, status update, history timeline |

### Agent Access

The agent portal is intentionally not linked from the public-facing UI. To access:

1. **Login:** Navigate to [http://localhost:3001/login](http://localhost:3001/login)
2. **Register a new agent:** Navigate to [http://localhost:3001/register](http://localhost:3001/register)
3. **Dashboard:** After login you are redirected to [http://localhost:3001/dashboard](http://localhost:3001/dashboard)

**Default seeded agent credentials:**
- Email: `agent@smarttriage.com`
- Password: `password123`

---

## Testing

```bash
cd backend

# Run all tests (unit + integration)
pnpm test

# Run with verbose output
pnpm run test:verbose

# Run with coverage report
pnpm run test:coverage
```

**Test Structure:**

- `tests/unit/entities/` — Domain entity validation & state machine
- `tests/unit/validators/` — Zod schema validation
- `tests/unit/useCases/` — Business logic with in-memory fakes
- `tests/integration/` — HTTP route tests with supertest

---

## Verification Scenarios

### 1. RBAC — Role-Based Access Control

The system includes three roles in `enums.js`: `agent`, `admin`, `read_only`. To implement RBAC enforcement:

1. **Create an `authorize(requiredRoles)` middleware** that reads `req.agent.role` (set by `authMiddleware`) and returns 403 if the role is not in the required list.

2. **Apply to routes:**

   ```
   GET  /api/tickets       → authorize(['agent', 'admin', 'read_only'])
   PATCH /api/tickets/:id  → authorize(['agent', 'admin'])
   POST /api/auth/register → authorize(['admin'])
   ```

3. **No changes needed** to entities, use cases, or repositories. RBAC is isolated in the middleware layer, following Clean Architecture principles (see DESIGN.md §16).

### 2. Graceful AI Failure Strategy

When the Gemini API is unavailable or returns errors:

1. **Ticket creation never fails** — `CreateTicketUseCase` catches triage errors and still returns the created ticket with status `pending_triage` (FR-02).

2. **Retry with backoff** — `RetryHandler` implements exponential backoff (base delay × 2^attempt). After `MAX_TRIAGE_RETRIES` (default 3) failures:
   - Ticket status transitions to `triage_failed`
   - A `TRIAGE_FAILED` history record is logged
   - Category and priority remain `null`

3. **Manual recovery** — Agents can manually transition `triage_failed` tickets to `Open` and set status from the dashboard (FR-04).

4. **Error isolation** — AI failures are wrapped in `ExternalServiceError` and never leak to the HTTP response for ticket creation.

---

## Project Structure

```
smart-triage-ticketing-system/
├── backend/
│   ├── src/
│   │   ├── entities/          # Domain models (Ticket, Agent, TicketHistory)
│   │   ├── useCases/          # Business logic (7 use cases)
│   │   ├── interfaces/        # Controllers, presenters, repo contracts
│   │   ├── infrastructure/    # DB, AI, auth, middleware implementations
│   │   ├── routes/            # Express route definitions
│   │   ├── scripts/           # Seed script
│   │   ├── container.js       # Dependency injection container
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # Server bootstrap
│   ├── tests/
│   │   ├── unit/              # Unit tests (entities, validators, use cases)
│   │   ├── integration/       # HTTP integration tests
│   │   └── helpers/           # Test factories and fakes
│   ├── Dockerfile             # Backend container
│   ├── package.json           # Backend dependencies & scripts
│   └── jest.config.js         # Test configuration
├── frontend/
│   ├── app/                   # Next.js pages (/, /login, /dashboard, /tickets/:id)
│   ├── components/            # React components + Shadcn/ui
│   └── lib/                   # API client, auth context, types
├── docs/                      # SPEC, REQUIREMENTS, DESIGN, TASKS
├── .steering/                 # Project steering documents
├── AI_JOURNEY.md              # AI development journey log
├── README.md                  # This file
└── docker-compose.yml         # Full stack orchestration
```

---

## License

MIT
