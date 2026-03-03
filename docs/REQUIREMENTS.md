# REQUIREMENTS.md — Smart Triage Ticketing System

> **Phase 2 of 4** | V-Model Planning Method  
> **Version:** 1.0.0  
> **Date:** 2026-03-03  
> **Depends On:** [SPEC.md](./SPEC.md)

---

## 1. Document Purpose

This document translates the vision and goals from SPEC.md into **traceable, testable requirements** covering the full stack: Express.js backend and Next.js frontend. Every requirement has a unique ID, acceptance criteria, and a mapping to the SPEC goal it satisfies. Implementation code must not begin until this document is approved.

### Requirement Priority Key

| Label      | Meaning                                                  |
| ---------- | -------------------------------------------------------- |
| **MUST**   | Non-negotiable for MVP. Blocks release if missing.       |
| **SHOULD** | High value. Implement if time permits within the sprint. |
| **COULD**  | Nice-to-have. Can be deferred to a future iteration.     |

---

## 2. Functional Requirements — Backend

### 2.1 Ticket Creation (Public)

#### FR-01: Create Ticket Endpoint

| Attribute       | Detail                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **ID**          | FR-01                                                                                                                       |
| **Priority**    | MUST                                                                                                                        |
| **SPEC Goal**   | G-01, G-02                                                                                                                  |
| **Actor**       | Customer (unauthenticated)                                                                                                  |
| **Endpoint**    | `POST /api/tickets`                                                                                                         |
| **Description** | Accepts a new support ticket, persists it, triggers AI triage asynchronously, and returns the created ticket to the caller. |

**Request Body:**

```json
{
  "title": "string (required, 5-200 characters)",
  "description": "string (required, 10-5000 characters)",
  "customer_email": "string (required, valid email format)"
}
```

**Acceptance Criteria:**

| #       | Criterion                                                                                                                                                      | Test Type  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| AC-01.1 | Given valid input, the system creates a ticket and returns `201 Created` with the ticket object including `id`, `status`, `category`, `priority`, `createdAt`. | Unit + E2E |
| AC-01.2 | The initial `status` is set to `Open` when AI triage succeeds immediately.                                                                                     | Unit       |
| AC-01.3 | The `category` is one of: `Billing`, `Technical Bug`, `Feature Request`.                                                                                       | Unit       |
| AC-01.4 | The `priority` is one of: `High`, `Medium`, `Low`.                                                                                                             | Unit       |
| AC-01.5 | A `TicketHistory` record with action `created` is persisted.                                                                                                   | Unit       |
| AC-01.6 | If `title` is missing or < 5 chars, return `400 Bad Request` with a descriptive error.                                                                         | Unit       |
| AC-01.7 | If `description` is missing or < 10 chars, return `400 Bad Request`.                                                                                           | Unit       |
| AC-01.8 | If `customer_email` is missing or invalid, return `400 Bad Request`.                                                                                           | Unit       |
| AC-01.9 | Extra/unknown fields in the request body are silently stripped (no error).                                                                                     | Unit       |

---

#### FR-02: Graceful AI Failure on Ticket Creation

| Attribute       | Detail                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**          | FR-02                                                                                                                                                   |
| **Priority**    | MUST                                                                                                                                                    |
| **SPEC Goal**   | G-02, G-08                                                                                                                                              |
| **Actor**       | System                                                                                                                                                  |
| **Description** | If the AI triage service is unreachable or returns an error during ticket creation, the ticket must still be saved successfully with a degraded status. |

**Acceptance Criteria:**

| #       | Criterion                                                                                                                | Test Type |
| ------- | ------------------------------------------------------------------------------------------------------------------------ | --------- |
| AC-02.1 | If the AI call throws an error, the ticket is saved with `status: "pending_triage"`, `category: null`, `priority: null`. | Unit      |
| AC-02.2 | The customer still receives a `201 Created` response (not a 500).                                                        | Unit      |
| AC-02.3 | A `TicketHistory` record with action `created` is persisted even on AI failure.                                          | Unit      |
| AC-02.4 | The `triageAttempts` field is incremented to `1` after the first failed attempt.                                         | Unit      |

---

### 2.2 AI Triage

#### FR-03: AI-Powered Ticket Classification

| Attribute       | Detail                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| **ID**          | FR-03                                                                                                              |
| **Priority**    | MUST                                                                                                               |
| **SPEC Goal**   | G-01                                                                                                               |
| **Actor**       | System (AI)                                                                                                        |
| **Description** | The system sends the ticket's `title` and `description` to Google Gemini and receives a structured classification. |

**AI Prompt Contract:**

The system constructs a prompt that includes:

1. The ticket `title` and `description`.
2. Instructions to return **only** a JSON object.
3. The allowed values for `category` and `priority`.

**Expected AI Response:**

```json
{
  "category": "Billing" | "Technical Bug" | "Feature Request",
  "priority": "High" | "Medium" | "Low"
}
```

**Acceptance Criteria:**

