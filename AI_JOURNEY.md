# AI Journey — Smart Triage Ticketing System

> A comprehensive record of the AI-assisted development process: research, planning, complex prompts, errors, corrections, and lessons learned.

---

## 0. Pre-Development Research & Planning

### Understanding Smart Triage Systems

Before writing any line of code or even creating my V-model documents, I conducted both manual and AI-assisted research to understand what a smart triage ticketing system is, how they work in industry, and what the established norms and standards are.

**What I researched:**

- **Triage and its concepts:** What triage is, how it is used in support systems to classify and prioritize tickets which i found out was borrowed from medical triage where severity determines treatment order.
- **Industry norms:** Standard ticket lifecycle states (Open → In Progress → Resolved → Closed).
- **Graceful degradation:** The critical requirement that AI failure must never block ticket creation. You can't reject a customer's support request because the AI provider is down or timeout due to network or something.
- **Clean Architecture applicability:** How to structure this particular AI-powered system so the AI service is a pluggable infrastructure detail, not a core dependency. I ended up applying the same principles I used in Themis.

**How AI helped during my research:**

I used AI to rapidly understand the domain, explore architectural patterns for AI-integrated systems, and identify edge cases I might otherwise miss

### Preparing the Scaffolding Prompt & V-Model Documents

With my understanding I then crafted my first prompt to give to Claude Opus 4.6 to create the project's foundational documents using the **V-Model planning method** which is a structured engineering approach to software development where each phase validates against the previous one:

1. **SPEC.md** contains the vision, goals, non-functional requirements, and technology choices
2. **REQUIREMENTS.md** has the traceable and testable functional requirements with the acceptance criteria
3. **DESIGN.md** contains the technical design covering all layers, schemas, middleware, and error handling
4. **TASKS.md** contains the exact tasks and AI prompts that I would work with. i ended up with about 110 sequenced tasks across 14 phases with a dependency graph

The time I took in this upfront planning paid off seriously. Because every requirement was traceable to a spec goal, and every task was traceable to a requirement, the actual implementation phase was very smooth. The AI could generate accurate, context-aware code because the prompts referenced specific requirement IDs and design section numbers. Although there were times where some bugs appeared due to frontend and backend mismatch, the tests easily caught them. This avoided the many issues that typically affect AI-assisted development like when the AI guesses your requirements and produces generic boilerplate. Instead, every generated module had a clear purpose, clear interfaces, and clear test criteria from the beginning.

---

## 1. Complex Prompts

### Prompt 1: The Ticket Entity — State Machine + Validation + Clean Architecture in One Shot

This was the first real prompt where I asked the AI to do something non-trivial. I needed the core `Ticket` entity to handle field validation (title length, email format, etc.), a full state machine with `VALID_TRANSITIONS` defining which statuses can move to which (Open ↔ In Progress ↔ Resolved, Closed is terminal, triage_failed can recover to Open), domain-specific error types, and the whole thing had to have zero infrastructure dependencies because that is the Clean Architecture rule — entities don't know about Express or Mongoose.

The tricky part was the state machine. I needed it to prevent invalid transitions but also allow recovery paths, like when a ticket's triage fails and an agent manually opens it. The AI had to reason about bidirectional vs unidirectional transitions and model them correctly in a single map.

It got it right first try. The generated entity had all six status states, proper error hierarchies (`ValidationError`, `InvalidStatusTransitionError`), and a clean `isTriageable()` method. All 40 unit tests passed immediately.

---

### Prompt 2: Full-Stack Retriage Feature

> "Add a retriage endpoint so that the agent can retriage tickets from the dashboard for tickets whose triaging failed."

This was the hardest prompt because it touched 7 files across 3 architectural layers and the AI had to figure out how they all connect.

On the backend it needed a new `RetriageTicketUseCase` that checks only `pending_triage` or `triage_failed` tickets can be retriaged, resets `triage_attempts` to 0 for a fresh round of retries, logs who initiated it in the audit trail, and then delegates to the existing `TriageTicketUseCase`. Then it needed a new controller method, a new route (`POST /:id/retriage`), and DI container wiring.

On the frontend it needed a new API function, a `handleRetriage` handler with different toast messages depending on the outcome (success vs "triage didn't work but didn't crash" vs actual error), and a conditional "Retriage" button in the ticket table that only shows up for retriageable statuses with a loading spinner while it is working.

The key design decision I liked was using `toast.warning()` instead of `toast.error()` when triage completes but doesn't succeed — the ticket isn't lost, it is just still pending. Small detail but it makes a difference in how the agent perceives the system.

---

### Prompt 3: Making Categories and Priorities AI-Inferred Instead of Fixed

> "Currently the categories and priorities list is limited. We want the AI to decide, but on the same lines as what we have — the AI should be able to infer."

This one looked simple on the surface but ended up touching 9 backend files, 3 frontend files, and 4 test files. The system had rigid enums everywhere — Mongoose schema had `enum` constraints, entity validation checked against a fixed set, Zod validators used `z.enum([...])`, the AI prompt said "Allowed categories: Billing, Technical Bug, Feature Request", and the frontend had hardcoded TypeScript union types.

I had to rip all of that out and replace it with a flexible system where any non-empty string is valid. The AI prompt now gives examples ("Common examples: Billing, Technical Bug — but use whatever fits best") instead of a strict list. So now Gemini might classify something as "Security Vulnerability" or "Account Access" — categories nobody pre-defined — and the system handles it cleanly.

The filter dropdowns were the interesting part. The AI's first suggestion was to derive the options client-side from the ticket data, but that broke badly (more on this in the errors section below). I ended up building a dedicated `GET /api/tickets/facets` endpoint that queries MongoDB's `distinct()` across the whole collection.

