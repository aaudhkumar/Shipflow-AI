# Technical Deep-Dive (DOCS)

This document is intended for technical evaluators who want to understand the intricate details of Shipflow's backend architecture, security models, and tRPC routing.

## 1. Deployed Infrastructure

Shipflow operates on a highly decoupled architecture to ensure that long-running AI tasks do not block standard web traffic.

| Component | Stack | Live URL | Purpose |
|-----------|-------|----------|---------|
| **Frontend** | Next.js 14, Tailwind, tRPC | `https://shipflow-ai-web-eight.vercel.app` | Presentation layer. |
| **Core API** | Express.js, tRPC | `https://shipflow-ai-1.onrender.com` | Handles all 75+ standard CRUD/Business logic routes. |
| **Code Worker**| Express, Docker Sandbox | `https://shipflow-ai.onrender.com` | A dedicated microservice that exclusively handles LLM git operations. |
| **Database** | Postgres (Neon/Supabase) | *Private* | Managed exclusively via Drizzle ORM. |
| **Workflows**| Inngest | *Managed* | Handles async event queues (e.g., repository syncing). |

## 2. API Architecture (tRPC to OpenAPI)

The core API is built using **tRPC**, ensuring 100% type safety from the Database (`packages/db`) to the Frontend. However, because Shipflow also serves as an integration platform, these tRPC routes are dynamically compiled into a standard OpenAPI REST specification.

- **Interactive Swagger/Scalar Docs**: `https://shipflow-ai-1.onrender.com/api/docs`

### Major Routers (75 Total Procedures)
The backend is split into 15 distinct routers, including:
- **`organizationRouter` (14 routes):** Handles multi-tenancy, member invitations via JWT tokens, and RBAC (Owner, Admin, Engineer, Viewer).
- **`featureRouter` (19 routes):** The heaviest logic center. Handles PRD generation, AI clarification Q&A, and task extraction. Protected heavily by billing middlewares.
- **`pullRequestRouter` (6 routes):** Ingests webhooks, links PRs to specific Tasks, and handles AI review feedback.
- **`billingRouter` (4 routes):** Creates Razorpay orders, handles checkout sessions, and cryptographically verifies `x-razorpay-signature` on webhooks.
- **`auditRouter`:** Maintains an immutable log of sensitive actions (e.g., Repos connected, Members removed).

## 3. The Autonomous Code-Worker (Deep Dive)

The most complex engineering achievement in Shipflow is the `@shipflow/code-worker` service (`https://shipflow-ai.onrender.com`). Standard HTTP servers timeout after 30-60 seconds, which is insufficient for AI code generation. Therefore, this is extracted into a standalone service.

### Execution Flow
1. **Trigger:** The Core API sends a `POST /implement` request containing a `taskId`.
2. **Context Gathering:** The worker queries the database to pull a massive context chain: `Task -> Epic -> PRD -> Feature -> Project -> GitHub Installation`.
3. **Sandboxing:** The worker provisions a network-isolated environment (`docker run --network none alpine`).
4. **Git Operations:** It clones the target repository using short-lived GitHub App tokens (`simple-git`).
5. **Agentic Loop:** The Vercel AI SDK is invoked with OpenAI. The LLM is given tools to explore the codebase.
   - `read_file`
   - `list_dir`
   - `write_file`
   - `run_command` (Strictly limited to `test`, `lint`, `build`)

### Hard Security Constraints (HC#)
The worker enforces strict security parameters to prevent RCE (Remote Code Execution) and secrets leakage:
- **HC#1 (No Arbitrary Shell):** The `run_command` tool uses `execFile` (not `exec`) and validates against a strict TypeScript union (`"test" | "lint" | "build"`).
- **HC#2 (Path Traversal):** All file reads/writes are run through `path.resolve` and `fs.realpath` to prevent `../../` escapes outside the cloned repo directory.
- **HC#4 (Secret Scanning):** Every file written by the AI is scanned for patterns (e.g., `ghp_...`, `sk-...`) and high Shannon entropy. If a secret is detected, the execution halts.
- **HC#5 (Prompt Injection Defense):** The PRD and Task descriptions are framed as untrusted user input within the system prompt to prevent users from hijacking the AI worker.

## 4. Webhooks and Eventing

Shipflow is highly event-driven.
- **GitHub Webhooks:** Handled by the `pullRequestRouter`. When a PR is opened, the webhook parses the body for strings like `Closes TASK-123` and updates the DB state. Signatures are verified using `GITHUB_WEBHOOK_SECRET`.
- **Inngest Background Jobs:** When a user connects a GitHub repository, fetching all historical PRs and issues could take minutes. Shipflow triggers an `inngest.send("repo.sync.requested")` event, returning instantly to the user while the sync happens reliably in the background.