| #       | Criterion                                                                                                                                                                    | Test Type |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AC-03.1 | The `TriageTicketUseCase` sends the ticket description to the `IAITriageService` and receives a `{ category, priority }` response.                                           | Unit      |
| AC-03.2 | If the AI returns a category not in the allowed set, the use case defaults to `category: null` and marks status as `pending_triage`.                                         | Unit      |
| AC-03.3 | If the AI returns a priority not in the allowed set, the use case defaults to `priority: null` and marks status as `pending_triage`.                                         | Unit      |
| AC-03.4 | If the AI response cannot be parsed as JSON, the triage is treated as failed.                                                                                                | Unit      |
| AC-03.5 | On successful triage, the ticket's `status` is updated to `Open`, `category` and `priority` are set, and a `TicketHistory` record with action `triage_completed` is created. | Unit      |

---

#### FR-04: Retry Mechanism with Circuit Breaker

| Attribute       | Detail                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**          | FR-04                                                                                                                                  |
| **Priority**    | SHOULD                                                                                                                                 |
| **SPEC Goal**   | G-08                                                                                                                                   |
| **Actor**       | System                                                                                                                                 |
| **Description** | Failed AI triage attempts are retried with exponential backoff. After max retries, the ticket transitions to a terminal failure state. |

**Retry Policy:**

| Attempt     | Delay                              | Action on Failure                                    |
| ----------- | ---------------------------------- | ---------------------------------------------------- |
| 1st         | Immediate (during ticket creation) | Save as `pending_triage`, increment `triageAttempts` |
| 2nd         | 1 second backoff                   | Retry AI call, increment `triageAttempts`            |
| 3rd         | 2 seconds backoff                  | Retry AI call, increment `triageAttempts`            |
| 4th (final) | 4 seconds backoff                  | Mark as `triage_failed`, log to `TicketHistory`      |

**Acceptance Criteria:**

| #       | Criterion                                                                                                     | Test Type   |
| ------- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-04.1 | A ticket with `status: "pending_triage"` can be retried via the `TriageTicketUseCase`.                        | Unit        |
| AC-04.2 | Each retry increments `triageAttempts`.                                                                       | Unit        |
| AC-04.3 | After `triageAttempts >= 3` consecutive failures, the status transitions to `triage_failed`.                  | Unit        |
| AC-04.4 | A `TicketHistory` record with action `triage_failed` is created when max retries are exhausted.               | Unit        |
| AC-04.5 | The `RetryHandler` implements exponential backoff delays: 1s, 2s, 4s.                                         | Unit        |
| AC-04.6 | The retry mechanism does not block the original `POST /api/tickets` response — retries happen asynchronously. | Integration |

---

### 2.3 Ticket Retrieval (Authenticated)

#### FR-05: List Tickets with Pagination and Filtering

| Attribute       | Detail                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| **ID**          | FR-05                                                                                                               |
| **Priority**    | MUST                                                                                                                |
| **SPEC Goal**   | G-03                                                                                                                |
| **Actor**       | Support Agent (authenticated)                                                                                       |
| **Endpoint**    | `GET /api/tickets`                                                                                                  |
| **Description** | Returns a paginated list of tickets with optional filters for status, priority, and category. Requires a valid JWT. |

**Query Parameters:**

| Param       | Type    | Default     | Description                                                        |
| ----------- | ------- | ----------- | ------------------------------------------------------------------ |
| `page`      | integer | `1`         | Page number (1-indexed)                                            |
| `limit`     | integer | `10`        | Items per page (max 100)                                           |
| `status`    | string  | —           | Filter by status (e.g., `Open`, `In Progress`, `Resolved`)         |
| `priority`  | string  | —           | Filter by priority (`High`, `Medium`, `Low`)                       |
| `category`  | string  | —           | Filter by category (`Billing`, `Technical Bug`, `Feature Request`) |
| `sortBy`    | string  | `createdAt` | Field to sort by (`createdAt`, `updatedAt`, `priority`)            |
| `sortOrder` | string  | `desc`      | Sort direction (`asc`, `desc`)                                     |

**Response Body (200 OK):**

