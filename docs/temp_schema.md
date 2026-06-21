## SECTION 2 — SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture and Technology Stack

ShipFlow AI is architected as a highly scalable, strongly typed, and modular Next.js application, utilizing a Turborepo-powered monorepo structure. The architecture explicitly separates concerns, enforcing strict boundaries between the presentation layer, network transport, business logic, and data access.

**Core Technology Stack:**

- **Frontend / Application Framework:** Next.js (App Router), React 18, Server Components (RSC)
- **Styling / UI Components:** Tailwind CSS, Shadcn UI, Radix UI primitives
- **API / RPC Layer:** tRPC for end-to-end type safety without manual OpenAPI generation
- **Database & ORM:** PostgreSQL (Neon or AWS RDS), Drizzle ORM for type-safe SQL query generation
- **Authentication:** BetterAuth for session management, OAuth (GitHub), and RBAC (Role-Based Access Control)
- **Billing & Subscriptions:** Razorpay integration for SaaS tiering and usage-based billing
- **AI Orchestration:** Vercel AI SDK, interacting with foundational models (OpenAI/Anthropic)
- **Background Jobs & Workflows:** Inngest for robust, durable execution of event-driven workflows, retries, and scheduled tasks
- **Version Control Integration:** Octokit, custom GitHub App webhooks

### 2.2 Monorepo Structure and Package Boundaries

The monorepo is managed via `pnpm` workspaces and `turbo`. It is divided into `apps/` and `packages/`, strictly enforcing dependency rules to prevent spaghetti architecture.

**1. `apps/web` (The Next.js Application)**

- **Purpose:** The sole user-facing entry point. Handles routing, server-side rendering, and client-side interactivity.
- **Responsibilities:** Renders React components, manages UI state, consumes tRPC hooks, and handles HTTP requests/responses.
- **Allowed Dependencies:** `packages/ui`, `packages/trpc` (client hooks), `packages/shared`.
- **Forbidden Dependencies:** `packages/db`, `packages/services`, `packages/ai`. The web application must NEVER execute SQL directly or contain core business logic.

**2. `packages/db` (Data Access Layer)**

- **Purpose:** Manages the database schema, migrations, and Drizzle configuration.
- **Responsibilities:** Defines tables, relations, and schemas. Executes migrations. Provides typed database client instances.
- **Allowed Dependencies:** None (only external dependencies like `drizzle-orm`, `postgres`).
- **Forbidden Dependencies:** Must not depend on any other internal package to prevent circular dependencies.

**3. `packages/services` (The Business Logic Core)**

- **Purpose:** Contains 100% of the application's core business rules, transactional logic, and use-case orchestrations.
- **Responsibilities:** Validates complex business rules, orchestrates multi-step database transactions, interacts with external services (via abstraction), and processes domain entities.
- **Allowed Dependencies:** `packages/db`, `packages/shared`, `packages/github`, `packages/ai`, `packages/billing`, `packages/workflow`.
- **Forbidden Dependencies:** `packages/trpc`, `apps/web`. Services must be framework-agnostic and completely unaware of HTTP requests or tRPC contexts.

**4. `packages/trpc` (The Transport Layer)**

- **Purpose:** Exposes the services to the frontend via a strictly typed RPC interface.
- **Responsibilities:** Defines routers, validates incoming input using Zod schemas, extracts authentication context (user, org), and delegates execution to `packages/services`.
- **Allowed Dependencies:** `packages/services`, `packages/shared`, `packages/auth`.
- **Forbidden Dependencies:** `packages/db` (routers must not run queries directly), `packages/ui`.

**5. `packages/shared` (The Universal Lexicon)**

- **Purpose:** Contains code shared across the entire monorepo.
- **Responsibilities:** Holds Zod schemas for entity validation, generic utility functions, global constants, and TypeScript types.
- **Allowed Dependencies:** None internal.
- **Forbidden Dependencies:** Must remain pure and devoid of side effects.

**6. `packages/ai` (The Intelligence Engine)**

- **Purpose:** Encapsulates all interactions with Large Language Models.
- **Responsibilities:** Manages prompt engineering, defines system instructions, handles tool calling logic, and wraps the Vercel AI SDK. It takes raw text/context and returns structured, typed outputs.
- **Allowed Dependencies:** `packages/shared`.
- **Forbidden Dependencies:** `packages/db`. **CRITICAL RULE:** AI agents must never have direct database access. They must return structured data which `packages/services` then validates and persists. This prevents prompt-injection attacks from compromising the database.

**7. `packages/github` (The VCS Integration)**

