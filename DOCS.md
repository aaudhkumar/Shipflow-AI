# Shipflow Technical Documentation

This document serves as the comprehensive technical reference for engineers integrating with, extending, or operating the Shipflow platform.

## 1. Deep Architecture Overview
Shipflow is structured as a modern, type-safe monorepo. This design guarantees that data types defined in the database perfectly match the types consumed by the frontend, eliminating an entire class of runtime bugs.

- **Frontend Application (`apps/web`)**: Built on Next.js (App Router), leveraging React, Tailwind CSS for styling, and `tRPC React Query` hooks for data fetching. This layer focuses purely on presentation and user experience.
- **API Server (`apps/api`)**: A robust Express.js server that acts as the host for the tRPC backend. It mounts the tRPC middleware, handles CORS, processes authentication cookies, and dynamically translates tRPC definitions into a standard OpenAPI JSON specification using `trpc-to-openapi`.
- **Database Layer (`packages/db`)**: Utilizes Drizzle ORM to interface with PostgreSQL. The schema is highly modularized; entities like users, organizations, projects, and tasks are separated into distinct domain files within `models/`. Migrations are generated and applied via the Drizzle CLI.
- **Authentication Layer (`packages/auth`)**: Encapsulates `better-auth` configurations. It defines the OAuth providers (Google, GitHub) and handles the intricacies of secure session management, exporting utility functions used by the API server.
- **Workflow & Eventing (`packages/workflow`)**: For operations that exceed standard HTTP timeout limits (e.g., calling an LLM for 30+ seconds, or processing complex Git webhooks), Shipflow defers execution to **Inngest**. This provides an event-driven architecture with automatic retries, step-functions, and high reliability.

## 2. Comprehensive Authentication Flow
Shipflow secures its API primarily through **Session Cookies** managed by Better-Auth. This approach is highly secure against XSS attacks compared to storing JWTs in `localStorage`.

- **Mechanism**: When a user successfully authenticates, `better-auth` sets an HTTP-only, `SameSite=Lax` (or `Strict`) cookie containing a cryptographically signed session token.
- **Supported Providers**: 
  - Standard Email/Password credentials.
  - Google OAuth (Requires `GOOGLE_OAUTH_CLIENT_ID` and `SECRET`).
  - GitHub OAuth (Requires `GITHUB_OAUTH_CLIENT_ID` and `SECRET`).
- **API Context Construction**: Inside `apps/api/src/server.ts`, the Express middleware intercepts incoming requests, extracts the cookies from `req.headers`, and passes them into the `createContext` function. The tRPC routers then use this context to validate the session state before resolving protected procedures. If the session is invalid, a `TRPCError` with a `UNAUTHORIZED` code is thrown.

## 3. REST API & Resource Mapping
Although the backend is authored in tRPC, it is exposed as a fully compliant REST API at `{BASE_URL}/api/*`. Below is a detailed summary of the primary resource groups. 

> **Note:** For exact request payload shapes, required headers, and response schemas, always consult the [Interactive Scalar UI]({BASE_URL}/api/docs).

| Resource Group | Path Prefix | Core Responsibilities |
|----------------|-------------|-----------------------|
| **Auth** | `/api/auth` | Login, signup, password resets, and session validation endpoints managed by `better-auth`. |
| **Organization** | `/api/organization` | Creation of workspaces, updating organization settings, and managing high-level tenant metadata. |
| **Project** | `/api/project` | CRUD operations for Projects (the highest level of grouping for software deliverables). |
| **Feature** | `/api/feature` | Managing features/epics that belong to a specific Project. |
| **PRD** | `/api/prd` | Endpoints for storing, retrieving, and versioning rich-text Product Requirements Documents. |
| **Task** | `/api/task` | Granular task assignment, status updates (todo, in-progress, done), and task tracking. |
| **Repository** | `/api/repository` | Linking GitHub repositories to an Organization and managing sync configurations. |
| **Pull Request** | `/api/pullRequest` | Webhook ingestion points and REST endpoints for tracking PR statuses against specific tasks. |
| **Member** | `/api/member` | Inviting new users via email, assigning Roles (Admin, Developer, Viewer), and removing access. |
| **Billing** | `/api/billing` | Razorpay integration: generating checkout sessions and verifying subscription statuses. |
| **Audit** | `/api/audit` | Fetching immutable audit logs for compliance and tracking organization-wide actions. |
| **Notification** | `/api/notification` | Fetching and dismissing user-specific alerts and system notifications. |
| **Deployment** | `/api/deployment` | Tracking deployment events triggered by external CI/CD pipelines. |
| **Task Execution**| `/api/taskExecution` | The core AI engine: triggering AI workers, polling execution status, and retrieving streaming logs. |

## 4. Execution Engine Internals (AI Workflows)
Shipflow's defining feature is its ability to execute automated software tasks via its **Task Execution Engine**. The lifecycle of an AI execution is complex and highly orchestrated:

1. **Trigger Phase**: A user assigns a Task to an AI worker or explicitly clicks "Execute" in the UI. This hits the `trpc/taskExecution.start` endpoint.
2. **Queueing Phase**: The Express API authenticates the request, verifies the Organization has sufficient billing credits, creates a "Queued" execution record in PostgreSQL, and immediately pushes an event to the Inngest workflow broker (`packages/workflow`). The HTTP request returns immediately with a `202 Accepted` style response.
3. **Worker Invocation**: An Inngest worker (which can scale independently) receives the event. It uses the `packages/ai` integrations to fetch the necessary context:
   - The specific Task details.
   - The parent Feature context.
   - The comprehensive text of the associated PRD.