```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "customer_email": "string",
      "status": "Open",
      "category": "Billing",
      "priority": "High",
      "triageAttempts": 1,
      "createdAt": "2026-03-03T12:00:00Z",
      "updatedAt": "2026-03-03T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

**Acceptance Criteria:**

| #        | Criterion                                                                      | Test Type          |
| -------- | ------------------------------------------------------------------------------ | ------------------ |
| AC-05.1  | Without a JWT, the endpoint returns `401 Unauthorized`.                        | Integration        |
| AC-05.2  | With a valid JWT, the endpoint returns `200 OK` with paginated tickets.        | Unit + Integration |
| AC-05.3  | `page=2&limit=5` returns the second page of 5 items.                           | Unit               |
| AC-05.4  | `status=Open` returns only tickets with status `Open`.                         | Unit               |
| AC-05.5  | `priority=High` returns only tickets with priority `High`.                     | Unit               |
| AC-05.6  | `category=Billing` returns only tickets with category `Billing`.               | Unit               |
| AC-05.7  | Multiple filters combine with logical AND (e.g., `status=Open&priority=High`). | Unit               |
| AC-05.8  | If `page` exceeds available pages, return `200 OK` with an empty `data` array. | Unit               |
| AC-05.9  | If `limit` > 100, it is clamped to 100.                                        | Unit               |
| AC-05.10 | Results are sorted by `createdAt` descending by default.                       | Unit               |

---

#### FR-06: Get Single Ticket by ID

| Attribute       | Detail                                                   |
| --------------- | -------------------------------------------------------- |
| **ID**          | FR-06                                                    |
| **Priority**    | SHOULD                                                   |
| **SPEC Goal**   | G-03                                                     |
| **Actor**       | Support Agent (authenticated)                            |
| **Endpoint**    | `GET /api/tickets/:id`                                   |
| **Description** | Returns a single ticket by its ID. Requires a valid JWT. |

**Acceptance Criteria:**

| #       | Criterion                                                                       | Test Type   |
| ------- | ------------------------------------------------------------------------------- | ----------- |
| AC-06.1 | Given a valid ticket ID and valid JWT, returns `200 OK` with the ticket object. | Unit        |
| AC-06.2 | Given a non-existent ticket ID, returns `404 Not Found`.                        | Unit        |
| AC-06.3 | Given an invalid ObjectId format, returns `400 Bad Request`.                    | Unit        |
| AC-06.4 | Without a JWT, returns `401 Unauthorized`.                                      | Integration |

---

### 2.4 Ticket Status Update (Authenticated)

#### FR-07: Update Ticket Status

| Attribute       | Detail                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------- |
| **ID**          | FR-07                                                                                         |
| **Priority**    | MUST                                                                                          |
| **SPEC Goal**   | G-03, G-04                                                                                    |
| **Actor**       | Support Agent (authenticated)                                                                 |
| **Endpoint**    | `PATCH /api/tickets/:id`                                                                      |
| **Description** | Allows an authenticated agent to update the status of a ticket. Creates an audit trail entry. |

**Request Body:**

```json
{
  "status": "Open" | "In Progress" | "Resolved"
}
```

**Valid Status Transitions:**

```
Open         → In Progress
Open         → Resolved
In Progress  → Resolved
In Progress  → Open        (re-open)
Resolved     → Open        (re-open)
pending_triage → Open      (manual override after failed triage)
triage_failed  → Open      (manual override)
```

**Invalid Transitions (return 422):**

```
Resolved     → In Progress  (must re-open first)
pending_triage → Resolved   (cannot resolve untriaged ticket directly)
triage_failed  → Resolved   (cannot resolve untriaged ticket directly)
```

**Acceptance Criteria:**

| #       | Criterion                                                                                                                   | Test Type   |
| ------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-07.1 | Given a valid transition (`Open` → `In Progress`), the status is updated and `200 OK` is returned with the updated ticket.  | Unit        |
| AC-07.2 | A `TicketHistory` record with action `status_change`, `previousValue`, `newValue`, and `performedBy` (agent ID) is created. | Unit        |
| AC-07.3 | An invalid transition (e.g., `Resolved` → `In Progress`) returns `422 Unprocessable Entity` with a descriptive error.       | Unit        |
| AC-07.4 | A non-existent ticket ID returns `404 Not Found`.                                                                           | Unit        |
| AC-07.5 | An invalid ObjectId format returns `400 Bad Request`.                                                                       | Unit        |
| AC-07.6 | Without a JWT, returns `401 Unauthorized`.                                                                                  | Integration |
| AC-07.7 | A request body with an invalid status value (e.g., `"status": "Deleted"`) returns `400 Bad Request`.                        | Unit        |
| AC-07.8 | The `updatedAt` timestamp is refreshed on every successful status change.                                                   | Unit        |

---

### 2.5 Authentication

#### FR-08: Agent Registration (Seed / Admin Only)

| Attribute       | Detail                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **ID**          | FR-08                                                                                                                            |
| **Priority**    | MUST                                                                                                                             |
| **SPEC Goal**   | G-03                                                                                                                             |
| **Actor**       | System / Admin                                                                                                                   |
| **Endpoint**    | `POST /api/auth/register`                                                                                                        |
| **Description** | Creates a new Support Agent account. In MVP, this endpoint is available for seeding; in production, it would be admin-protected. |

**Request Body:**

```json
{
  "email": "string (required, valid email)",
  "password": "string (required, 8-128 characters)",
  "name": "string (required, 2-100 characters)"
}
```

**Acceptance Criteria:**

| #       | Criterion                                                                                                                                               | Test Type |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AC-08.1 | Given valid input, creates an agent with a bcrypt-hashed password and returns `201 Created` with `{ id, email, name, role }` (no password in response). | Unit      |
| AC-08.2 | If the email already exists, returns `409 Conflict`.                                                                                                    | Unit      |
| AC-08.3 | If `password` is < 8 characters, returns `400 Bad Request`.                                                                                             | Unit      |
| AC-08.4 | The password is **never** stored in plaintext — bcrypt with a cost factor of 10+.                                                                       | Unit      |
| AC-08.5 | The default `role` is `agent`.                                                                                                                          | Unit      |

---

#### FR-09: Agent Login

| Attribute       | Detail                                           |
| --------------- | ------------------------------------------------ |
| **ID**          | FR-09                                            |
| **Priority**    | MUST                                             |
| **SPEC Goal**   | G-03                                             |
| **Actor**       | Support Agent                                    |
| **Endpoint**    | `POST /api/auth/login`                           |
| **Description** | Authenticates an agent and returns a signed JWT. |

**Request Body:**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response Body (200 OK):**

```json
{
  "token": "string (JWT)",
  "agent": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "agent"
  }
}
```

**Acceptance Criteria:**

| #       | Criterion                                                                                                                                                       | Test Type |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AC-09.1 | Given valid credentials, returns `200 OK` with a JWT and agent profile.                                                                                         | Unit      |
| AC-09.2 | The JWT payload contains `{ agentId, email, role }` and expires in 24 hours.                                                                                    | Unit      |
| AC-09.3 | Given an incorrect password, returns `401 Unauthorized` with a generic message ("Invalid credentials") — no distinction between wrong email vs. wrong password. | Unit      |
| AC-09.4 | Given a non-existent email, returns `401 Unauthorized` with the same generic message.                                                                           | Unit      |
| AC-09.5 | The JWT is signed with a secret from environment variables (`JWT_SECRET`).                                                                                      | Unit      |

---

#### FR-10: JWT Middleware (Route Protection)

| Attribute       | Detail                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**          | FR-10                                                                                                                                            |
| **Priority**    | MUST                                                                                                                                             |
| **SPEC Goal**   | G-03                                                                                                                                             |
| **Actor**       | System                                                                                                                                           |
| **Description** | All `GET /api/tickets` and `PATCH /api/tickets/:id` routes are protected by JWT middleware. `POST /api/tickets` (customer submission) is public. |

**Acceptance Criteria:**

| #       | Criterion                                                                                                           | Test Type   |
| ------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-10.1 | Requests without an `Authorization` header return `401 Unauthorized`.                                               | Integration |
| AC-10.2 | Requests with a malformed token (not a valid JWT) return `401 Unauthorized`.                                        | Integration |
| AC-10.3 | Requests with an expired token return `401 Unauthorized` with message "Token expired".                              | Unit        |
| AC-10.4 | Requests with a valid token attach the decoded `{ agentId, email, role }` to the request object for downstream use. | Unit        |
| AC-10.5 | `POST /api/tickets` does **not** require authentication.                                                            | Integration |

---

### 2.6 Audit Trail

#### FR-11: Ticket History Logging

| Attribute       | Detail                                                                                 |
| --------------- | -------------------------------------------------------------------------------------- |
| **ID**          | FR-11                                                                                  |
| **Priority**    | SHOULD                                                                                 |
| **SPEC Goal**   | G-04                                                                                   |
| **Actor**       | System                                                                                 |
| **Description** | Every significant ticket mutation generates a `TicketHistory` record for auditability. |

**Events That Generate History Records:**

| Action             | Trigger                               | `performedBy`       |
| ------------------ | ------------------------------------- | ------------------- |
| `created`          | `POST /api/tickets` succeeds          | `system`            |
| `triage_completed` | AI successfully classifies the ticket | `system`            |
| `triage_failed`    | AI max retries exhausted              | `system`            |
| `status_change`    | `PATCH /api/tickets/:id`              | Agent ID (from JWT) |

**Acceptance Criteria:**

| #       | Criterion                                                                                                                                          | Test Type         |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| AC-11.1 | Every `CreateTicketUseCase` execution produces a history record with action `created`.                                                             | Unit              |
| AC-11.2 | Every successful `TriageTicketUseCase` execution produces a history record with action `triage_completed`.                                         | Unit              |
| AC-11.3 | Every `UpdateTicketStatusUseCase` execution produces a history record with action `status_change`, `previousValue`, `newValue`, and `performedBy`. | Unit              |
| AC-11.4 | History records are never updated or deleted — append-only.                                                                                        | Design constraint |
| AC-11.5 | The `timestamp` is server-generated (not client-supplied).                                                                                         | Unit              |

---

### 2.7 Health Check

#### FR-12: Health Check Endpoint

| Attribute       | Detail                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| **ID**          | FR-12                                                                                                      |
| **Priority**    | SHOULD                                                                                                     |
| **SPEC Goal**   | G-07                                                                                                       |
| **Actor**       | System / DevOps                                                                                            |
| **Endpoint**    | `GET /api/health`                                                                                          |
| **Description** | Returns the health status of the API and its dependencies. Useful for Docker health checks and monitoring. |

**Response Body (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2026-03-03T12:00:00Z",
  "services": {
    "database": "connected",
    "ai": "available"
  }
}
```