- **Purpose:** Manages communication with the GitHub API.
- **Responsibilities:** Wrapper around Octokit, fetches PR diffs, posts review comments, parses webhook payloads, and verifies webhook signatures.
- **Allowed Dependencies:** `packages/shared`.
- **Forbidden Dependencies:** `packages/db`.

**8. `packages/workflow` (The Asynchronous Engine)**

- **Purpose:** Manages durable, long-running, or retryable background tasks using Inngest.
- **Responsibilities:** Defines Inngest functions (e.g., `process-github-webhook`, `generate-prd-async`), handles event fan-out, and ensures exactly-once execution semantics where required.
- **Allowed Dependencies:** `packages/services`, `packages/shared`.
- **Forbidden Dependencies:** `apps/web`.

**9. `packages/auth` (Identity and Access Management)**

- **Purpose:** Centralizes authentication and session handling using BetterAuth.
- **Responsibilities:** Manages login, registration, OAuth callbacks, session token validation, and RBAC helper functions.
- **Allowed Dependencies:** `packages/db`, `packages/shared`.
- **Forbidden Dependencies:** `packages/trpc`.

**10. `packages/billing` (Financial Operations)**

- **Purpose:** Integrates with Razorpay.
- **Responsibilities:** Creates checkout sessions, manages subscription states, processes webhooks (payment success/failure), and verifies plan limits.
- **Allowed Dependencies:** `packages/db`, `packages/shared`.
- **Forbidden Dependencies:** `apps/web`.

**11. `packages/ui` (Design System)**

- **Purpose:** The component library.
- **Responsibilities:** Houses Shadcn UI components, Tailwind configuration, global CSS, and generic React hooks.
- **Allowed Dependencies:** None internal.
- **Forbidden Dependencies:** Any business logic package.

### 2.3 Strict Layering Rules & Request Flow

To maintain a maintainable, extensible architecture, the following layering rules are enforced by ESLint boundaries and architectural convention:

**The Request Flow (Synchronous Read/Write):**

1. **Component:** A React component in `apps/web` receives a user interaction (e.g., "Create Project" button clicked).
2. **Hook:** The component calls a tRPC mutation hook (`api.projects.create.useMutation()`).
3. **tRPC Router:** The `projectsRouter` inside `packages/trpc` receives the request. It uses Zod to validate the payload. It extracts the `userId` and `orgId` from the context.
4. **Service:** The router immediately calls a function in `packages/services` (e.g., `ProjectService.createProject(input, ctx)`). The router contains zero business logic—it is merely a delegator.
5. **Repository / Database:** The `ProjectService` applies business rules (e.g., "Does this org have active billing?", "Is the name unique?"). It then uses `packages/db` (Drizzle) to execute an `INSERT` statement, ideally within a transaction.
6. **Return:** The DB returns the newly created record to the Service. The Service formats it and returns it to the Router. The Router returns it to the Hook, and the Component updates the UI.

**The Asynchronous Flow (Event-Driven):**

1. **Trigger:** A GitHub webhook is received at `apps/web/app/api/webhooks/github/route.ts`.
2. **Ingestion:** The route simply verifies the signature and immediately sends an event to Inngest (`inngest.send({ name: 'github/pr.opened', data: payload })`). It returns a 200 OK immediately to GitHub.
3. **Durable Execution:** The `packages/workflow` package picks up the event. It executes the `processPRWebhook` function.
4. **Service Delegation:** The workflow function delegates the complex processing to `packages/services` (e.g., `PRTrackingService.handleNewPR()`), which then interacts with the DB and orchestrates the AI Review via `packages/ai`.

### 2.4 Service Boundaries and Data Flow

Data flows strictly downwards. `apps/web` depends on `packages/trpc`. `packages/trpc` depends on `packages/services`. `packages/services` depends on `packages/db`. Upward dependencies are architecturally illegal.

**Tenant Isolation Data Flow:**
Every request to `packages/services` that reads or writes tenant-specific data MUST include the `orgId` explicitly. The services layer is responsible for appending `.where(eq(table.orgId, ctx.orgId))` to every Drizzle query. We do not rely on PostgreSQL RLS natively due to connection pooling complexities with Serverless environments, but we enforce "Application-Level RLS" strictly within the service layer boundaries.

**AI Data Flow Safety:**
When `packages/services` requests an AI operation (e.g., `AIAgentService.reviewPR`), it fetches the necessary context from `packages/db` (the PRD text, the diff from GitHub), constructs a prompt payload, and passes it to `packages/ai`. The `packages/ai` module executes the LLM call using the Vercel AI SDK and returns a Zod-parsed, structured JSON object. The Service receives this JSON, validates it against business rules, and performs the database writes. This ensures the AI is isolated and acts purely as a processing function, eliminating the risk of autonomous, unverified database mutations.

---

# Section 5 — Authentication & Authorization Architecture