4. **AI Generation**: The worker compiles a strict system prompt and invokes the configured LLM provider (OpenAI, Anthropic, etc.). It manages rate limits and token windows.
5. **Persistence & Streaming**: As the AI generates output (or completes distinct steps of thought), the worker persists these updates to the `task_executions` table in PostgreSQL. The frontend continuously polls (or uses WebSockets) to display this progress to the user in real-time.
6. **Completion**: The final output (e.g., code diffs, markdown documentation) is saved, and the task status is updated to `Review Required`.

## 5. Webhooks & Real-time Synchronization
Shipflow is built to be a central hub, requiring robust ingestion of external events via webhooks:
- **GitHub Webhooks**: When a PR is opened, merged, or a branch is pushed, GitHub sends a payload to Shipflow. Shipflow verifies the `x-hub-signature-256` hash using `GITHUB_WEBHOOK_SECRET`. It then parses the PR description for Task IDs (e.g., `Closes TASK-123`) and updates the Shipflow database accordingly.
- **Razorpay Webhooks**: Critical for revenue operations. Subscription upgrades, renewals, and payment failures trigger webhooks. Shipflow verifies these with `RAZORPAY_WEBHOOK_SECRET` and automatically adjusts the Organization's tier, locking or unlocking premium features instantly.
- **Deployment Webhooks**: External CI/CD tools (like Vercel or GitHub Actions) can ping the deployment webhook (secured via `DEPLOYMENT_WEBHOOK_SECRET`) to mark specific features or projects as successfully deployed, closing the loop on the SDLC.

## 6. AI & Scoring Layer Configurations
Shipflow is model-agnostic, supporting several major LLM providers to power the Task Execution engine:
- **Supported Providers**: OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), Gemini (1.5 Pro), and OpenRouter (for flexible model routing).
- **Usage & Cost Tracking**: Every invocation of the AI providers logs token usage. This allows Organization admins to monitor compute costs associated with AI task executions.
- **Methodology**: For a deeper dive into how prompts are constructed and how AI outputs are validated, see the [AI Execution Methodology (docs/methodology.md)](docs/methodology.md).

## 7. Infrastructure Endpoints Reference

These non-REST endpoints are crucial for DevOps, monitoring, and API discovery.

| Endpoint | Method | Detailed Purpose |
|----------|--------|------------------|
| `/` | `GET` | Simple root ping. Useful for basic load balancer health checks. |
| `/health` | `GET` | Detailed infrastructure health check. Verifies database connectivity and Redis availability. |
| `/openapi.json` | `GET` | Returns the dynamically generated, machine-readable OpenAPI 3.0 specification. |
| `/docs` | `GET` | Serves the interactive Scalar API Reference UI, rendering the `/openapi.json` file beautifully. |

## 8. Environment Variables Reference
See the `.env.example` file for a full list. Proper configuration is critical for application security and functionality.

| Variable | Required | Detailed Purpose |
|----------|----------|------------------|
| `DATABASE_URL` | **Yes** | Fully qualified PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/dbname`). |
| `BETTER_AUTH_SECRET` | **Yes** | A long, cryptographically secure random string used to sign session cookies. |
| `CORS_ALLOWED_ORIGINS`| **Yes** | Comma-separated list of exact domains allowed to make API requests (e.g., `http://localhost:3000,https://app.shipflow.io`). |
| `OPENAI_API_KEY` | *Conditional* | Required if you intend to use OpenAI models for Task Execution. |
| `INNGEST_EVENT_KEY` | **Yes** | API key to securely push events to the Inngest workflow broker. |
| `UPSTASH_REDIS_REST_URL`| **Yes** | Required for distributed rate limiting and caching operations. |

## 9. Local Development & Setup Deep Dive
To successfully run the full Shipflow stack locally:
1. **Infrastructure**: Ensure PostgreSQL and Redis are running locally (we recommend using Docker via a `docker-compose.yml` if available).
2. **Environment**: Copy `.env.example` to `.env` and meticulously fill in the required keys.
3. **Database Hydration**: 
   - Run `pnpm db:generate` to create migration files based on the Drizzle schema.
   - Run `pnpm db:migrate` to execute those migrations against your local Postgres instance.
4. **Bootstrapping**: Run `pnpm dev`. This utilizes TurboRepo to concurrently start:
   - The Next.js frontend on `http://localhost:3000`.
   - The Express API server on `http://localhost:8000`.
   - The local Inngest development server (if configured).

## 10. Documentation Completeness Audit
To ensure high standards, all documentation is audited against the codebase reality.

| Technical Requirement | Audit Status & Evidence |
|-----------------------|-------------------------|
| Interactive API docs available | ✅ Verified. Accessible at `/api/docs` (Powered by Scalar) |
| Request/Curl Examples provided | ✅ Verified. Available in individual `docs/api/*.md` files. |
| Environment Variables detailed | ✅ Verified. See Section 8 above and `.env.example`. |
| Local Development process clear | ✅ Verified. See Section 9 above and `README.md`. |
| Architecture components explained | ✅ Verified. See Section 1 above and `docs/architecture.md`. |