**Acceptance Criteria:**

| #       | Criterion                                                               | Test Type   |
| ------- | ----------------------------------------------------------------------- | ----------- |
| AC-12.1 | Returns `200 OK` when the database connection is active.                | Integration |
| AC-12.2 | Returns `503 Service Unavailable` when the database connection is down. | Integration |
| AC-12.3 | The endpoint does not require authentication.                           | Integration |

---

## 3. Functional Requirements — Frontend

### 3.1 Customer Submission Page

#### FR-13: Public Ticket Submission Form

| Attribute       | Detail                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **ID**          | FR-13                                                                                                                            |
| **Priority**    | MUST                                                                                                                             |
| **SPEC Goal**   | G-09, G-11                                                                                                                       |
| **Actor**       | Customer (unauthenticated)                                                                                                       |
| **Route**       | `/` (root page)                                                                                                                  |
| **Description** | A simple, public-facing form where a customer can submit a new support ticket. Built with Shadcn/ui components and Tailwind CSS. |

**Form Fields:**

| Field            | Component          | Validation                   |
| ---------------- | ------------------ | ---------------------------- |
| `title`          | Input              | Required, 5-200 characters   |
| `description`    | Textarea           | Required, 10-5000 characters |
| `customer_email` | Input (type=email) | Required, valid email format |

