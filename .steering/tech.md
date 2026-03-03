# Technology Stack — Smart Triage Ticketing System

## Runtime & Language

| Technology              | Version | Purpose                     |
| ----------------------- | ------- | --------------------------- |
| **Node.js**             | 20 LTS  | Backend runtime             |
| **TypeScript**          | 5.x     | Frontend language (Next.js) |
| **JavaScript (ES2022)** | —       | Backend language (Express)  |

## Backend

| Package                   | Version | Purpose                                                 |
| ------------------------- | ------- | ------------------------------------------------------- |
| **Express.js**            | 4.x     | HTTP framework, routing, middleware pipeline            |
| **Mongoose**              | 8.x     | MongoDB ODM, schema definitions, indexing               |
| **Zod**                   | 3.x     | Runtime input validation (request bodies, query params) |
| **jsonwebtoken**          | 9.x     | JWT creation and verification                           |
| **bcryptjs**              | 2.x     | Password hashing (10 salt rounds)                       |
| **@google/generative-ai** | latest  | Google Gemini SDK for AI triage                         |
| **cors**                  | 2.x     | Cross-Origin Resource Sharing middleware                |
| **dotenv**                | 16.x    | Environment variable loading                            |

## Frontend

| Package                 | Version | Purpose                                            |
| ----------------------- | ------- | -------------------------------------------------- |
| **Next.js**             | 14+     | React framework (App Router, SSR/CSR)              |
| **React**               | 18.x    | UI library                                         |
| **Tailwind CSS**        | 3.x     | Utility-first CSS framework                        |
| **Shadcn/ui**           | latest  | Accessible component library (Radix UI + Tailwind) |
| **React Hook Form**     | 7.x     | Form state management                              |
| **@hookform/resolvers** | 3.x     | Zod integration for React Hook Form                |
| **Zod**                 | 3.x     | Shared validation schemas (frontend)               |

## Database

| Technology  | Version | Purpose                                                             |
| ----------- | ------- | ------------------------------------------------------------------- |
| **MongoDB** | 7.x     | Document database (3 collections: tickets, agents, tickethistories) |

### Indexes (10 total)

- **tickets:** status, priority, category, createdAt (desc), status+priority (compound)
- **agents:** email (unique)
- **tickethistories:** ticketId+createdAt (compound)

## Testing

| Package       | Version | Purpose                           |
| ------------- | ------- | --------------------------------- |
| **Jest**      | 29.x    | Test runner and assertion library |
| **Supertest** | 6.x     | HTTP integration testing          |

### Testing Strategy

- **Unit tests:** Entities, use cases, validators — using in-memory fakes (no DB)
- **Integration tests:** HTTP routes via Supertest — mocked use cases
- **Coverage target:** ≥80% overall line coverage, ≥90% for entities/validators

## Infrastructure & DevOps

| Technology         | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| **Docker**         | Containerization (multi-stage builds, node:20-alpine, non-root user) |
| **docker-compose** | Multi-service orchestration (3 services: api, frontend, mongodb)     |
| **ESLint**         | JavaScript/TypeScript linting                                        |
| **Prettier**       | Code formatting                                                      |
| **nodemon**        | Backend auto-restart in development                                  |

## AI Integration

| Aspect                  | Detail                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **Provider**            | Google Gemini (gemini-2.0-flash)                                     |
| **SDK**                 | @google/generative-ai                                                |
| **Retry Strategy**      | Exponential backoff: 1s → 2s → 4s, max 3 attempts                    |
| **Failure Mode**        | Circuit breaker — ticket enters `pending_triage` state on exhaustion |
| **Prompt**              | Structured JSON output requesting `category` and `priority` fields   |
| **Response Validation** | Zod schema validates AI response before applying to ticket           |

## Authentication

| Aspect               | Detail                                                            |
| -------------------- | ----------------------------------------------------------------- |
| **Method**           | JWT Bearer tokens                                                 |
| **Algorithm**        | HS256                                                             |
| **Expiration**       | 24 hours                                                          |
| **Password Storage** | bcryptjs with 10 salt rounds                                      |
| **Protected Routes** | All `/api/tickets` GET/PATCH endpoints, `/api/auth/register`      |
| **Public Routes**    | `POST /api/tickets` (customer submission), `POST /api/auth/login` |

## Architecture Pattern

**Clean Architecture (4 Layers):**

1. **Entities** (Layer 1) — Pure domain models, zero dependencies, business rules
2. **Use Cases** (Layer 2) — Application logic, orchestrates entities and interfaces
3. **Interface Adapters** (Layer 3) — Controllers, presenters, abstract repository/service contracts
4. **Infrastructure** (Layer 4) — Mongoose, Gemini SDK, JWT, Express middleware, config

**Dependency Rule:** Inner layers never import from outer layers. Dependency Injection via Composition Root (`container.js`).

## Environment Variables

### Backend

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smart-triage
JWT_SECRET=<your-secret>
GEMINI_API_KEY=<your-gemini-key>
NODE_ENV=development
```

### Frontend

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Ports

| Service            | Port  |
| ------------------ | ----- |
| Backend API        | 3000  |
| Frontend (Next.js) | 3001  |
| MongoDB            | 27017 |
