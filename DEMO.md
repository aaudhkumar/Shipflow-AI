# Evaluator Walkthrough (DEMO)

Welcome to Shipflow! This guide provides a rapid, highly detailed 5-minute walkthrough explicitly designed for technical reviewers, hackathon judges, or prospective enterprise evaluators who want to deeply understand the core capabilities and architecture of the platform.

## 🔗 Quick Access Links
| Resource | URL | Notes |
|----------|-----|-------|
| **Live Application** | `http://localhost:3000` | The Next.js frontend (Local development environment). |
| **Interactive API Docs** | `http://localhost:8000/api/docs` | Explore and test the OpenAPI-compliant REST endpoints via Scalar. |
| **Raw OpenAPI Spec** | `http://localhost:8000/api/openapi.json` | Machine-readable specification for Postman/Insomnia imports. |

## 👁️ Reviewer Visuals: What to Look For
When navigating the application, pay close attention to these key surfaces:

| Screen / Feature | What to look for | Entry Point |
|------------------|------------------|-------------|
| **Organization Dashboard** | Observe the multi-tenant architecture. Notice how data is strictly isolated per organization using robust RBAC. | `/dashboard` |
| **PRD Editor Experience** | Test the rich-text editing capabilities. Notice how requirements seamlessly link to granular, actionable engineering tasks. | `/projects/[id]/prds` |
| **Live Task Execution**| The "Wow" factor: Assign a task to an AI worker and watch the streaming thought-logs as the LLM processes context and drafts code in real-time. | `/tasks/[id]` |
| **GitHub Synchronization**| Observe how Pull Request statuses are dynamically ingested via webhooks and visually mapped to your internal Tasks. | `/repositories` |

---

## ⏱️ The 5-Minute Guided Walkthrough

Follow these precise steps to experience the full lifecycle of Shipflow's capabilities.

### Step 1: Initialize Your Workspace
- **The Goal:** Set up your multi-tenant workspace and verify authentication.
- **The Action:** Open `http://localhost:3000`, authenticate using Google OAuth (or email), and create a new Organization and a child Project (e.g., "Alpha Release").
- **Technical Mechanism:** This UI interaction triggers the `organization.create` and `project.create` tRPC mutations. Under the hood, `better-auth` validates your secure session cookie, and Drizzle ORM safely persists the isolated tenant data to PostgreSQL.

### Step 2: Bridge Product and Engineering (PRDs to Tasks)
- **The Goal:** Define requirements and break them down into executable work.
- **The Action:** Navigate to your newly created project. Create a new Product Requirements Document (PRD) detailing a feature (e.g., "Implement Stripe Checkout"). Next, define 2-3 granular engineering tasks associated with this PRD (e.g., "Setup Express API routes for Stripe").
- **Technical Mechanism:** This hits the `prd.create` and `task.create` endpoints. Notice how the database schema establishes a strict relational hierarchy: `Organization -> Project -> Feature -> PRD -> Tasks`. This hierarchy is crucial for providing the AI with bounded, accurate context later.

### Step 3: Trigger Autonomous AI Execution (The Core Engine)
- **The Goal:** Watch the AI Engine autonomously process engineering work.
- **The Action:** Select one of your granular tasks. In the task details panel, assign the execution to an "AI Worker" (selecting OpenAI or Anthropic). Click **Execute**. Watch the UI as the execution status transitions from `Queued` -> `Running` -> `Review Required`, with live logs streaming in.
- **Technical Mechanism:** 
  1. The API receives the request and immediately pushes an event to **Inngest** (`packages/workflow`). 
  2. The HTTP request closes quickly (preventing Vercel/Express timeouts).
  3. The background Inngest worker fetches the vast PRD context, compiles a rigid system prompt, and negotiates with the LLM API. 
  4. Real-time updates are written to the `task_executions` table, which the frontend polls/streams to display the live thought-logs.

### Step 4: Verify External Webhook Integrations
- **The Goal:** Validate that Shipflow responds accurately to real-world SDLC events.
- **The Action:** (Assuming a GitHub App is configured) Push a commit or open a Pull Request in your linked GitHub repository, ensuring you mention the Shipflow Task ID in the description (e.g., `Closes TASK-123`).
- **Technical Mechanism:** The Shipflow Express server receives the payload at its webhook endpoint. It executes a cryptographic verification using `x-hub-signature-256` against your `GITHUB_WEBHOOK_SECRET`. Once verified, it parses the markdown, extracts the Task ID, and updates the task status in PostgreSQL, demonstrating robust, secure external integrations.

---

## 🗺️ Forensic Integration Map

For code reviewers and technical judges looking to verify the architecture within the source code:

| Platform Capability | Underlying Technology / API | Exact Location in Codebase |
|---------------------|-----------------------------|----------------------------|
| **Session Authentication** | `better-auth` HTTP-only cookies | `packages/auth/src/index.ts` & API Middleware |
| **Database Interactions** | Drizzle ORM Schemas & Migrations | `packages/db/models/*` |
| **AI Task Execution Engine**| Inngest Workers + Standardized LLM APIs | `packages/workflow/src/` & `packages/ai/src/` |
| **API Routing & OpenAPI** | tRPC mapped dynamically to Express | `apps/api/src/server.ts` & `packages/trpc/server/routes/*` |
| **Webhook Security** | Node crypto signature verification | `packages/trpc/server/routes/repository` (or API routes) |

---

## 🏆 Key Engineering Highlights
When evaluating Shipflow's technical merit, consider these critical design decisions:

1. **Resilient Async Execution:** By delegating AI generation (which can take 60+ seconds) to Inngest background workers, Shipflow entirely avoids standard HTTP request timeouts and ensures high reliability even if an LLM provider rate-limits a request.
2. **End-to-End Type Safety:** Utilizing a monorepo structure with tRPC means that a database schema change in `packages/db` immediately triggers a TypeScript compilation error in `apps/web` if the frontend isn't updated, drastically reducing runtime bugs.
3. **Enterprise-Grade Security:** The platform does not take shortcuts. It implements full multi-tenancy access controls (RBAC), cryptographically verified incoming webhooks, distributed rate limiting via Redis, and highly secure HTTP-only cookies for authentication.

For a complete technical deep-dive into the schema and data flow, please review the [Architecture Documentation (docs/architecture.md)](docs/architecture.md).