**Acceptance Criteria:**

| #       | Criterion                                                                         | Test Type   |
| ------- | --------------------------------------------------------------------------------- | ----------- |
| AC-13.1 | The page is publicly accessible without authentication.                           | Manual      |
| AC-13.2 | Client-side validation shows inline errors for invalid fields before submission.  | Manual      |
| AC-13.3 | On successful submission, a success message is displayed with the ticket ID.      | Manual      |
| AC-13.4 | On API error (e.g., network failure), a user-friendly error message is displayed. | Manual      |
| AC-13.5 | The form resets after successful submission.                                      | Manual      |
| AC-13.6 | The form uses Shadcn/ui `Input`, `Textarea`, `Button`, and `Card` components.     | Code review |
| AC-13.7 | The page is responsive and works on mobile viewports.                             | Manual      |

---

### 3.2 Agent Authentication

#### FR-14: Agent Login Page

| Attribute       | Detail                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------- |
| **ID**          | FR-14                                                                                       |
| **Priority**    | MUST                                                                                        |
| **SPEC Goal**   | G-10                                                                                        |
| **Actor**       | Support Agent                                                                               |
| **Route**       | `/login`                                                                                    |
| **Description** | A login form for support agents. On success, stores the JWT and redirects to the dashboard. |

**Form Fields:**

| Field      | Component             | Validation                |
| ---------- | --------------------- | ------------------------- |
| `email`    | Input (type=email)    | Required, valid email     |
| `password` | Input (type=password) | Required, min 1 character |

**Acceptance Criteria:**

| #       | Criterion                                                                                                                  | Test Type   |
| ------- | -------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-14.1 | On valid credentials, the JWT is stored in client state (context/localStorage) and the user is redirected to `/dashboard`. | Manual      |
| AC-14.2 | On invalid credentials, a generic error message ("Invalid credentials") is shown.                                          | Manual      |
| AC-14.3 | The login page is publicly accessible.                                                                                     | Manual      |
| AC-14.4 | If an already-authenticated agent visits `/login`, they are redirected to `/dashboard`.                                    | Manual      |
| AC-14.5 | The form uses Shadcn/ui `Input`, `Button`, and `Card` components.                                                          | Code review |

---

#### FR-15: Auth Guard (Protected Routes)

| Attribute       | Detail                                                                                 |
| --------------- | -------------------------------------------------------------------------------------- |
| **ID**          | FR-15                                                                                  |
| **Priority**    | MUST                                                                                   |
| **SPEC Goal**   | G-10                                                                                   |
| **Actor**       | System                                                                                 |
| **Description** | The `/dashboard` route is protected. Unauthenticated users are redirected to `/login`. |

**Acceptance Criteria:**

| #       | Criterion                                                                                                                                   | Test Type |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AC-15.1 | Navigating to `/dashboard` without a JWT redirects to `/login`.                                                                             | Manual    |
| AC-15.2 | After login, the JWT is included as a `Bearer` token in all API requests to protected endpoints.                                            | Manual    |
| AC-15.3 | If the JWT expires during a session, the next API call returns 401 and the user is redirected to `/login` with a "Session expired" message. | Manual    |
| AC-15.4 | A "Logout" button clears the JWT and redirects to `/login`.                                                                                 | Manual    |

---

### 3.3 Agent Dashboard

#### FR-16: Ticket Dashboard (Data Table)

| Attribute       | Detail                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| **ID**          | FR-16                                                                                                     |
| **Priority**    | MUST                                                                                                      |
| **SPEC Goal**   | G-10, G-11                                                                                                |
| **Actor**       | Support Agent (authenticated)                                                                             |
| **Route**       | `/dashboard`                                                                                              |
| **Description** | A protected page displaying all tickets in a data table with filtering, sorting, and pagination controls. |

**Table Columns:**

| Column   | Source Field     | Features                                               |
| -------- | ---------------- | ------------------------------------------------------ |
| Title    | `title`          | Truncated to 50 chars, full on hover                   |
| Status   | `status`         | Color-coded badge (Shadcn `Badge`)                     |
| Category | `category`       | Badge or text                                          |
| Priority | `priority`       | Color-coded badge (High=red, Medium=yellow, Low=green) |
| Customer | `customer_email` | Truncated                                              |
| Created  | `createdAt`      | Relative time ("2 hours ago")                          |
| Actions  | —                | Status change dropdown                                 |

**Filter Controls:**

| Filter   | Component       | Options                                                         |
| -------- | --------------- | --------------------------------------------------------------- |
| Status   | Select dropdown | All, Open, In Progress, Resolved, pending_triage, triage_failed |
| Priority | Select dropdown | All, High, Medium, Low                                          |
| Category | Select dropdown | All, Billing, Technical Bug, Feature Request                    |