All tests passed after the change. Coverage stayed at 92%.

---

## 2. AI Errors & Corrections

### Error 1: Frontend-Backend Data Format Mismatch

This was the first thing that broke when I connected the frontend to the backend for the first time. I got `Cannot read properties of undefined (reading 'id')` on the very first ticket submission.

The problem was that the AI generated the frontend API client expecting responses wrapped in `{ data: Ticket }`
But the backend just returns the ticket directly — `res.status(201).json(ticket)`. So `response.data` was undefined.

Both patterns are valid. The AI just wasn't consistent between the two codebases because it generated them in separate phases. I fixed it by removing the `.data` unwrapping from four API functions. This bug wasn't caught by unit tests. I had to manually test the app to catch it.

---

### Error 2: Hardcoded Future Date in Test

One of the generated tests for the Ticket entity used `new Date("2099-01-01")` as a baseline to check that `updated_at` gets refreshed on status transitions. The assertion was basically `expect(now >= year2099)` which obviously always fails. The AI was trying to be clever with a "definitely in the future" date but didn't think through the comparison direction. I replaced it with `new Date(Date.now() - 1000)` — one second ago — which works as a "before" baseline.

---

### Error 3: 401 Redirect Eating Login Errors

After building the login form with proper error display, login failures showed absolutely nothing — the page just silently reloaded. I spent a moment being confused before I finally traced it to a helper.

The `apiFetch` helper had a global 401 handler that clears tokens and redirects to `/login`. This makes perfect sense for expired sessions on protected routes. But it also runs when the login endpoint itself returns 401 for a wrong password. So the browser redirects to `/login` before the catch block can call `setError()`, and you get a fresh login page with zero feedback.
The fix was to check if the current request is the login endpoint and skip the redirect. This is a common SPA bug though. The AI generated correct logic for most cases but didn't think about login as a special case.

---

### Bad Practice: Client-Side Filter Derivation from Paginated Data

This is the one where the AI suggested something that looked clever but was actually broken. When building the dashboard filter bar, it derived the dropdown options for Category and Priority directly from the current tickets array
it looked clean right. there were no hardcoded values and the dropdowns always showed real data. But there are three problems I caught during manual testing:

1. The dashboard shows 10 tickets per page. If "Account Access" only exists on page 3, it never appears in the dropdown. Users can't filter to it.

2. If you filter by `priority=High`, the ticket list now only has high-priority tickets, so the priority dropdown collapses to just "High." You can't switch to Medium without clearing the filter first. I actually discovered this by accident while testing filters.

3. This `Set` derivation runs on every single render even when nothing changed.

I fixed it by creating a `GET /api/tickets/facets` endpoint that uses MongoDB's `distinct()` to pull all categories and priorities from the entire collection. The frontend fetches this once on mount and populates the dropdowns from that stable source, completely independent of pagination or active filters.

The AI optimized for ease and simplicity of code over correctness here which was wrong for this specific use case

---

### Note on Hallucinations

The AI never hallucinated in the traditional sense — it didn't invent fake API methods, reference libraries that don't exist, or fabricate features. The errors I hit were all consistency mistakes edge case blindness, architectural shortcuts etc. I think the V-Model documents helped a lot here, giving the AI specific requirements to work against instead of letting it make things up.

---

## 3. Verification: Role-Based Access Control

When I was designing the Agent entity early on, I made sure to include a `role` field even though the current system treats all agents the same. I already defined three roles in `backend/src/entities/enums.js` — `agent`, `admin`, and `read_only` — because I saw this question when reading the assessment doc. I wanted the answer to be that we just add one middleware and not that we need to refactor the user model.

The idea is straightforward. Right now every authenticated agent can do everything — view tickets, update statuses, retriage, register new agents. To lock that down, I would write an `authorize` middleware that checks the agent's role against a whitelist before letting the request through.

Then I would just chain it on the existing `auth` middleware on each route. Read-only agents get access to `GET` routes only — they can view the dashboard and ticket details but can't change anything. Regular agents can view and update. Admins get everything, including the ability to register new agents which right now is open to anyone with a valid token.

The reason I'm confident this would be a clean change is because of how the architecture is set up. The `auth` middleware already decodes the JWT and attaches the agent object (including their role) to `req.agent`. The `authorize` middleware just needs to read that role and compare it to the allowed list. Nothing in the entities, use cases, or repositories needs to change at all. RBAC stays entirely in the middleware layer.

---

## 4. Verification: Graceful AI Failure

I designed the triage system to be failure-first. The ticket always gets saved, regardless of what Gemini does. See how it works:

1. The customer submits a ticket. `CreateTicketUseCase` saves it immediately with status `pending_triage`, then runs `TriageTicketUseCase`.

2. If Gemini is unreachable, the `RetryHandler` tries 3 times with exponential backoff (1s, 2s, 4s). Each failure increases the number of `triage_attempts`.

3. After all the retries fail, the ticket moves to `triage_failed` and a `TRIAGE_FAILED` entry is logged in the audit trail. But the customer already got their `201 Created` back in step 1 and they never see an error.

4. On the agent dashboard, failed tickets show a "Retriage" button. When Gemini comes back, agents click it and the system resets `triage_attempts` to 0 and tries again fresh. Or they can just manually set the status to Open and handle it themselves.

The main idea or principle is that ticket creation and AI triage are deliberately decoupled. A triage failure is logged and tracked but it never, ever blocks the customer from submitting their request. AI errors get wrapped in `ExternalServiceError` and never leak to the customer-facing API.
