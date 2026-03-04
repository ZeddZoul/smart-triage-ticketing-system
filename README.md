## Smart Triage 🎫

This is an AI-augmented support ticketing system built to solve the problem where customer support teams waste hours manually categorizing and prioritizing incoming support tickets. It uses Gemini 3.0 Flash to automatically categorize and prioritize incoming customer requests, saving support agents from manual labour of triage.

# Tech Stack

Backend: Node 20 / Express

Frontend: Next.js 16 (App Router) + Shadcn UI.

AI: Gemini 3.0 Flash (for better, inference and classification).

Database: MongoDB.

# Getting Started (The 2-Minute Version)

The easiest way to see this in action is via Docker.

Clone it: git clone https://github.com/ZeddZoul/smart-triage-ticketing-system && cd smart-triage-ticketing-system

Environment: Copy backend/.env.example to backend/.env and add your GEMINI_API_KEY.

Spin it up: ```bash
docker-compose up --build

Seed the Agent: In a new terminal, run:

Bash
docker exec smart-triage-api node src/scripts/seed.js
Access Points:

Customer Form: http://localhost:3000

Agent Dashboard: http://localhost:3000/login

User: agent@smarttriage.com

Pass: password123

(Otherwise register a new agent)

# Internal Architecture & Design Decisions

I’ve broken the backend into four layers to keep the business logic isolated from the framework (Express/Mongoose):

Use Cases (e.g., TriageTicket): This is where all business rules live here.

Interfaces: are custom adapters that convert web requests into the format that the Use Cases understand.

Infrastructure: is where the external connections live (DB connection, Gemini SDK).

# How it works

When a ticket hits POST /api/tickets, we don't wait for the AI to respond before saving. The ticket is saved immediately. We then trigger the triage. If Gemini is slow or down, the ticket is flagged as pending_triage so the system doesn't hang.

# Verification & "What-Ifs"

## How I handle AI Downtime

I designed this to be "Failure-First." If the Gemini API hits a rate limit or goes offline:

- The system catches the error in CreateTicketUseCase.

- The ticket is marked triage_failed.

- Agents see a "Manual Triage Required" badge on their dashboard.

- There's a "Re-triage" button for agents to manually kick off a retry once the API is back up.

## Future-Proofing: RBAC

If we need to add Admins vs Read-Only users, I've already included a role field in the Agent entity. We just need to drop an authorize(['admin']) middleware onto specific routes.

Because of the setup I used, this wouldn't need us touching any business logic, just the route definitions.

## Development & Testing

I aimed for 80% coverage on the core logic. To run the suite:

Bash
cd backend
pnpm test

## For the full report:

pnpm run test:coverage

# Project Documentation

## V-Model Planning Documents (`docs/`)

Before any code was written, I used the V-Model planning method which uses four documents where each phase validates against the previous one. These served as the contract between me and the AI throughout development:

[SPEC.md](docs/SPEC.md) The specification document for the project. It contains the vision, goals, non-functional requirements, technology choices. The purpose of the project.  
[REQUIREMENTS.md](docs/REQUIREMENTS.md) This contains traceable, testable functional requirements with acceptance criteria and priority labels like MUST, SHOULD and COULD.
[DESIGN.md](docs/DESIGN.md) contains detailed technical design — Architecture layers, MongoDB schemas, API contracts, middleware pipeline, component architecture, etc.
[TASKS.md](docs/TASKS.md) 110 sequenced implementation tasks across different phases. Every task maps back to a requirement.

This upfront investment is why the AI was able to generate accurate, context-aware code — prompts referenced specific requirement IDs and design sections instead of leaving the AI to guess.

## Steering Files (`.steering/`)

These are persistent context files that keep the AI aligned across sessions:

[product.md](.steering/product.md) Product overview — target users, core features, business objectives. A quick "what are we building" reference. |
[tech.md](.steering/tech.md) Technology stack with exact versions and justifications for each dependency choice. |
[structure.md](.steering/structure.md) Full project folder structure with annotations explaining each Clean Architecture layer and file's role. |

# AI Collaboration Log

The full development process is documented in [AI_JOURNEY.md](AI_JOURNEY.md) — including 9 complex prompts, 4 errors caught and corrected, and one bad practice the AI suggested that I caught during manual testing and replaced with a dedicated backend facets endpoint.