**Acceptance Criteria:**

| #       | Criterion                                                                                                                       | Test Type   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-16.1 | The dashboard displays tickets in a paginated data table.                                                                       | Manual      |
| AC-16.2 | Filter dropdowns for status, priority, and category send query params to `GET /api/tickets`.                                    | Manual      |
| AC-16.3 | Pagination controls (Previous/Next, page numbers) work correctly.                                                               | Manual      |
| AC-16.4 | Status badges are color-coded: `Open`=blue, `In Progress`=yellow, `Resolved`=green, `pending_triage`=gray, `triage_failed`=red. | Manual      |
| AC-16.5 | Priority badges are color-coded: `High`=red, `Medium`=yellow, `Low`=green.                                                      | Manual      |
| AC-16.6 | The table uses Shadcn/ui `Table`, `Badge`, `Select`, and `Button` components.                                                   | Code review |
| AC-16.7 | The table shows a loading skeleton while data is being fetched.                                                                 | Manual      |
| AC-16.8 | An empty state message is shown when no tickets match the current filters.                                                      | Manual      |

---

#### FR-17: Inline Status Update (Optimistic UI)

| Attribute       | Detail                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**          | FR-17                                                                                                                                    |
| **Priority**    | MUST                                                                                                                                     |
| **SPEC Goal**   | G-12                                                                                                                                     |
| **Actor**       | Support Agent (authenticated)                                                                                                            |
| **Description** | Support agents can change a ticket's status directly from the dashboard table without a full page reload. The UI updates optimistically. |

**Acceptance Criteria:**

| #       | Criterion                                                                                    | Test Type |
| ------- | -------------------------------------------------------------------------------------------- | --------- |
| AC-17.1 | Each ticket row has a status dropdown or button group showing valid next statuses.           | Manual    |
| AC-17.2 | On status change, the UI immediately updates the badge color and text (optimistic).          | Manual    |
| AC-17.3 | The `PATCH /api/tickets/:id` request is sent in the background.                              | Manual    |
| AC-17.4 | On API success, the optimistic update is confirmed (no visual change).                       | Manual    |
| AC-17.5 | On API failure, the status reverts to the previous value and a toast error is shown.         | Manual    |
| AC-17.6 | Invalid transitions (e.g., Resolved → In Progress) are not shown as options in the dropdown. | Manual    |

---

## 4. Non-Functional Requirements

### NFR-01: Security

| ID       | Requirement                                                                               | Priority | Verification                              |
| -------- | ----------------------------------------------------------------------------------------- | -------- | ----------------------------------------- |
| NFR-01.1 | Passwords are hashed with bcrypt (cost factor ≥ 10) before storage.                       | MUST     | Unit test: verify hash !== plaintext      |
| NFR-01.2 | JWTs are signed with HS256 using a secret loaded from `JWT_SECRET` env var.               | MUST     | Unit test: verify token decodes correctly |
| NFR-01.3 | JWT expiration is set to 24 hours.                                                        | MUST     | Unit test: verify `exp` claim             |
| NFR-01.4 | Sensitive fields (`passwordHash`) are **never** included in API responses.                | MUST     | Unit test: verify response shape          |
| NFR-01.5 | Input validation (Zod) rejects payloads exceeding defined limits to prevent abuse.        | MUST     | Unit test: verify 400 on oversized input  |
| NFR-01.6 | CORS is configured to allow the frontend origin (configurable via `CORS_ORIGIN` env var). | SHOULD   | Manual verification                       |
| NFR-01.7 | MongoDB connection string is loaded from `MONGODB_URI` env var — never hardcoded.         | MUST     | Code review                               |
| NFR-01.8 | The `Gemini API key` is loaded from `GEMINI_API_KEY` env var — never hardcoded or logged. | MUST     | Code review                               |

---

### NFR-02: Performance

| ID       | Requirement                                                                                                                                | Priority | Verification       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------ |
| NFR-02.1 | `GET /api/tickets` responds in < 200ms (p95) for datasets up to 10,000 tickets.                                                            | SHOULD   | Load test (future) |
| NFR-02.2 | MongoDB indexes exist on: `status`, `priority`, `category`, `createdAt`, `customer_email`.                                                 | MUST     | Schema review      |
| NFR-02.3 | `GET /api/tickets` pagination uses `.skip()` and `.limit()` (or cursor-based for future scale).                                            | MUST     | Code review        |
| NFR-02.4 | The AI triage call does not block the HTTP response — the ticket is created first, triage is attempted, and failure is handled gracefully. | MUST     | Unit test          |

---

### NFR-03: Reliability

| ID       | Requirement                                                                                                   | Priority | Verification  |
| -------- | ------------------------------------------------------------------------------------------------------------- | -------- | ------------- |
| NFR-03.1 | The retry handler uses exponential backoff: 1s, 2s, 4s delays between attempts.                               | SHOULD   | Unit test     |
| NFR-03.2 | Maximum retry attempts = 3 (configurable via `MAX_TRIAGE_RETRIES` env var).                                   | SHOULD   | Unit test     |
| NFR-03.3 | Mongoose connection has auto-reconnect enabled with a 5-second retry interval.                                | SHOULD   | Config review |
| NFR-03.4 | The application gracefully shuts down on `SIGTERM` / `SIGINT` (close DB connection, stop accepting requests). | SHOULD   | Manual test   |

