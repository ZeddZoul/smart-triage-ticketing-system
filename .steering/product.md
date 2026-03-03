# Product Overview — Smart Triage Ticketing System

## What Is This Product?

The **Smart Triage Ticketing System** is an AI-augmented customer support platform that eliminates the manual overhead of categorizing and prioritizing incoming tickets. When a customer submits a support request, the system automatically invokes a Large Language Model (Google Gemini) to classify the ticket's **category** (e.g., Billing, Technical Bug, Feature Request) and **priority** (High, Medium, Low), then surfaces the enriched ticket to authenticated Support Agents on a real-time dashboard.

## Target Users

| Persona           | Role                       | Interaction                                                  |
| ----------------- | -------------------------- | ------------------------------------------------------------ |
| **Customer**      | External, unauthenticated  | Submits tickets via a public web form                        |
| **Support Agent** | Internal, authenticated    | Views, filters, and manages tickets on a protected dashboard |
| **System (AI)**   | Automated background actor | Classifies tickets on creation via Gemini LLM                |

## Core Feature Set

1. **Ticket Submission** — Public form accepting title, description, and customer email. No authentication required.
2. **AI Triage** — Automatic classification of category and priority via Google Gemini, triggered immediately on ticket creation.
3. **Graceful AI Degradation** — If Gemini is unreachable after 3 retries (exponential backoff: 1s, 2s, 4s), the ticket enters `pending_triage` state and remains accessible to agents.
4. **Agent Authentication** — JWT-based login/registration for support agents. Protected routes require a valid Bearer token.
5. **Agent Dashboard** — Authenticated view with filterable, paginated data table. Agents can filter by status, priority, and category.
6. **Inline Status Management** — Agents update ticket status with validated transitions (e.g., Open → In Progress → Resolved → Closed). Optimistic UI with revert-on-error.
7. **Audit Trail** — Every state change is recorded in a TicketHistory collection with timestamp, action, performer, and before/after values.

## Business Objectives

- Demonstrate a production-grade full-stack architecture for a technical assessment.
- Prove AI integration with resilient failure handling (circuit breaker, retries).
- Achieve ≥80% test coverage with Clean Architecture enabling testable, decoupled layers.
- Show complete Docker containerization: `docker-compose up` runs the entire stack.

## Ticket Lifecycle

```
                ┌──────────────────┐
                │ pending_triage   │  (AI queued / failed)
                └────────┬─────────┘
                         │ AI classifies
                         ▼
                ┌──────────────────┐
          ┌────▶│     Open         │
          │     └────────┬─────────┘
          │              │ Agent picks up
          │              ▼
          │     ┌──────────────────┐
          │     │  In Progress     │
          │     └────────┬─────────┘
          │              │ Agent resolves
          │              ▼
          │     ┌──────────────────┐
          └─────│   Resolved       │  (can reopen → Open)
                └────────┬─────────┘
                         │ Agent closes
                         ▼
                ┌──────────────────┐
                │    Closed         │  (terminal)
                └──────────────────┘
```

## Out of Scope (MVP)

- Role-based access control (Admin vs. Read-Only) — designed as extension point, not implemented.
- Real-time WebSocket updates.
- Ticket assignment to specific agents.
- Customer-facing ticket tracking portal.
- Email/SMS notifications.
- File attachments on tickets.

## Planning Documents

| Document                                | Purpose                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| [SPEC.md](docs/SPEC.md)                 | Phase 1 — Vision, personas, goals, architecture philosophy              |
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | Phase 2 — Traceable functional & non-functional requirements            |
| [DESIGN.md](docs/DESIGN.md)             | Phase 3 — Technical design, schemas, interfaces, component architecture |
| [TASKS.md](docs/TASKS.md)               | Phase 4 — 110-task execution checklist across 14 phases                 |