---

### NFR-04: Testability

| ID       | Requirement                                                                             | Priority | Verification                   |
| -------- | --------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| NFR-04.1 | Core business logic (`entities/`, `useCases/`) achieves ≥ 80% line coverage.            | MUST     | `jest --coverage`              |
| NFR-04.2 | Validators (`validators/`) achieve ≥ 90% branch coverage.                               | MUST     | `jest --coverage`              |
| NFR-04.3 | All use cases are testable with in-memory fakes (no database or network in unit tests). | MUST     | Architecture review            |
| NFR-04.4 | Test suite runs in < 30 seconds on CI.                                                  | SHOULD   | CI pipeline metric             |
| NFR-04.5 | No test depends on execution order (tests are independent and idempotent).              | MUST     | `jest --runInBand --randomize` |

---

### NFR-05: Observability

| ID       | Requirement                                                                               | Priority | Verification     |
| -------- | ----------------------------------------------------------------------------------------- | -------- | ---------------- |
| NFR-05.1 | All errors are logged with a structured format: `{ timestamp, level, message, context }`. | SHOULD   | Code review      |
| NFR-05.2 | AI triage attempts (success/failure) are logged with ticket ID and attempt number.        | SHOULD   | Code review      |
| NFR-05.3 | Health check endpoint (`GET /api/health`) reports database and AI service status.         | SHOULD   | Integration test |

---

### NFR-06: Deployability

| ID       | Requirement                                                                                                                           | Priority | Verification   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------- |
| NFR-06.1 | `docker-compose up` starts the backend API server, Next.js frontend, and MongoDB with zero manual configuration beyond a `.env` file. | MUST     | Manual test    |
| NFR-06.2 | The application reads all configuration from environment variables (12-factor app).                                                   | MUST     | Code review    |
| NFR-06.3 | A `.env.example` file documents all required and optional environment variables for both backend and frontend.                        | MUST     | File existence |

---

## 5. Environment Variables

### 5.1 Backend Environment Variables

| Variable             | Required | Default                 | Description                                               |
| -------------------- | -------- | ----------------------- | --------------------------------------------------------- |
| `PORT`               | No       | `3000`                  | HTTP server port                                          |
| `NODE_ENV`           | No       | `development`           | Runtime environment (`development`, `production`, `test`) |
| `MONGODB_URI`        | Yes      | —                       | MongoDB connection string                                 |
| `JWT_SECRET`         | Yes      | —                       | Secret key for signing JWTs                               |
| `JWT_EXPIRES_IN`     | No       | `24h`                   | JWT token expiration duration                             |
| `GEMINI_API_KEY`     | Yes      | —                       | Google Gemini API key                                     |
| `GEMINI_MODEL`       | No       | `gemini-2.0-flash`      | Gemini model identifier                                   |
| `MAX_TRIAGE_RETRIES` | No       | `3`                     | Max AI triage retry attempts                              |
| `CORS_ORIGIN`        | No       | `http://localhost:3001` | Allowed CORS origin for frontend                          |
| `BCRYPT_SALT_ROUNDS` | No       | `10`                    | bcrypt hashing cost factor                                |
| `LOG_LEVEL`          | No       | `info`                  | Logging level (`debug`, `info`, `warn`, `error`)          |

### 5.2 Frontend Environment Variables

| Variable              | Required | Default                     | Description          |
| --------------------- | -------- | --------------------------- | -------------------- |
| `NEXT_PUBLIC_API_URL` | No       | `http://localhost:3000/api` | Backend API base URL |

---

## 6. API Endpoint Summary

| Method  | Path                 | Auth     | Description                          | Req. ID |
| ------- | -------------------- | -------- | ------------------------------------ | ------- |
| `POST`  | `/api/tickets`       | Public   | Create a new ticket                  | FR-01   |
| `GET`   | `/api/tickets`       | JWT      | List tickets (paginated, filterable) | FR-05   |
| `GET`   | `/api/tickets/:id`   | JWT      | Get a single ticket by ID            | FR-06   |
| `PATCH` | `/api/tickets/:id`   | JWT      | Update ticket status                 | FR-07   |
| `POST`  | `/api/auth/register` | Public\* | Register a new agent                 | FR-08   |
| `POST`  | `/api/auth/login`    | Public   | Authenticate and receive JWT         | FR-09   |
| `GET`   | `/api/health`        | Public   | Health check                         | FR-12   |

_\* In production, FR-08 would be restricted to admin users (RBAC)._

## 7. Frontend Route Summary

| Route        | Auth            | Description                            | Req. ID      |
| ------------ | --------------- | -------------------------------------- | ------------ |
| `/`          | Public          | Customer ticket submission form        | FR-13        |
| `/login`     | Public          | Agent login form                       | FR-14        |
| `/dashboard` | Protected (JWT) | Agent ticket dashboard with data table | FR-16, FR-17 |

---

## 8. Error Response Contract

All error responses follow a consistent schema:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [
      {
        "field": "customer_email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Standard Error Codes

| HTTP Status | Error Code                  | When Used                                       |
| ----------- | --------------------------- | ----------------------------------------------- |
| `400`       | `VALIDATION_ERROR`          | Invalid request body or query params            |
| `400`       | `INVALID_ID`                | Malformed ObjectId in URL params                |
| `401`       | `UNAUTHORIZED`              | Missing or invalid JWT                          |
| `401`       | `TOKEN_EXPIRED`             | JWT has expired                                 |
| `404`       | `NOT_FOUND`                 | Resource does not exist                         |
| `409`       | `CONFLICT`                  | Duplicate resource (e.g., email already exists) |
| `422`       | `INVALID_STATUS_TRANSITION` | Status change violates the state machine        |
| `500`       | `INTERNAL_ERROR`            | Unexpected server error                         |

---

## 9. Data Validation Rules (Zod Schemas)

### 7.1 Create Ticket Schema

```
{
  title:          string, min(5), max(200), trim
  description:    string, min(10), max(5000), trim
  customer_email: string, email(), trim, toLowerCase
}
```

### 7.2 Update Ticket Status Schema

```
{
  status: enum("Open", "In Progress", "Resolved")
}
```

### 7.3 Register Agent Schema

```
{
  email:    string, email(), trim, toLowerCase
  password: string, min(8), max(128)
  name:     string, min(2), max(100), trim
}
```

### 7.4 Login Schema

```
{
  email:    string, email(), trim, toLowerCase
  password: string, min(1)
}
```

### 7.5 Ticket Query Params Schema

```
{
  page:      number, int, min(1), default(1), optional
  limit:     number, int, min(1), max(100), default(10), optional
  status:    enum("Open", "In Progress", "Resolved", "pending_triage", "triage_failed"), optional
  priority:  enum("High", "Medium", "Low"), optional
  category:  enum("Billing", "Technical Bug", "Feature Request"), optional
  sortBy:    enum("createdAt", "updatedAt", "priority"), default("createdAt"), optional
  sortOrder: enum("asc", "desc"), default("desc"), optional
}
```

---

## 10. Traceability Matrix

Every acceptance criterion maps back to a SPEC goal, ensuring complete coverage:

| SPEC Goal                    | Requirements Fulfilled                   | Key Acceptance Criteria                  |
| ---------------------------- | ---------------------------------------- | ---------------------------------------- |
| G-01 (AI triage)             | FR-01, FR-03                             | AC-01.1–01.4, AC-03.1–03.5               |
| G-02 (Graceful degradation)  | FR-02, FR-04                             | AC-02.1–02.4, AC-04.1–04.6               |
| G-03 (JWT auth)              | FR-05, FR-06, FR-07, FR-08, FR-09, FR-10 | AC-05.1, AC-06.4, AC-07.6, AC-10.1–10.5  |
| G-04 (Audit trail)           | FR-07, FR-11                             | AC-07.2, AC-11.1–11.5                    |
| G-05 (80% coverage)          | NFR-04.1, NFR-04.2                       | Jest coverage report                     |
| G-06 (Performance)           | NFR-02.1, NFR-02.2                       | Index verification, load test            |
| G-07 (Docker setup)          | FR-12, NFR-06.1                          | `docker-compose up` test                 |
| G-08 (Retry/circuit breaker) | FR-04                                    | AC-04.1–04.6                             |
| G-09 (Submission form)       | FR-13                                    | AC-13.1–13.7                             |
| G-10 (Agent dashboard)       | FR-14, FR-15, FR-16                      | AC-14.1–14.5, AC-15.1–15.4, AC-16.1–16.8 |
| G-11 (Design system)         | FR-13, FR-14, FR-16                      | AC-13.6, AC-14.5, AC-16.6                |
| G-12 (Optimistic UI)         | FR-17                                    | AC-17.1–17.6                             |

---

## 9. Assumptions & Decisions

| #    | Decision                                                                                                          | Rationale                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| D-01 | AI triage is attempted synchronously during `POST /api/tickets` but failures are non-blocking.                    | Simplifies the architecture for MVP. The customer always gets a 201, regardless of AI status. |
| D-02 | Retry of `pending_triage` tickets is handled by a background retry mechanism (not by the customer re-submitting). | Prevents duplicate tickets and provides automatic recovery.                                   |
| D-03 | `POST /api/auth/register` is public in MVP for ease of seeding/testing.                                           | Will be admin-protected in production via RBAC.                                               |
| D-04 | Agents can only update `status` via PATCH (not `category` or `priority`).                                         | Category and priority are AI-assigned. Manual override is a future RBAC feature.              |
| D-05 | The `TicketHistory` collection is append-only (no updates or deletes).                                            | Ensures audit integrity.                                                                      |
| D-06 | Query param filters are combined with logical AND.                                                                | Most intuitive for dashboard filtering. OR logic can be added later.                          |

---

> **Next Phase:** [DESIGN.md](./DESIGN.md) — Folder structure (Clean Architecture layers + Next.js App Router), MongoDB Schemas (Mongoose), API Contract, and Frontend Component Design.
