# ShipFlow AI - Architectural Blueprint (Sections 1-4)

## SECTION 1 — EXECUTIVE SUMMARY

### 1.1 Product Overview and Core Identity

ShipFlow AI is an enterprise-grade, deeply integrated Software as a Service (SaaS) platform meticulously engineered to revolutionize, accelerate, and automate the end-to-end software delivery lifecycle. Designed specifically for modern, agile, and high-velocity engineering organizations, ShipFlow AI acts as a sophisticated, autonomous co-pilot that bridges the historic, friction-laden chasm between product management (ideation) and software engineering (execution).

By seamlessly embedding into existing developer workflows and leveraging advanced Large Language Models (LLMs) alongside rigid deterministic workflow engines, ShipFlow AI transforms the chaotic, ad-hoc process of feature delivery into a streamlined, predictable, and highly visible pipeline. It ingests raw, often unstructured feature requests, systematically clarifies ambiguities through context-aware conversational AI, validates the proposed scope against strategic product objectives, and automatically generates exhaustively detailed Product Requirements Documents (PRDs).

But ShipFlow AI does not stop at product management. It crosses the boundary into engineering by autonomously decomposing PRDs into granular, actionable tasks and subtasks, mapping out complex dependencies, and integrating directly with version control systems (like GitHub) to track Pull Requests in real-time. Furthermore, it acts as a tireless, rigorous AI reviewer for all code submissions—evaluating pull requests for architectural compliance, security vulnerabilities, performance bottlenecks, and adherence to the generated PRD. It manages the iterative loop of "Fix Needed" and "Re-Review" before finally requiring human approval for the ultimate release.

### 1.2 Target Audience and User Personas

ShipFlow AI is designed for a multi-disciplinary audience within software organizations, providing tailored value to each persona:

- **Product Managers (PMs):** Empowered to submit raw ideas and rely on the AI to interrogate the idea, ask clarifying questions, and auto-generate robust PRDs. PMs gain unprecedented visibility into engineering execution without needing to constantly ping developers for status updates.
- **Software Engineers (Devs):** Relieved of the burden of translating vague product requirements into technical tasks. Engineers receive highly specific, context-rich task descriptions and benefit from immediate, constructive, and highly accurate AI code reviews that catch issues before human review, accelerating the merge process.
- **Engineering Managers (EMs) & Tech Leads:** Provided with bird's-eye visibility over project scope, team velocity, and task dependencies. They can focus on team health and high-level architecture rather than micromanaging task assignments and initial PR reviews.
- **Software Architects:** Can encode architectural rules and layering guidelines into the AI's review context, ensuring that all merged code adheres strictly to the organization's technical standards (e.g., ensuring no business logic leaks into tRPC routers).
- **Quality Assurance (QA) & DevOps:** Benefit from a clear lineage of code changes tied directly back to validated PRDs, making testing, compliance auditing, and release management a deterministic rather than probabilistic endeavor.

### 1.3 Core Value Proposition

The fundamental value proposition of ShipFlow AI rests on three pillars:

1. **Elimination of Ambiguity:** Poorly defined requirements are the root cause of immense engineering waste. ShipFlow AI forces clarity upfront. Through interactive clarification threads, the AI refuses to proceed until edge cases, acceptance criteria, and non-functional requirements are explicitly defined.
2. **Extreme Automation of Management Overhead:** Decomposing epics into tasks, assigning dependencies, tracking PRs against tasks, and nagging engineers for reviews takes up to 40% of an EM's time. ShipFlow AI automates this entirely.
3. **Continuous, Context-Aware Code Quality:** Human code reviews are notoriously inconsistent, prone to fatigue, and often miss structural drift. ShipFlow AI's code review engine operates with the full context of the PRD, the overarching system architecture, and specific organizational guidelines, ensuring a level of rigor that humans simply cannot maintain at scale.

### 1.4 Product Vision

The long-term vision for ShipFlow AI is to become the "Operating System for Software Engineering." We envision a future where the cognitive load of process management, documentation, and routine code review is entirely offloaded to an autonomous system, allowing human creativity and intellect to be singularly focused on solving complex, novel business problems. ShipFlow AI aims to reduce the time from "Idea" to "Production Release" by an order of magnitude, transforming software development from a manual artisan craft into a highly optimized, automated manufacturing pipeline.

### 1.5 End-to-End Workflow: The Lifecycle of a Feature

The ShipFlow AI platform orchestrates a rigorous, state-machine-driven workflow for every feature introduced into the system. This pipeline is immutable and ensures quality at every gate.

1. **Feature Request (Ingestion):** A user (typically a PM or stakeholder) submits a raw feature request. This can be as informal as a paragraph describing a desired capability. The system ingests this via the web UI, creating the initial `FeatureRequest` entity.
2. **Clarification Thread (AI Interaction):** The AI immediately analyzes the request. If the request lacks detail (e.g., missing error states, unclear user roles), the AI initiates a `ClarificationThread`. The AI asks targeted, highly specific multiple-choice or open-ended questions. The user responds, and this loop continues until the AI determines the feature has sufficient context.
3. **Scope Validation (Strategic Alignment):** Once clarified, the AI validates the scope. It checks the proposed feature against existing product constraints, historical PRDs, and the project's strategic goals. If the scope is dangerously large, it suggests splitting it into smaller `Epics`.
4. **PRD Generation (Documentation):** Armed with clarified requirements, the AI drafts a comprehensive `PRD` (Product Requirements Document). This includes an executive summary, user stories, acceptance criteria, out-of-scope definitions, and technical considerations. The PM can edit and version this document (`PRDVersion`).
5. **Task Generation (Decomposition):** Upon PRD approval, the AI decomposes the PRD into an `Epic`, breaking it down into specific `Tasks` and granular `Subtasks`. It intelligently identifies and maps `Dependencies` (e.g., "Database schema must be updated before Backend API is built").
6. **Development (Execution):** Engineers are assigned tasks. They branch from the main repository and begin coding. ShipFlow AI provides them with a direct link to the task context and the specific section of the PRD they are implementing.
7. **Pull Request Tracking (Integration):** When an engineer opens a Pull Request (PR) in GitHub, the ShipFlow GitHub App detects the webhook. It parses the PR title/body to link it to the specific `Task`. The PR status in ShipFlow is updated to 'Open'.
8. **AI Review (Automated Audit):** The ShipFlow AI kicks off a comprehensive review of the PR. It pulls the diff, the associated Task, and the parent PRD. It validates the code against the acceptance criteria and the strict layering rules defined for the project. It leaves inline comments and generates `ReviewFinding` records in the database.
9. **Fix Needed (Iteration):** If the AI detects issues (e.g., business logic in a component, missing tests, unhandled edge cases), it marks the PR review as 'Changes Requested'. The developer is notified, addresses the feedback, and pushes new commits.
10. **Re-Review (Verification):** Subsequent commits trigger an automatic re-review. The AI specifically verifies that its previous findings have been addressed correctly without introducing new regressions.
11. **Human Approval (The Final Gate):** Once the AI is satisfied (or if the organization mandates human oversight), a senior engineer or EM performs a final, high-level review. Because the AI has handled nits, style, and architectural compliance, the human can focus purely on business logic and complex algorithmic correctness. The human issues an `Approval`.
12. **Release (Deployment prep):** The PR is merged. ShipFlow AI tracks the merge, updates the associated Task to 'Done', and aggregates all completed tasks into a `Release` manifest.
13. **Shipped (Closure):** The release is deployed (via external CI/CD, tracked via webhooks). The PM is notified, the Feature Request is marked 'Shipped', and the loop is closed. Audit logs (`AuditLog`) ensure every step, from the first AI clarification to the final deployment, is immutably recorded for compliance.

---

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

## 5.1 Introduction to the Authentication Ecosystem

The authentication and authorization architecture of the ShipFlow AI platform is a foundational pillar that guarantees secure, isolated, and highly performant access control across all boundaries. We utilize **BetterAuth** as our core authentication primitive. BetterAuth is a modern, modular, and highly extensible authentication framework that seamlessly integrates with our Next.js and tRPC stack. By leveraging its robust plugin ecosystem, particularly the Organization (Org) Plugin, we are able to enforce a sophisticated multi-tenant architecture with granular Role-Based Access Control (RBAC).

This section provides an exhaustive deep dive into how users authenticate, how sessions are managed, how organizations are structured, and how permissions are evaluated at every layer of the system—from the React components down to the PostgreSQL database via Drizzle ORM. We will explore the roles, capabilities, restrictions, permission matrices, session strategies, cookie management, API key lifecycles, and comprehensive security considerations that govern the ShipFlow platform.

## 5.2 BetterAuth Integration and Configuration

BetterAuth is integrated into the Next.js application using its server-side and client-side adapters. The configuration is centralized in the `packages/auth` module, ensuring that both the `apps/web` and the `services` layer utilize the exact same authentication logic and type definitions.

### 5.2.1 Core Authentication Setup

At its core, BetterAuth handles user registration, login, password resets, magic links, and OAuth integrations (e.g., GitHub, Google). For ShipFlow, GitHub OAuth is the primary authentication mechanism, given our deep integration with GitHub repositories.

When a user authenticates via GitHub, the following sequence of events occurs:

1.  **OAuth Initiation**: The user clicks "Login with GitHub" on the frontend. Next.js routes the request to the BetterAuth API route.
2.  **GitHub Redirect**: BetterAuth redirects the user to GitHub with the appropriate client ID, scope (`repo`, `read:org`, `user:email`), and a secure state parameter to mitigate CSRF attacks.
3.  **Callback Processing**: Upon successful authentication on GitHub, the user is redirected back to the BetterAuth callback endpoint with an authorization code.
4.  **Token Exchange**: BetterAuth exchanges the code for a GitHub access token.
5.  **User Provisioning**: BetterAuth checks if the user exists in the `users` table via Drizzle. If not, a new user record is created using the profile information returned by GitHub.
6.  **Session Creation**: A secure, HttpOnly, SameSite=Lax cookie is generated containing the session token. The session is persisted in the `sessions` table.

### 5.2.2 The Organization (Org) Plugin

To support ShipFlow's B2B SaaS model, we heavily rely on BetterAuth's Organization Plugin. This plugin extends the core user model to support multi-tenancy. A user can belong to multiple organizations, and each organization acts as an isolated tenant containing its own projects, billing subscriptions, API keys, and repository links.

The Org Plugin introduces the following database tables:

- `organizations`: Stores tenant metadata (name, slug, logo URL, billing_customer_id).
- `members`: A junction table mapping `users` to `organizations`. This table is critical as it stores the user's role within that specific organization.
- `invitations`: Manages pending invites to an organization, containing the invitee email, the intended role, and an expiration timestamp.

## 5.3 Role-Based Access Control (RBAC)

Role-Based Access Control is enforced at the organization level. A user's permissions are scoped strictly to the organization they are currently operating within. We define four distinct roles: Owner, Admin, Member, and Reviewer.

### 5.3.1 Roles and Responsibilities

- **Owner**: The creator of the organization or an entity that has been transferred ownership. The Owner has absolute control over the organization. They can manage billing, delete the organization, transfer ownership, and perform all actions an Admin can perform. There must always be at least one Owner per organization.
- **Admin**: Administrative personnel who manage the day-to-day operations of the organization. Admins can invite new users, manage roles (up to Admin level), configure GitHub App integrations, adjust global repository settings, and view billing usage (but cannot modify the subscription plan).
- **Member**: The standard developer role. Members can create new projects, trigger AI workflows, view AI generated PRDs, interact with the planning agents, merge pull requests, and manage tasks. They cannot modify organization-level settings or invite new users.
- **Reviewer**: A restricted role designed for external stakeholders, QA personnel, or managers who only need read-only access to certain aspects of the system. Reviewers can read AI reports, view pull request summaries, and add comments to AI-generated reviews, but they cannot trigger new workflows, merge code, or modify project settings.

### 5.3.2 Capabilities and Restrictions

Capabilities are the granular permissions that make up a role. By decoupling roles from raw permissions, we allow for future flexibility (e.g., custom roles). The capabilities include, but are not limited to:

- `org:read`: View organization details.
- `org:update`: Modify organization settings.
- `org:delete`: Delete the organization.
- `billing:read`: View invoices and current usage.
- `billing:update`: Modify payment methods and subscription tiers.
- `members:read`: View the member list.
- `members:invite`: Send invitations to new users.
- `members:remove`: Remove users from the organization.
- `members:update_role`: Change a member's role.
- `project:create`: Create a new project within the org.
- `project:update`: Modify project settings.
- `project:delete`: Delete a project.
- `workflow:trigger`: Start an AI workflow.
- `workflow:read`: View workflow execution logs and results.
- `github:link`: Link a new GitHub repository to a project.
- `github:sync`: Force a manual sync of GitHub data.

### 5.3.3 Permission Matrix

The following matrix dictates the baseline RBAC configuration enforced across the platform.

| Capability            | Owner | Admin | Member | Reviewer |
| :-------------------- | :---: | :---: | :----: | :------: |
| `org:read`            |  ✅   |  ✅   |   ✅   |    ✅    |
| `org:update`          |  ✅   |  ✅   |   ❌   |    ❌    |
| `org:delete`          |  ✅   |  ❌   |   ❌   |    ❌    |
| `billing:read`        |  ✅   |  ✅   |   ❌   |    ❌    |
| `billing:update`      |  ✅   |  ❌   |   ❌   |    ❌    |
| `members:read`        |  ✅   |  ✅   |   ✅   |    ✅    |
| `members:invite`      |  ✅   |  ✅   |   ❌   |    ❌    |
| `members:remove`      |  ✅   |  ✅   |   ❌   |    ❌    |
| `members:update_role` |  ✅   |  ✅   |   ❌   |    ❌    |
| `project:create`      |  ✅   |  ✅   |   ✅   |    ❌    |
| `project:update`      |  ✅   |  ✅   |   ✅   |    ❌    |
| `project:delete`      |  ✅   |  ✅   |   ❌   |    ❌    |
| `workflow:trigger`    |  ✅   |  ✅   |   ✅   |    ❌    |
| `workflow:read`       |  ✅   |  ✅   |   ✅   |    ✅    |
| `github:link`         |  ✅   |  ✅   |   ❌   |    ❌    |
| `github:sync`         |  ✅   |  ✅   |   ✅   |    ❌    |

## 5.4 Session, Cookie, and API Key Strategies

### 5.4.1 Session and Cookie Management

ShipFlow employs a stateful session strategy backed by the database. While stateless JWTs offer some performance benefits, stateful sessions are crucial for our security posture as they allow for immediate revocation of access—a mandatory requirement for enterprise SaaS platforms.

1.  **Cookie Configuration**: Sessions are maintained via securely configured cookies.
    - `HttpOnly`: True, preventing XSS attacks from accessing the session token.
    - `Secure`: True, ensuring the cookie is only transmitted over HTTPS.
    - `SameSite`: Lax (or Strict for sensitive routes), mitigating Cross-Site Request Forgery (CSRF).
    - `Max-Age`: Set to 7 days. A sliding window mechanism extends the expiration upon active usage.
2.  **Session Validation**: On every incoming request to the Next.js App Router (via Middleware) and tRPC procedures, the session token is extracted from the cookie.
    - The middleware performs a fast, optimistic check (e.g., format validation).
    - The tRPC context builder performs a precise database lookup to validate the session and retrieve the user's current active organization context.
3.  **Active Organization Context**: A user may belong to multiple organizations. A separate cookie, `shipflow_active_org`, stores the ID of the currently selected organization. This ID is cryptographically signed to prevent tampering. When a session is validated, the system also verifies that the user holds a valid role within the `shipflow_active_org`. If the user attempts to access resources belonging to a different org, the authorization layer throws an HTTP 403 Forbidden error.

### 5.4.2 API Key Strategy

For machine-to-machine communication, CI/CD pipeline integrations, and CLI tooling, ShipFlow provides Organization-scoped API Keys.

1.  **Generation**: Owners and Admins can generate API keys from the dashboard. Each key is prefixed with `sf_live_` or `sf_test_` to easily identify the environment.
2.  **Storage**: The plain-text API key is displayed exactly once to the user upon generation. It is then hashed using argon2id before being stored in the `api_keys` table.
3.  **Authentication Flow**:
    - The client sends the API key via the `Authorization: Bearer <API_KEY>` header.
    - The API gateway extracts the prefix and looks up the corresponding key record by a derived unhashed identifier (e.g., the first 8 characters).
    - The provided key is hashed and compared against the stored hash in a constant-time operation to prevent timing attacks.
4.  **Granular Scopes**: API keys are not super-user tokens. During generation, the creator must specify the exact capabilities the key possesses (e.g., `workflow:trigger` only). This enforces the principle of least privilege.
5.  **Revocation and Expiry**: API keys can be revoked instantly. They also have an optional, configurable expiration date (e.g., 30, 60, 90 days), after which they are automatically invalidated.

## 5.5 Security Considerations and Enforcement

Security is implemented as a defense-in-depth strategy, spanning multiple layers of the application.

### 5.5.1 Layering Rules Enforcement

1.  **Component Layer**: React components utilize hooks like `useSession` and `usePermissions` to conditionally render UI elements based on the user's role. This is UX optimization, not security enforcement.
2.  **tRPC Router Layer**: This is the primary boundary for authorization. Every tRPC procedure is wrapped in an authorization middleware (`protectedProcedure`). The middleware ensures the user has a valid session and specifically checks if the user possesses the required capabilities for the invoked procedure.
    ```typescript
    // Example tRPC Middleware
    export const requireCapability = (capability: Capability) =>
      protectedProcedure.use(async ({ ctx, next }) => {
        const hasPermission = await checkPermission(ctx.user.id, ctx.activeOrgId, capability);
        if (!hasPermission) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
        }
        return next({ ctx });
      });
    ```
3.  **Service Layer**: Services receive the validated `userId` and `orgId` from the tRPC layer. Services are responsible for ensuring that any domain logic they execute is scoped to the `orgId`.
4.  **Repository Layer**: Repositories enforce tenant isolation. Every database query involving tenant data MUST include a `where` clause filtering by `organization_id`. We utilize Drizzle's advanced querying features to ensure this filter is never accidentally omitted. Row-Level Security (RLS) policies at the PostgreSQL level act as the absolute final safeguard, ensuring that even if application logic fails, data leaking across tenants is mathematically impossible at the database level.

### 5.5.2 Threat Mitigation

- **Brute Force Attacks**: BetterAuth implements rate limiting on login and password reset endpoints.
- **Session Hijacking**: Sessions are tied to user agent strings and IP addresses (with tolerance for dynamic IPs). Anomalous changes trigger a re-authentication prompt.
- **Insecure Direct Object References (IDOR)**: Using strictly typed `orgId` filtering on every single database query mitigates IDOR. An attacker cannot guess a project ID and access it if that project does not belong to their active organization.
- **Token Leakage**: API Keys are never stored in plain text. Furthermore, GitHub App private keys used for GitHub integration are securely stored in AWS Secrets Manager or equivalent encrypted vaults, injected at runtime, and never exposed to the frontend or logs.

---

# Section 6 — Billing System Architecture

## 6.1 Introduction to the Billing System

The Billing System in ShipFlow AI is designed to be highly resilient, scalable, and completely decoupled from core domain logic. Given that ShipFlow performs heavy, asynchronous AI operations, traditional seat-based billing is insufficient. Instead, we employ a hybrid billing model combining subscription tiers (seats/features) with usage-based billing (compute credits) for AI operations.

The system integrates tightly with **Razorpay** (or Stripe, depending on region, but architected agnostically) and manages the complex lifecycle of subscriptions, credit consumption, tier limits, and webhooks.

## 6.2 Subscription Tiers and Plans

ShipFlow offers three primary subscription tiers: Free, Pro, and Enterprise. Each tier imposes different limits on repository connections, project counts, concurrent AI workflows, and includes a different baseline of monthly AI credits.

### 6.2.1 Free Plan

- **Target Audience**: Indie hackers, students, and small open-source maintainers.
- **Limits**:
  - 1 Organization per user.
  - Up to 3 Projects.
  - 1 connected GitHub Repository per project.
  - Maximum 3 Members.
- **Credits**: 500 AI credits per month (non-rolling).
- **Features**: Standard AI agents, community support.

### 6.2.2 Pro Plan

- **Target Audience**: Startups and mid-sized engineering teams.
- **Limits**:
  - Unlimited Projects.
  - Unlimited connected GitHub Repositories.
  - Up to 20 Members.
- **Credits**: 5,000 AI credits per month (non-rolling). Ability to purchase credit top-ups (pay-as-you-go).
- **Features**: Advanced AI agents (Release Readiness, Deep QA), priority email support, faster SLA on AI processing.

### 6.2.3 Enterprise Plan

- **Target Audience**: Large enterprises with complex compliance and massive scale needs.
- **Limits**: Custom negotiated limits. Unlimited Members.
- **Credits**: Custom volume of credits.
- **Features**: Dedicated account manager, custom AI agent tuning, Bring Your Own Key (BYOK) for LLMs, SSO/SAML integration, on-premise deployment options.

## 6.3 Usage Tracking and Credit Consumption

The most technically complex aspect of the billing system is tracking usage accurately in a distributed, asynchronous environment without introducing unacceptable latency to the core application.

### 6.3.1 The Credit Economy

Credits are the fundamental currency of the ShipFlow AI platform. Every action performed by an AI agent consumes credits based on the computational complexity and token usage of the underlying LLM call.

- **Base Rate**: 1 credit = ~1,000 tokens (blended input/output average).
- **Agent Costs**:
  - Scope Check Agent: ~10 credits.
  - Repo Analysis Agent: Highly variable, 50 - 500 credits depending on repository size.
  - PR Review Agent: ~30 credits per file changed.

### 6.3.2 Asynchronous Consumption Pipeline

To prevent database contention, credit consumption is processed asynchronously.

1.  **AI Execution**: When an Inngest background job executes an AI agent, it tracks the exact token usage reported by the AI SDK (e.g., `usage.promptTokens`, `usage.completionTokens`).
2.  **Event Emitting**: Upon completion, the agent emits an internal event: `billing.usage.recorded`. This event payload includes the `organizationId`, the `agentName`, the raw token counts, and a unique `idempotencyKey`.
3.  **Aggregation Worker**: A dedicated Inngest worker listens for `billing.usage.recorded` events.
    - It first checks the `idempotencyKey` against a Redis cache to prevent double-counting in case of network retries.
    - It calculates the credit cost based on the current pricing matrix.
    - It performs an atomic decrement on the organization's credit balance in the PostgreSQL database using a raw SQL query to avoid race conditions: `UPDATE billing_balances SET credits_remaining = credits_remaining - $1 WHERE organization_id = $2 AND credits_remaining >= $1`.

### 6.3.3 Limit Enforcement and Edge Cases

Enforcing limits in a distributed system requires careful handling of edge cases, particularly "overdrafts" caused by concurrent asynchronous workflows.

- **Pre-flight Checks**: Before a user can trigger a workflow, the tRPC router performs a synchronous pre-flight check. It queries the `billing_balances` table. If `credits_remaining` is less than a predefined buffer (e.g., 50 credits), the request is rejected with a `PAYMENT_REQUIRED` error, prompting the user to upgrade or buy a top-up.
- **Handling Overdrafts**: Because concurrent workflows might pass the pre-flight check simultaneously, an organization can technically drop into a negative credit balance.
  - The atomic database update allows `credits_remaining` to become negative.
  - If an organization falls into the negative, all _new_ workflow requests are immediately blocked.
  - The negative balance is automatically deducted from the next month's allocation or the next purchased top-up.
- **Soft Limits and Notifications**: When an organization reaches 80% and 95% of their credit limit, an asynchronous notification service sends an email alert to the Organization Owners.

## 6.4 Upgrade Flow and Webhooks

### 6.4.1 The Upgrade Journey

1.  **Initiation**: The user clicks "Upgrade to Pro" in the billing dashboard.
2.  **Checkout Session Creation**: The backend communicates with the payment provider (Razorpay) to create a checkout session. We pass the `organization_id` as metadata in the session.
3.  **Redirection**: The user is redirected to the securely hosted Razorpay checkout page.
4.  **Completion**: Upon successful payment, the user is redirected back to the ShipFlow dashboard to a success page.

### 6.4.2 Webhook Processing

The actual provisioning of the upgraded tier and the allocation of credits happen asynchronously via webhooks to ensure resilience against network failures during the user redirect.

1.  **Webhook Reception**: The `/api/webhooks/billing` endpoint receives POST requests from Razorpay.
2.  **Signature Verification**: The endpoint strictly verifies the cryptographic signature (e.g., HMAC SHA256) of the webhook payload using the Razorpay webhook secret to ensure the payload was not spoofed.
3.  **Event Routing**: Validated events are published to Inngest (e.g., `stripe.invoice.paid`, `razorpay.subscription.charged`).
4.  **Provisioning Worker**: An Inngest function processes the event:
    - Extracts the `organization_id` from the metadata.
    - Updates the `organizations` table to reflect the new `subscription_tier`.
    - Resets or tops up the `credits_remaining` in the `billing_balances` table.
    - Records the transaction in the `billing_history` table for invoice generation and auditing.
5.  **Idempotency**: Webhook handlers are strictly idempotent. If a webhook is delivered multiple times, the system will not provision the credits twice.

---

# Section 7 — AI System Design

## 7.1 Introduction to the Agentic Architecture

The ShipFlow AI system is not a monolithic conversational chatbot. It is a highly structured, directed acyclic graph (DAG) of specialized, autonomous AI agents. Each agent is designed with a single, clear responsibility, mimicking the roles within a high-functioning human engineering team. This modular approach allows for precise prompt engineering, isolated failure domains, predictable outputs, and easier debugging.

We utilize the Vercel AI SDK to interface with underlying LLMs (primarily OpenAI GPT-4o for complex reasoning tasks and Anthropic Claude 3.5 Sonnet for extensive code generation and context windows). The orchestration of these agents is managed by **Inngest**, allowing for durable, step-based execution, automatic retries, and sleeping/waking logic necessary for long-running analyses.

## 7.2 The AI Agents Ecosystem

### 7.2.1 Clarification Agent

- **Purpose**: The vanguard of the system. Its job is to analyze raw, often ambiguous user requests (e.g., "Make the login page faster") and determine if enough context exists to proceed. If not, it generates clarifying questions for the user.
- **Inputs**: Raw User Request, Project Context (tech stack, brief description), Previous Conversation History.
- **Outputs**: Structured JSON determining `action` ("PROCEED" or "ASK_USER"). If `ASK_USER`, an array of `questions`.
- **Prompt Strategy**: "You are a Senior Product Manager. Your goal is to eliminate ambiguity. If the user request lacks acceptance criteria, technical constraints, or explicit goals, you must ask targeted questions. Do not assume requirements."
- **Failure Modes**: Over-asking (annoying the user with trivial questions) or under-asking (allowing ambiguous tasks to proceed).
- **Validation Strategy**: Output must conform strictly to a Zod schema. If "PROCEED" is selected, the system programmatically checks if a minimum character threshold exists in the combined prompt.
- **Example Output**:
  ```json
  {
    "action": "ASK_USER",
    "questions": [
      "When you say 'faster', are we targeting a specific Core Web Vitals metric like LCP or INP?",
      "Are we optimizing the backend API response time, or the frontend rendering of the React components?"
    ]
  }
  ```

### 7.2.2 Scope Check Agent

- **Purpose**: To evaluate a well-defined user request against the capabilities of the system and the existing project state to determine feasibility.
- **Inputs**: Clarified User Request, Current Project Metrics (lines of code, language breakdown).
- **Outputs**: JSON containing `is_feasible` (boolean), `risk_level` (LOW, MEDIUM, HIGH), and `reasoning`.
- **Prompt Strategy**: "You are a pragmatic Engineering Manager. Assess if this request can be reasonably accomplished within a standard sprint. Identify risks like massive refactoring, unknown dependencies, or scope creep."
- **Failure Modes**: Rejecting valid requests due to conservative hallucination.
- **Validation Strategy**: Output JSON schema validation.

### 7.2.3 Repo Analysis Agent

- **Purpose**: The most computationally expensive and crucial agent. It ingests the GitHub repository structure and relevant file contents to build a mental model of the codebase before any code is written or reviewed.
- **Inputs**: GitHub Tree Structure, Package.json/requirements.txt, User Request.
- **Outputs**: A comprehensive Markdown document detailing the architecture, data flow, identified components relevant to the task, and dependency mappings.
- **Prompt Strategy**: "You are a Staff Software Architect. Analyze this codebase. Map the relevant boundaries. How does data flow from the database to the UI? Identify exactly which files need to be modified to fulfill the user's request."
- **Failure Modes**: Context window exhaustion. Analyzing irrelevant files.
- **Validation Strategy**: RAG (Retrieval-Augmented Generation) is heavily used here. We embed the codebase using a vector database. The agent first queries the vector DB to pull only the top-K relevant files based on the user request, preventing context overflow.

### 7.2.4 PRD (Product Requirements Document) Agent

- **Purpose**: Synthesizes the clarified request and repo analysis into a formal, structured PRD.
- **Inputs**: Clarified User Request, Repo Analysis Output.
- **Outputs**: Markdown PRD including: Objectives, Out of Scope, User Stories, Technical Implementation Details, and Acceptance Criteria.
- **Prompt Strategy**: "Generate a strict, professional PRD. The Acceptance Criteria must be highly specific, testable, and unambiguous binary states (pass/fail)."
- **Failure Modes**: Vague acceptance criteria.
- **Validation Strategy**: Human-in-the-loop. The PRD is presented to the user on the frontend for approval or modification before task planning begins.

### 7.2.5 Task Planning Agent

- **Purpose**: Breaks down the approved PRD into actionable, granular engineering tasks (like Jira tickets).
- **Inputs**: Approved PRD, Repo Analysis.
- **Outputs**: Array of JSON objects, each representing a task with `title`, `description`, `files_to_modify`, and `estimated_effort`.
- **Prompt Strategy**: "You are an Agile Scrum Master. Break this PRD down into independent, logical steps. No step should require modifying more than 3 distinct files. Ensure logical dependency ordering."
- **Failure Modes**: Creating circular dependencies between tasks. Tasks that are too large.
- **Validation Strategy**: The system checks the task graph for acyclic properties.

### 7.2.6 Review Agent

- **Purpose**: Acts as an automated Senior Engineer reviewing Pull Requests. It focuses on logic errors, security vulnerabilities, performance bottlenecks, and adherence to the PRD.
- **Inputs**: PR Diff, PRD Acceptance Criteria, Repo Analysis context.
- **Outputs**: Array of review comments tied to specific lines of code, and a final `decision` (APPROVE, REQUEST_CHANGES).
- **Prompt Strategy**: "You are a rigorous Senior Security and Performance Engineer reviewing this PR. Be extremely critical of potential race conditions, N+1 queries, unhandled exceptions, and security flaws. Do not comment on style formatting (leave that to linters)."
- **Failure Modes**: Nitpicking style over substance. Missing complex logical flaws spread across multiple files.
- **Validation Strategy**: The Review Agent is forced to explicitly output its reasoning against _each_ Acceptance Criterion from the PRD.
- **Reasoning Mechanics**: The Review Agent uses a Chain-of-Thought approach. Before making a decision, it generates an internal scratchpad:
  1.  _State Acceptance Criterion 1._
  2.  _Search diff for implementation of Criterion 1._
  3.  _Did the implementation satisfy the criteria? Yes/No. Why?_
  4.  _If No, generate inline comment at file X, line Y._
      Only after completing this checklist for all criteria does it finalize its review status.

### 7.2.7 QA Validation Agent

- **Purpose**: To verify that the implemented code actually works as intended, ideally by generating and executing unit/integration tests, or by structurally analyzing the AST (Abstract Syntax Tree).
- **Inputs**: PR Diff, generated Test Files.
- **Outputs**: Pass/Fail report with identified edge cases that lack coverage.
- **Prompt Strategy**: "Identify edge cases not covered by the current test suite. Look for null pointer exceptions, off-by-one errors, and boundary condition failures."

### 7.2.8 Release Readiness Agent

- **Purpose**: The final gatekeeper before deployment. Assesses the overall risk of merging the PR.
- **Inputs**: All PR details, Review Agent outputs, CI/CD statuses, QA Validation report.
- **Outputs**: A highly summarized executive report detailing Deployment Risk (Low/Medium/High), rollback instructions, and a summary of changes suitable for release notes.
- **Prompt Strategy**: "You are the Release Manager. Summarize the risk. Are there database migrations? Do they lock tables? Are there new environment variables required? Flag these clearly."

## 7.3 Orchestration and Fault Tolerance

The orchestration of these agents is handled by **Inngest workflows**.

1.  **State Machine**: The workflow operates as a durable state machine. If an agent API call fails due to a rate limit (HTTP 429) or a timeout, Inngest automatically pauses the step, applies exponential backoff, and retries without losing the state of the overall workflow.
2.  **Human-in-the-Loop (HITL)**: Workflows can be paused indefinitely using Inngest's `waitForEvent` primitive. For example, after the PRD Agent completes, the workflow sleeps, waiting for the user to emit an `app/prd.approved` event from the UI before proceeding to the Task Planning Agent.
3.  **Context Management**: As the workflow progresses, the accumulated context (Repo Analysis, PRD, Task List) grows. To prevent exceeding the LLM token limits, context is continually summarized and stored in a database or Redis cache, passing only references or condensed summaries to subsequent agents unless deep detail is required.

---

# Section 8 — GitHub Integration Architecture

## 8.1 Introduction to the GitHub Subsystem

ShipFlow AI's value proposition is inextricably linked to its ability to seamlessly interact with GitHub. We do not require users to leave their existing workflows; ShipFlow brings the AI directly into their Pull Requests and repositories.

The integration is built upon a formal **GitHub App**, communicating via the **Octokit** REST API clients, and reacting in real-time via **GitHub Webhooks**. This architecture provides significantly higher rate limits, granular permissions, and a better user experience compared to legacy OAuth applications or personal access tokens.

## 8.2 GitHub App Architecture and Authentication Flow

### 8.2.1 The GitHub App Setup

ShipFlow is registered as a GitHub App with specific, narrowly scoped permissions to adhere to the principle of least privilege:

- **Repository Permissions**:
  - `Contents`: Read (to analyze code) & Write (to create commits/branches for autonomous task completion).
  - `Pull Requests`: Read (to see diffs) & Write (to submit reviews and comments).
  - `Issues`: Read & Write (to interact with issue-driven workflows).
  - `Commit Statuses`: Read & Write (to provide CI-like feedback).
- **Organization Permissions**:
  - `Members`: Read (to sync organization directories).

### 8.2.2 The Authentication Lifecycle

Authenticating as a GitHub App involves a sophisticated, multi-step cryptographic process to generate temporary access tokens.

1.  **App Private Key**: ShipFlow holds an RSA private key associated with the GitHub App. This key is securely stored in AWS Secrets Manager.
2.  **Generating a JWT**: To authenticate as the App itself (e.g., to list installations), the backend generates a JSON Web Token (JWT) signed with the RSA private key. The JWT has a maximum lifespan of 10 minutes.
3.  **Installation Access Tokens (IAT)**: When ShipFlow needs to interact with a specific user's repository, it cannot use the JWT directly. It must exchange the JWT for an Installation Access Token.
    - The backend identifies the `installation_id` associated with the target repository (stored in the ShipFlow database upon initial linking).
    - Using the JWT, it calls the GitHub API: `POST /app/installations/{installation_id}/access_tokens`.
    - GitHub returns an IAT valid for 1 hour.
4.  **Octokit Instantiation**: The ShipFlow service layer instantiates an Octokit client using the temporary IAT. This client is used to perform the actual data fetching or writing.
    ```typescript
    // Pseudocode for Octokit initialization
    const jwt = generateAppJWT(privateKey);
    const iat = await getInstallationToken(jwt, installationId);
    const octokit = new Octokit({ auth: iat });
    const prDetails = await octokit.rest.pulls.get({ owner, repo, pull_number });
    ```
5.  **Token Caching**: To prevent hitting rate limits on the token generation endpoint, IATs are cached in Redis with a TTL of 55 minutes, ensuring they are refreshed shortly before expiration.

## 8.3 Real-time Operations via Webhook Flow

ShipFlow reacts instantaneously to developer actions on GitHub via a robust webhook processing pipeline.

### 8.3.1 Webhook Ingestion and Security

1.  **Endpoint**: GitHub sends HTTP POST requests to ShipFlow's unified webhook endpoint: `/api/webhooks/github`.
2.  **Validation**: Every payload is cryptographically signed by GitHub using a shared webhook secret. The Next.js API route computes the HMAC hex digest of the request body and compares it against the `x-hub-signature-256` header. If they mismatch, the request is instantly rejected (HTTP 401) to prevent spoofing.
3.  **Event Queuing**: To ensure the ingestion endpoint remains highly responsive (preventing GitHub from timing out and disabling the webhook), the endpoint performs zero heavy processing. It simply pushes the validated payload onto a durable Inngest event queue (e.g., event: `github.pr.opened`) and returns an HTTP 202 Accepted.

### 8.3.2 The Pull Request Lifecycle Sync

The most complex webhook flow revolves around the Pull Request lifecycle.

1.  **`pull_request.opened` or `pull_request.synchronize` (New Commit)**:
    - The Inngest worker picks up the event.
    - It identifies the ShipFlow Project associated with the repository.
    - It initiates the **PR Review Workflow** (triggering the AI Review Agent).
2.  **Diff Processing**:
    - The worker uses Octokit to fetch the PR diff.
    - **Crucial Optimization**: Raw diffs can exceed LLM context windows. The worker runs a parsing utility to strip out deleted lines if they aren't necessary for context, ignore auto-generated files (like `package-lock.json`), and chunk large files into logical segments.
3.  **Comment Publishing**:
    - Once the Review Agent completes its analysis and generates comments, the worker maps the LLM output back to specific files and line numbers.
    - It uses Octokit to submit a formal "Pull Request Review" using the `POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews` endpoint.
    - The review groups all inline comments into a single batch, preventing GitHub notification spam for the developer. The review state can be `COMMENT`, `APPROVE`, or `REQUEST_CHANGES` based on the Review Agent's decision.

### 8.3.3 Check Runs Integration

ShipFlow utilizes GitHub Check Runs to provide a native, CI-like experience directly within the GitHub UI, without requiring the user to navigate to the ShipFlow dashboard.

1.  **Check Suite Initialization**: When a PR is opened, ShipFlow immediately creates a new Check Run named "ShipFlow AI Review" with a status of `in_progress`. This displays a spinning icon in the PR's checks section.
2.  **Streaming Updates**: As the Inngest workflow progresses through different AI agents (Scope Check -> PRD -> Review), the worker updates the Check Run's `output.title` and `output.summary` to reflect the current state (e.g., "Analyzing repository architecture...").
3.  **Completion**: Upon completion, the Check Run is updated to a `completed` status. The `conclusion` is set to `success` (if the Review Agent approved), `failure` (if changes were requested), or `neutral` (if just leaving informational comments). The `output.text` contains a heavily formatted markdown summary of the AI's findings, complete with links back to the ShipFlow dashboard for deep dives.

### 8.3.4 Proactive Repo Analysis (Background Sync)

To ensure the Repo Analysis Agent always has up-to-date context without delaying PR reviews, ShipFlow performs background syncing.

- When the `push` webhook is received for the default branch (e.g., `main`), an asynchronous job is triggered.
- This job fetches the latest tree structure and selectively updates the vector embeddings in the database for files that were modified in the push.
- This ensures that when a new PR is opened, the RAG system retrieves the most accurate architectural context instantly, drastically reducing latency.

# SECTION 9 — WORKFLOW ENGINE

The Workflow Engine is the beating heart of ShipFlow AI, orchestrating asynchronous, long-running, and distributed processes across the system. It leverages Inngest to provide durable execution, automatic retries, step-level state management, and seamless integration with third-party systems like GitHub and Slack. The architecture is designed to handle transient failures gracefully, ensuring that complex workflows—such as analyzing repositories, generating Product Requirements Documents (PRDs), or orchestrating multi-agent code reviews—complete reliably without blocking the main web application thread.

By utilizing Inngest, we abstract away the complexities of message queues, workers, and state machines into simple, serverless functions. Each workflow is defined as a series of idempotent steps. If a step fails, Inngest retries it automatically based on an exponential backoff strategy, maintaining the overall state of the workflow.

## 9.1 Feature Intake Workflow

**Trigger:** `feature.intake.requested`
This workflow is triggered when a user submits a new feature request via the UI, a webhook, or an API call.

**Input Payload:**

```json
{
  "featureId": "feat_12345",
  "projectId": "proj_67890",
  "organizationId": "org_abcde",
  "rawInput": "We need a way to export user data to CSV from the dashboard.",
  "submittedBy": "user_xyz",
  "metadata": {
    "source": "web_ui",
    "timestamp": "2026-06-22T00:33:42Z"
  }
}
```

**Processing Steps:**

1.  **Context Gathering (`step.run("gather-project-context")`):** Retrieves project metadata, recent repository commits, existing feature documentation, and organizational preferences.
2.  **Initial AI Analysis (`step.run("analyze-intake")`):** Passes the `rawInput` and context to the AI SDK to determine the scope, identify missing information, and classify the feature.
3.  **State Transition (`step.run("update-feature-state")`):** Updates the feature status in PostgreSQL. If the analysis determines the request is vague, the state becomes `clarifying`. If clear, it moves to `prd_draft`.
4.  **Notification (`step.run("notify-stakeholders")`):** Sends a Slack/Email notification to project members about the new feature request.

**Output:** A structured analysis object, state transition logs, and notification dispatch confirmations.

**Failure Handling:**

- If context gathering fails due to database timeout, it retries up to 5 times.
- If AI analysis fails due to rate limits (e.g., Anthropic/OpenAI 429), Inngest applies exponential backoff, delaying the retry to avoid overwhelming the provider.
- If the AI outputs malformed JSON, a custom error is thrown, triggering a retry with a stronger system prompt emphasizing strict JSON output.

**Retry Handling:** Max 10 retries over 24 hours. If it exceeds this, the workflow transitions the feature state to `error` and alerts an administrator.

## 9.2 Clarification Workflow

**Trigger:** `feature.clarification.needed`
Triggered when the AI determines that a feature request lacks sufficient detail to proceed to PRD generation.

**Input Payload:**

```json
{
  "featureId": "feat_12345",
  "missingInformation": [
    "What specific data fields should be exported?",
    "Are there any size limits?"
  ],
  "contextStr": "We need a way to export user data to CSV from the dashboard."
}
```

**Processing Steps:**

1.  **Generate Questions (`step.run("generate-clarifying-questions")`):** Formulates precise, user-friendly questions based on the missing information.
2.  **Dispatch to User (`step.run("dispatch-questions")`):** Sends an email or in-app notification containing the questions.
3.  **Wait for Response (`step.waitForEvent("wait-for-user-response")`):** The workflow pauses indefinitely (or up to a configured timeout, e.g., 7 days) waiting for a `feature.clarification.provided` event.
4.  **Process Response (`step.run("process-clarification")`):** Once received, appends the response to the feature context.
5.  **Re-evaluate (`step.run("re-evaluate-intake")`):** Determines if the new context is sufficient. If yes, triggers `feature.prd.generate`; if no, loops back to step 1 (handled via a recursive event trigger).

**Output:** A complete context payload ready for PRD generation.

**Failure Handling:** If the user doesn't respond within 7 days, a reminder step executes. After 14 days, the feature is marked `stale`.

## 9.3 PRD Generation Workflow

**Trigger:** `feature.prd.generate`
Triggered when a feature has sufficient context and is ready for technical specification.

**Input Payload:**

```json
{
  "featureId": "feat_12345",
  "consolidatedContext": "...",
  "repositoryArchitecture": "..."
}
```

**Processing Steps:**

1.  **Drafting (`step.run("draft-prd-sections")`):** The AI generates the PRD in logical chunks (Overview, User Stories, Technical Architecture, Edge Cases) to prevent context window overflows and allow parallel generation where possible.
2.  **Review & Refine (`step.run("self-critique")`):** A secondary AI prompt reviews the drafted PRD against organizational standards and project context, suggesting edits.
3.  **Finalization (`step.run("finalize-prd")`):** Merges the sections and applies suggested edits.
4.  **Database Update (`step.run("save-prd")`):** Stores the generated PRD in the database, linked to the feature.
5.  **State Update:** Transitions feature to `planning`.

**Output:** A comprehensive Markdown PRD document.

**Failure Handling:** LLM token limit errors trigger a fallback step that summarizes the context before retrying generation.

## 9.4 Task Generation Workflow

**Trigger:** `feature.tasks.generate`
Triggered after a PRD is approved by a human stakeholder.

**Input Payload:**

```json
{
  "featureId": "feat_12345",
  "prdId": "prd_9876",
  "approvedBy": "user_123"
}
```

**Processing Steps:**

1.  **Decomposition (`step.run("decompose-prd")`):** Analyzes the PRD and breaks it down into granular, implementable tasks.
2.  **Dependency Mapping (`step.run("map-dependencies")`):** Identifies execution order (e.g., database schema changes must precede API router changes).
3.  **Ticket Creation (`step.run("create-tickets")`):** Creates structured task objects in PostgreSQL.
4.  **Sync to Issue Tracker (`step.run("sync-tracker")`):** Optional step. If the project is linked to Linear or Jira, creates corresponding tickets via their APIs.

**Output:** An array of structured tasks with defined dependencies and estimations.

**Failure Handling:** External API failures (e.g., Linear API down) are caught and retried. The workflow utilizes idempotency keys when creating external tickets to prevent duplicates during retries.

## 9.5 Repo Sync Workflow

**Trigger:** `repository.sync.requested`
Triggered when a project is onboarded, or periodically via a cron job, or via a GitHub webhook on `push` to the main branch.

**Input Payload:**

```json
{
  "projectId": "proj_123",
  "repositoryFullName": "org/repo",
  "installationId": "123456"
}
```

**Processing Steps:**

1.  **Fetch Metadata (`step.run("fetch-repo-meta")`):** Retrieves default branch, language statistics, and top-level directory structure using Octokit.
2.  **Clone / Download (`step.run("download-source")`):** Downloads a shallow clone or a tarball of the relevant branch.
3.  **AST Parsing & Analysis (`step.run("analyze-codebase")`):** Processes files to build a structural graph of the repository (functions, classes, dependencies). This step may take several minutes for large repositories.
4.  **Vector Embedding (`step.run("embed-code")`):** Chunks the code and generates vector embeddings, storing them in a vector database (e.g., pgvector) for semantic search during feature implementation.
5.  **Update DB (`step.run("update-repo-status")`):** Marks sync as complete.

**Output:** Updated semantic search index and architectural graph.

**Failure Handling:** Step 3 is resource-intensive. If it crashes due to memory limits, the workflow splits the task into smaller batches (directory by directory) in the retry logic.

## 9.6 Review Workflow

**Trigger:** `pull_request.opened` or `pull_request.synchronized`
Triggered via GitHub webhooks when code is submitted against a ShipFlow-managed feature branch.

**Input Payload:**

```json
{
  "pullRequestId": 101,
  "repository": "org/repo",
  "diffUrl": "...",
  "featureId": "feat_123"
}
```

**Processing Steps:**

1.  **Fetch Diff (`step.run("fetch-pr-diff")`):** Downloads the PR diff and metadata.
2.  **Load Context (`step.run("load-pr-context")`):** Retrieves the associated PRD, Task, and relevant codebase embeddings.
3.  **AI Code Review (`step.run("perform-code-review")`):** Analyzes the diff against the PRD requirements, coding standards, and security best practices.
4.  **Generate Comments (`step.run("generate-review-comments")`):** Creates specific, line-level comments and a general summary.
5.  **Post to GitHub (`step.run("post-github-review")`):** Uses Octokit to submit the review on the PR.

**Output:** A completed GitHub PR review (Approve, Request Changes, or Comment).

**Failure Handling:** Strict idempotency is enforced when posting to GitHub to avoid spamming the PR with duplicate comments if the Inngest runner restarts unexpectedly.

## 9.7 Re-Review Workflow

**Trigger:** `pull_request.review_requested` (specifically targeting the ShipFlow bot) or subsequent `pull_request.synchronized` events after an initial review.

**Processing Steps:**
Similar to the initial review, but the AI context specifically includes previous review comments and whether the author addressed them. The AI is prompted to verify fixes rather than doing a full from-scratch review, optimizing token usage and execution time.

## 9.8 Release Readiness Workflow

**Trigger:** `feature.state.shipped` (or transitioning to shipped)

**Processing Steps:**

1.  **Verification (`step.run("verify-all-prs-merged")`):** Confirms all associated PRs for the feature are merged.
2.  **Changelog Generation (`step.run("generate-changelog")`):** Analyzes the PRs and PRD to write user-facing release notes.
3.  **Update Documentation (`step.run("update-docs")`):** Triggers a sub-workflow to update internal or external documentation repositories if applicable.

## 9.9 Webhook Delivery Workflow

**Trigger:** `system.event.occurred`
A generic workflow for dispatching events to external consumers who have registered webhooks.

**Processing Steps:**

1.  **Format Payload (`step.run("format-webhook-payload")`):** Shapes the internal event into the public API schema.
2.  **Sign Payload (`step.run("sign-payload")`):** Generates an HMAC signature using the consumer's secret.
3.  **Dispatch (`step.run("dispatch-http")`):** Sends the HTTP POST request.

**Retry Handling:** Implements a strict exponential backoff (e.g., immediate, 1m, 5m, 30m, 2h, 12h) to handle external server downtime. Records delivery attempts and HTTP status codes in the database for user visibility in the Webhook logs UI.

---

# SECTION 10 — FEATURE WORKFLOW

The Feature Workflow State Machine is the core lifecycle manager for every unit of value delivered through ShipFlow AI. It defines the rigid pathways a feature must take from inception to deployment, ensuring that no step is skipped and that human oversight is strategically placed.

## 10.1 State Machine Overview

The state machine is implemented using a strict status enum in PostgreSQL, enforced by service-layer logic that validates transitions based on a defined graph.

**States:**

- `intake`: Initial submission, gathering context.
- `clarifying`: Blocked, awaiting more details from the user.
- `prd_draft`: AI is writing the Product Requirements Document.
- `planning`: PRD is complete, tasks are being generated and sequenced.
- `awaiting_plan_approval`: Human intervention required to approve the PRD and Task Plan.
- `in_development`: Agents are actively writing code / human developers are working.
- `in_review`: Code is submitted and undergoing AI and/or human code review.
- `fix_needed`: Review failed, revisions are required.
- `awaiting_human_approval`: Final code is ready, waiting for a human to sign off before merge/release.
- `shipped`: Successfully deployed and closed.

**Side States (Terminal/Special):**

- `rejected`: Feature declined by a human or deemed unfeasible.
- `duplicate_education`: Identified as a duplicate of an existing feature or existing functionality.

## 10.2 Entry/Exit Criteria and Transitions

### `intake`

- **Entry:** A new feature request record is created in the database.
- **Exit:** AI analysis completes successfully.
- **Allowed Transitions:**
  - -> `clarifying` (If AI needs more info)
  - -> `prd_draft` (If AI has enough info)
  - -> `duplicate_education` (If AI detects it already exists)
  - -> `rejected` (Manual override)

### `clarifying`

- **Entry:** AI identifies missing critical requirements.
- **Exit:** User provides clarification payload.
- **Allowed Transitions:**
  - -> `intake` (To re-evaluate the new context)
  - -> `rejected` (If the user abandons the request)

### `prd_draft`

- **Entry:** Sufficient context is established.
- **Exit:** PRD generation workflow completes and saves the document.
- **Allowed Transitions:**
  - -> `planning` (Automatic upon completion)
  - -> `rejected`

### `planning`

- **Entry:** PRD is generated.
- **Exit:** Task generation workflow completes.
- **Allowed Transitions:**
  - -> `awaiting_plan_approval` (Automatic upon completion)

### `awaiting_plan_approval`

- **Entry:** Task list and PRD are fully formed.
- **Exit:** Human user clicks "Approve Plan" in the UI.
- **Allowed Transitions:**
  - -> `in_development` (Approved)
  - -> `prd_draft` (Human requests major revisions to the PRD)
  - -> `rejected` (Human decides not to build it)

### `in_development`

- **Entry:** Plan approved, agents start coding, or branches are created.
- **Exit:** A Pull Request associated with the feature is opened.
- **Allowed Transitions:**
  - -> `in_review` (PR opened)

### `in_review`

- **Entry:** PR opened or synchronized.
- **Exit:** Review process completes.
- **Allowed Transitions:**
  - -> `fix_needed` (AI or Human requests changes)
  - -> `awaiting_human_approval` (AI approves, requires final human sign-off)

### `fix_needed`

- **Entry:** Changes requested on PR.
- **Exit:** New commits pushed to the PR branch.
- **Allowed Transitions:**
  - -> `in_review` (New code needs review)

### `awaiting_human_approval`

- **Entry:** All automated checks and AI reviews pass.
- **Exit:** Human user approves and merges the PR.
- **Allowed Transitions:**
  - -> `shipped` (Merged)
  - -> `fix_needed` (Human spots a last-minute issue)

### `shipped`

- **Entry:** PR is merged into the default branch.
- **Terminal State.** No outgoing transitions allowed unless manually reverted by a super-admin, which creates a new feature request representing the revert.

## 10.3 Forbidden Transitions and Safeguards

The system strictly prohibits bypassing logical gates. For instance:

- A feature cannot move from `intake` to `in_development` without a PRD and approved plan.
- A feature cannot move to `shipped` from `in_development` without passing through `in_review` and `awaiting_human_approval`.
  Attempting forbidden transitions via the API results in a `400 Bad Request` with a clear explanation of the state machine violation. This logic is housed in the `FeatureService.transitionState(featureId, targetState)` method, which checks an internal adjacency list of valid transitions.

---

# SECTION 11 — API DESIGN

ShipFlow AI utilizes tRPC (TypeScript Remote Procedure Call) to ensure end-to-end type safety between the Next.js frontend and the Node.js backend services. The API is divided into domain-specific routers, each responsible for a distinct slice of the application's functionality.

## 11.1 Router Structure and Middleware

The root tRPC router (`appRouter`) merges multiple sub-routers. Every procedure is protected by middleware:

- **`publicProcedure`:** Unauthenticated endpoints (e.g., webhook receivers, public status).
- **`protectedProcedure`:** Requires a valid session from BetterAuth. Injects `ctx.user`.
- **`orgProcedure`:** Extends `protectedProcedure`. Requires an `orgId` input or header. Verifies the user belongs to the organization and injects `ctx.org` and `ctx.orgRole`.
- **`projectProcedure`:** Extends `orgProcedure`. Requires a `projectId`. Verifies project access and injects `ctx.project`.

## 11.2 Domain Routers

### 1. `auth` Router

- **Purpose:** Manages user sessions, profile data, and BetterAuth integration extensions.
- **Queries:**
  - `getSession`: Returns current user session details.
  - `getProfile`: Returns user settings and preferences.
- **Mutations:**
  - `updateProfile`: Updates name, avatar, etc.
  - `deleteAccount`: Initiates account deletion process.
- **Permissions:** `protectedProcedure`.

### 2. `organization` Router

- **Purpose:** Manages workspaces, billing links, and team members.
- **Queries:**
  - `list`: Gets all orgs the user is a member of.
  - `getById`: Gets details of a specific org.
  - `listMembers`: Gets users within an org and their roles (Admin, Member, Viewer).
- **Mutations:**
  - `create`: Creates a new organization.
  - `update`: Updates org settings.
  - `inviteMember`: Sends an email invitation.
  - `removeMember`: Revokes access.
  - `updateMemberRole`: Changes RBAC role.
- **Permissions:** Creation is `protected`. Most others are `orgProcedure`. Role management requires `Admin` org role.

### 3. `project` Router

- **Purpose:** Manages individual repositories/codebases within an organization.
- **Queries:**
  - `list`: Lists projects in an org.
  - `getById`: Gets project details, including GitHub repo link status.
- **Mutations:**
  - `create`: Initializes a new project.
  - `updateSettings`: Updates project-specific AI instructions or workflow rules.
  - `delete`: Soft-deletes a project.
  - `triggerRepoSync`: Manually enqueues the Repo Sync Inngest workflow.
- **Permissions:** `orgProcedure` (Viewer can read, Member/Admin can mutate).

### 4. `feature` Router

- **Purpose:** Core router for managing the feature lifecycle state machine.
- **Queries:**
  - `list`: Paginated, filterable list of features for a project.
  - `getById`: Detailed view of a feature, including state history.
- **Mutations:**
  - `create`: Submits a new feature intake request (Triggers `feature.intake.requested`).
  - `update`: Modifies basic feature metadata.
  - `provideClarification`: Submits answers to AI clarifying questions.
  - `transitionState`: Admin/System override for state changes.
- **Permissions:** `projectProcedure`.

### 5. `prd` Router

- **Purpose:** Manages Product Requirements Documents attached to features.
- **Queries:**
  - `getByFeatureId`: Retrieves the PRD.
  - `getHistory`: Retrieves version history of the PRD.
- **Mutations:**
  - `update`: Manual edits to the PRD by a human.
  - `approve`: Human signs off on the PRD, triggering task generation.
  - `requestRegeneration`: Asks the AI to rewrite the PRD with new instructions.
- **Permissions:** `projectProcedure`.

### 6. `task` Router

- **Purpose:** Manages the granular tasks generated from a PRD.
- **Queries:**
  - `listByFeatureId`: Gets all tasks and their hierarchy/dependencies.
- **Mutations:**
  - `update`: Updates task status, assignee, or description.
  - `createManual`: Adds a task manually.
  - `delete`: Removes a task.
- **Permissions:** `projectProcedure`.

### 7. `github` Router

- **Purpose:** Interacts with GitHub App installation and repository data.
- **Queries:**
  - `listInstallations`: Gets GitHub orgs where the ShipFlow app is installed.
  - `listRepositories`: Gets available repos for an installation.
- **Mutations:**
  - `linkRepository`: Connects a ShipFlow project to a GitHub repo.
- **Permissions:** `orgProcedure` (Admin only).

### 8. `review` & `approval` Routers

- **Purpose:** Manages code reviews and human approvals.
- **Queries:**
  - `getReviewSummaries`: Gets AI-generated summaries of PRs.
  - `listPendingApprovals`: Gets features in `awaiting_human_approval` state.
- **Mutations:**
  - `submitHumanApproval`: Signs off on a feature for release.
  - `rejectWithFeedback`: Sends a feature back to `fix_needed`.
- **Permissions:** `projectProcedure`. Approvals usually require elevated project roles (e.g., Lead Engineer).

### 9. `billing` Router

- **Purpose:** Integrates with Razorpay for subscription management.
- **Queries:**
  - `getSubscription`: Current tier, usage limits, and renewal date.
  - `getInvoices`: Past billing statements.
- **Mutations:**
  - `createCheckoutSession`: Initiates an upgrade/downgrade flow.
  - `cancelSubscription`: Cancels auto-renewal.
- **Permissions:** `orgProcedure` (Admin only).

### 10. `analytics` Router

- **Purpose:** Provides data for dashboard charts.
- **Queries:**
  - `getVelocityMetrics`: Features shipped per week, average lead time.
  - `getAIUsage`: Token consumption and cost estimates.
- **Permissions:** `orgProcedure`.

### 11. `api-key` & `webhook` Routers

- **Purpose:** Developer portal features for external integration.
- **Queries:**
  - `listKeys`, `listWebhooks`, `getWebhookDeliveries`.
- **Mutations:**
  - `createKey`, `revokeKey`.
  - `createWebhook`, `updateWebhook`, `deleteWebhook`.
- **Permissions:** `orgProcedure` (Admin only). Keys are returned only once upon creation.

---

# SECTION 12 — FRONTEND DESIGN

The frontend is built using Next.js (App Router), leveraging React Server Components for performance and SEO, and Client Components where interactivity is required. The UI is constructed using Shadcn UI, styled with Tailwind CSS, ensuring a clean, accessible, and highly customizable design system.

## 12.1 Core Architectural Patterns

- **Data Fetching:** Handled via tRPC. Server components use the server-side tRPC caller (`api.router.caller`) to fetch data before rendering, eliminating loading spinners for initial page loads. Client components use `trpc.useQuery` for interactive or polling data.
- **State Management:** Global UI state (e.g., sidebar collapse, theme) uses Zustand. Server state is managed entirely by tRPC/React Query caching.
- **Error Handling:** `error.tsx` boundary components at route levels catch rendering errors. tRPC errors are displayed using Shadcn Toast notifications.
- **Loading States:** `loading.tsx` files provide generic skeleton screens during SSR, while granular Skeleton components from Shadcn are used for specific widgets.

## 12.2 Key Pages and Layouts

### 1. Landing Page (`/`)

- **Purpose:** Marketing and conversion. Highlights value propositions of AI-driven software delivery.
- **Data Requirements:** None (static content).
- **Components:** Hero Section, Features Grid, Testimonials, Pricing Tiers, Call to Action.
- **Design Notes:** High visual impact, dark mode optimized, smooth scroll animations using Framer Motion.

### 2. Global Dashboard (`/dashboard`)

- **Purpose:** The entry point after login. Provides a high-level overview across all organizations and projects.
- **Data Requirements:** `organization.list`, cross-project summary metrics.
- **Components:** Organization Selector, Global Activity Feed, High-level metrics cards (e.g., "Features Shipped this Week").
- **Empty State:** "Welcome to ShipFlow. Create an organization to get started."

### 3. Project Dashboard (`/org/[orgId]/project/[projectId]`)

- **Purpose:** The nerve center for a specific codebase.
- **Data Requirements:** `project.getById`, `analytics.getVelocityMetrics`, `feature.list` (recent).
- **Components:** Project Header (showing GitHub sync status), Velocity Chart (Recharts), Active Features List, Recent Activity Timeline.
- **Loading State:** Skeleton chart and skeleton list items.

### 4. Features Board (`/org/[orgId]/project/[projectId]/features`)

- **Purpose:** Kanban-style or list view of all features in the workflow.
- **Data Requirements:** `feature.list` with filters (status, assignee).
- **Hooks Used:** `trpc.feature.list.useQuery`, `useDebounce` (for search input).
- **Components:** Data Table (TanStack Table) or Kanban Board (dnd-kit), Status Badges, Filter Bar, "New Feature" Modal.
- **Interactive State:** Drag-and-drop to update status (calls `feature.transitionState` mutation).

### 5. PRD Editor (`/org/[orgId]/project/[projectId]/feature/[featureId]/prd`)

- **Purpose:** Viewing, editing, and approving AI-generated PRDs.
- **Data Requirements:** `feature.getById`, `prd.getByFeatureId`.
- **Hooks Used:** `trpc.prd.update.useMutation`, `useEditor` (TipTap or Novel.sh for rich text).
- **Components:** Rich Text Editor, AI Suggestion Sidebar, Version History Dropdown, "Approve Plan" Action Bar.
- **Error State:** If PRD generation failed, shows a generic error with a "Retry Generation" button.

### 6. Task Board (`/org/[orgId]/project/[projectId]/feature/[featureId]/tasks`)

- **Purpose:** Visualizing the decomposition of a feature.
- **Data Requirements:** `task.listByFeatureId`.
- **Components:** Task Tree/List, Dependency Graph visualization (e.g., using React Flow), Assignee Selectors.
- **Empty State:** If PRD is approved but tasks aren't generated yet, shows a loading spinner indicating "AI is analyzing PRD and generating tasks...".

### 7. Review Dashboard (`/org/[orgId]/project/[projectId]/reviews`)

- **Purpose:** Centralized view of all code currently in the `in_review` state.
- **Data Requirements:** `feature.list` (filtered by `in_review`), `review.getReviewSummaries`.
- **Components:** PR List, AI Confidence Score Badges, Diff Summary Cards.

### 8. Approval Center (`/org/[orgId]/project/[projectId]/approvals`)

- **Purpose:** Gatekeeper view for lead engineers to perform final sign-off before shipping.
- **Data Requirements:** `feature.list` (filtered by `awaiting_human_approval`).
- **Components:** Approval Queue, Feature Summary Panel, "Ship It" and "Reject" Action Buttons.

### 9. Billing (`/org/[orgId]/settings/billing`)

- **Purpose:** Subscription management.
- **Data Requirements:** `billing.getSubscription`, `billing.getInvoices`.
- **Components:** Current Plan Card, Usage Progress Bars (e.g., AI Tokens used vs limit), Invoice Table, "Upgrade Plan" Button (redirects to Razorpay checkout).

### 10. Developer Portal (`/org/[orgId]/settings/developer`)

- **Purpose:** API Key and Webhook management.
- **Data Requirements:** `api-key.listKeys`, `webhook.listWebhooks`.
- **Components:** Key Generation Modal (shows key ONLY once), Webhook Configuration Form, Webhook Delivery Logs Table (showing payload and response codes).

### 11. Audit Logs (`/org/[orgId]/settings/audit`)

- **Purpose:** Security and compliance visibility.
- **Data Requirements:** Paginated audit log queries.
- **Components:** Dense Data Table with advanced filtering (by user, action type, date).

## 12.3 Reusable UI Components (Shadcn customized)

- **`WorkflowBadge`:** A highly stylized badge component that maps feature states to specific colors and icons (e.g., `shipped` is a solid green checkmark, `in_development` is a pulsing blue dot).
- **`AIChatSheet`:** A slide-out panel available on most project pages allowing the user to converse with the ShipFlow AI contextually (e.g., "Explain why this PRD suggests adding a new database table").
- **`EmptyPlaceholder`:** A consistent component used across the app when lists are empty, featuring an illustration, a title, a description, and an optional call-to-action button.

# Section 13: Detailed Task Breakdown (Part 1/2)

This section provides a rigorous, in-depth breakdown of the foundational and core workflow tasks required to build ShipFlow AI. The tasks are designed strictly following the defined architecture (Next.js, tRPC, Drizzle, PostgreSQL, BetterAuth, Razorpay, AI SDK, Inngest, Octokit, Shadcn UI) and the monorepo structure (apps/web, packages/db, services, trpc, shared, ai, github, workflow, auth, billing, ui). Layering rules (Component -> Hook -> tRPC Router -> Service -> Repository -> Database) are meticulously enforced throughout the deliverables.

---

## Task 1: Monorepo Foundation and Tooling Setup

**Description**:
Establish the foundational monorepo structure using Turborepo or an equivalent workspace manager. This includes setting up the base directory structure, defining package namespaces (`@shipflow/`), and configuring global linting (ESLint), formatting (Prettier), and TypeScript compiler options. The goal is to create a robust, scalable foundation that ensures consistency across all apps and packages in the project. This involves creating shared configuration packages that all other modules will extend.

**Packages Affected**:

- `packages/config-typescript`
- `packages/config-eslint`
- `packages/config-tailwind`
- Root monorepo configuration

**Files Expected**:

- `package.json` (Root)
- `turbo.json` or `pnpm-workspace.yaml`
- `packages/config-typescript/base.json`
- `packages/config-typescript/nextjs.json`
- `packages/config-eslint/index.js`
- `packages/config-eslint/next.js`
- `.prettierrc`
- `.editorconfig`

**Dependencies**:

- None

**Deliverables**:

- A fully functional monorepo structure where packages can seamlessly depend on each other.
- Shared ESLint, Prettier, and TypeScript configurations exported as local packages.
- Root scripts for building, linting, and formatting all workspaces.

**Acceptance Criteria**:

- Running `pnpm install` or equivalent succeeds without dependency resolution errors.
- Running `pnpm lint` and `pnpm format` executes successfully across the entire workspace, applying unified rules.
- Circular dependencies between packages are strictly forbidden and verified by tools like `madge` or ESLint rules.
- The `turbo` cache works correctly across builds, significantly reducing build times on repeated executions.
- All configuration packages are correctly typed and extendable.

**Testing Requirements**:

- Automated shell script tests to verify workspace boundary violations.
- Verification of caching mechanisms by running the build twice and ensuring the second execution hits the cache.

---

## Task 2: Core Database Infrastructure and Schema Definition

**Description**:
Initialize the `packages/db` package utilizing Drizzle ORM and PostgreSQL. This task focuses on defining the foundational schema required for authentication, user management, and multitenancy (workspaces/organizations). It also includes setting up Drizzle Kit for database migrations and creating a centralized database client instance that can be imported by repository layers in other packages.

**Packages Affected**:

- `packages/db`

**Files Expected**:

- `packages/db/package.json`
- `packages/db/src/index.ts`
- `packages/db/src/client.ts`
- `packages/db/src/schema/users.ts`
- `packages/db/src/schema/workspaces.ts`
- `packages/db/src/schema/index.ts`
- `packages/db/drizzle.config.ts`

**Dependencies**:

- Task 1 (Monorepo Foundation)

**Deliverables**:

- A fully typed Drizzle schema representing users, accounts, sessions, and workspaces.
- A configured Drizzle client using `postgres.js` or `pg`.
- Migration scripts configured in `package.json` to push and apply schemas.
- Exported TypeScript types for inserting and selecting records.

**Acceptance Criteria**:

- The `db` package exports the connected client, schema definitions, and inferred TypeScript types without exposing sensitive connection details directly in code.
- Running the `drizzle-kit push:pg` or `migrate` command successfully creates the tables in a local PostgreSQL instance.
- The schema rigorously enforces foreign key constraints (e.g., between users and workspaces).
- Timestamps (`createdAt`, `updatedAt`) are automatically managed at the database level using default SQL functions.
- Enums and specific data types are accurately represented in the schema definition.

**Testing Requirements**:

- Integration tests connecting to a local or Dockerized PostgreSQL database to verify table creation and basic CRUD operations.
- Type tests to ensure `InferSelectModel` and `InferInsertModel` accurately reflect the database schema.

---

## Task 3: Centralized Authentication Module Initialization

**Description**:
Set up the authentication foundation using BetterAuth within the `packages/auth` package. This module will integrate tightly with `packages/db` to store users and sessions. The task involves configuring the BetterAuth server instance, defining authentication providers (e.g., GitHub, Google, and Email/Password), and creating middleware utilities to protect routes and tRPC procedures.

**Packages Affected**:

- `packages/auth`
- `packages/db`

**Files Expected**:

- `packages/auth/package.json`
- `packages/auth/src/index.ts`
- `packages/auth/src/better-auth-config.ts`
- `packages/auth/src/middleware.ts`
- `packages/auth/src/utils.ts`

**Dependencies**:

- Task 2 (Database Infrastructure)

**Deliverables**:

- A pre-configured BetterAuth instance exported for use in Next.js API routes.
- Utility functions to retrieve the current session server-side.
- Session validation logic integrated with the Drizzle database adapter.

**Acceptance Criteria**:

- BetterAuth is securely configured to interact with the database using the shared `db` package.
- OAuth providers are properly structured to accept credentials via environment variables without hardcoding.
- The exported `getServerSession` equivalent correctly returns full user and workspace context.
- Secure cookie settings are applied depending on the environment (development vs. production).
- The package exposes types for the Session object, extending the default BetterAuth types to include custom metadata if necessary.

**Testing Requirements**:

- Unit tests mocking the database adapter to ensure BetterAuth configuration initializes without errors.
- Tests verifying that missing environment variables throw meaningful errors during initialization.

---

## Task 4: Next.js Web Application Scaffold

**Description**:
Initialize the primary user interface application in `apps/web` utilizing Next.js (App Router). This involves setting up the core layout, integrating the shared Tailwind CSS configuration, and establishing the Shadcn UI foundation. The application must consume the configuration packages from Task 1. This task sets the stage for building the frontend components.

**Packages Affected**:

- `apps/web`
- `packages/ui`

**Files Expected**:

- `apps/web/package.json`
- `apps/web/next.config.mjs`
- `apps/web/tailwind.config.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`
- `packages/ui/components/ui/button.tsx`
- `packages/ui/components/ui/input.tsx`

**Dependencies**:

- Task 1 (Monorepo Foundation)

**Deliverables**:

- A compiling Next.js application utilizing the App Router.
- A shared `packages/ui` package exporting initialized Shadcn components (Button, Input).
- Global layout configured with basic SEO metadata and custom font integration (e.g., Inter).

**Acceptance Criteria**:

- Next.js development server starts without warnings and properly renders the root page.
- Shadcn UI components imported from `packages/ui` render accurately with the configured Tailwind theme.
- Dark mode configuration is supported utilizing `next-themes`.
- The application correctly resolves imports from internal monorepo packages using workspace aliases.
- No client-side hydration mismatches occur on the root layout.

**Testing Requirements**:

- End-to-end tests using Playwright or Cypress to verify the application loads and renders a basic component.
- Visual regression tests for core Shadcn UI components (Button, Input) to ensure styling consistency.

---

## Task 5: tRPC Core Configuration and API Route

**Description**:
Initialize the `packages/trpc` module to handle type-safe API communication between the Next.js frontend and backend services. This involves setting up the core tRPC instance, defining context creators that inject the BetterAuth session and Drizzle database client, and establishing public and protected procedure middlewares. Finally, set up the Next.js API route handler in `apps/web`.

**Packages Affected**:

- `packages/trpc`
- `apps/web`

**Files Expected**:

- `packages/trpc/src/init.ts`
- `packages/trpc/src/context.ts`
- `packages/trpc/src/routers/index.ts`
- `packages/trpc/src/routers/app.ts`
- `apps/web/src/app/api/trpc/[trpc]/route.ts`
- `apps/web/src/lib/trpc/client.ts`
- `apps/web/src/lib/trpc/Provider.tsx`

**Dependencies**:

- Task 2 (Database Infrastructure)
- Task 3 (Authentication Module)
- Task 4 (Next.js Scaffold)

**Deliverables**:

- A base tRPC router (`appRouter`) exported from `packages/trpc`.
- Protected procedure middlewares that throw `UNAUTHORIZED` if a valid session is not present in the context.
- A React Query + tRPC provider component integrated into the Next.js layout.
- The `api/trpc/[trpc]` Next.js route handler processing incoming requests.

**Acceptance Criteria**:

- The tRPC context successfully instantiates, injecting `session` and `db`.
- Protected procedures correctly reject unauthenticated requests and permit authenticated ones.
- The React Query client correctly fetches data from the Next.js API route without CORS or resolution issues.
- The tRPC client exports fully inferred TypeScript types for the entire API surface area.
- Error handling middleware intercepts database and domain errors, sanitizing them before returning to the client.

**Testing Requirements**:

- Unit tests for the tRPC context creator ensuring correct session extraction from headers.
- Unit tests for the protected procedure middleware verifying unauthorized access throws the correct tRPC error code.

---

## Task 6: Authentication User Interface and Workflows

**Description**:
Implement the user interface and client-side logic for authentication in `apps/web`. This involves building the login, registration, password reset, and magic link pages utilizing Shadcn UI forms, React Hook Form, and Zod for validation. The interface must communicate securely with the BetterAuth endpoints established in Task 3.

**Packages Affected**:

- `apps/web`
- `packages/shared`

**Files Expected**:

- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/components/auth/login-form.tsx`
- `apps/web/src/components/auth/register-form.tsx`
- `packages/shared/src/validators/auth.ts`

**Dependencies**:

- Task 3 (Authentication Module)
- Task 4 (Next.js Scaffold)

**Deliverables**:

- Fully functional authentication pages with client-side validation.
- Integration with BetterAuth client SDK to handle sign-in, sign-up, and OAuth redirects.
- Zod schemas in `packages/shared` defining email and password constraints.

**Acceptance Criteria**:

- Users can successfully register a new account, which is correctly reflected in the database.
- Users can log in utilizing email/password or OAuth (e.g., GitHub).
- Validation errors (e.g., invalid email, weak password) are displayed gracefully beneath input fields.
- Upon successful authentication, users are redirected to the dashboard.
- If a user is already authenticated and visits the login page, they are automatically redirected.

**Testing Requirements**:

- E2E tests simulating user registration, login, and logout flows.
- Unit tests for the Zod validation schemas ensuring edge cases (empty strings, malicious input) are rejected.

---

## Task 7: Workspace Management Service Layer

**Description**:
Implement the backend service layer and tRPC routers for Workspace management. A Workspace represents an organization or tenant within ShipFlow AI. This task involves creating services to create, read, update, and delete workspaces, and managing user roles/memberships within those workspaces. Follow the layering rules: tRPC Router -> Service -> Repository.

**Packages Affected**:

- `packages/services`
- `packages/trpc`
- `packages/db`

**Files Expected**:

- `packages/services/src/workspace/workspace.service.ts`
- `packages/services/src/workspace/workspace.repository.ts`
- `packages/db/src/schema/workspaceMembers.ts`
- `packages/trpc/src/routers/workspace.ts`

**Dependencies**:

- Task 2 (Database Infrastructure)
- Task 5 (tRPC Core)

**Deliverables**:

- `workspace.repository.ts` abstracting database calls for workspace entities.
- `workspace.service.ts` encompassing business logic (e.g., ensuring a user doesn't exceed workspace creation limits).
- `workspaceRouter` integrated into the main tRPC router exposing endpoints like `createWorkspace`, `listWorkspaces`.

**Acceptance Criteria**:

- When a user creates a workspace, a record is added to the `workspaces` table, and the user is automatically added to `workspace_members` with an 'OWNER' role.
- Services enforce authorization; a user can only query workspaces they are a member of.
- The repository layer correctly utilizes transactions when multiple database operations must succeed atomically.
- tRPC router thoroughly validates incoming input payloads using shared Zod schemas.
- Deleting a workspace cascades or handles related records properly to prevent orphan data.

**Testing Requirements**:

- Integration tests for the repository layer verifying correct database mutations.
- Unit tests for the service layer mocking the repository to test business logic and authorization constraints.

---

## Task 8: Dashboard Layout and Navigation

**Description**:
Develop the core authenticated application shell in `apps/web`. This involves constructing a responsive sidebar, a top navigation bar, and user profile dropdowns. The layout must dynamically fetch the user's workspaces and provide a context switcher. It serves as the container for all subsequent application features.

**Packages Affected**:

- `apps/web`
- `packages/ui`

**Files Expected**:

- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/components/layout/sidebar.tsx`
- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/components/workspace/workspace-switcher.tsx`
- `apps/web/src/components/user/user-nav.tsx`

**Dependencies**:

- Task 6 (Auth UI)
- Task 7 (Workspace Service)

**Deliverables**:

- A robust, responsive `(dashboard)` route group layout.
- A functional workspace switcher utilizing the `listWorkspaces` tRPC endpoint.
- User navigation component allowing users to manage settings or log out.

**Acceptance Criteria**:

- The dashboard layout restricts access to unauthenticated users via middleware or higher-order components.
- The sidebar is collapsible on desktop and converts to a drawer/hamburger menu on mobile devices.
- The workspace switcher correctly highlights the currently active workspace.
- Changing the workspace updates the global state or URL structure to scope subsequent API calls.
- UI elements utilize Shadcn UI components seamlessly, adhering to the design system.

**Testing Requirements**:

- Visual tests ensuring responsive behavior across mobile, tablet, and desktop viewports.
- Interaction tests for the workspace switcher ensuring it accurately updates the context.

---

## Task 9: Billing Infrastructure and Stripe/Razorpay Setup

**Description**:
Initialize the `packages/billing` package to handle subscription management. Integrate Razorpay or Stripe to facilitate payment processing. This task involves configuring the SDK, defining subscription tiers (e.g., Free, Pro, Enterprise), and building the webhook handler to listen to subscription status changes from the payment gateway.

**Packages Affected**:

- `packages/billing`
- `apps/web`

**Files Expected**:

- `packages/billing/package.json`
- `packages/billing/src/index.ts`
- `packages/billing/src/client.ts`
- `packages/billing/src/webhooks.ts`
- `apps/web/src/app/api/webhooks/billing/route.ts`
- `packages/shared/src/constants/plans.ts`

**Dependencies**:

- Task 1 (Monorepo Foundation)

**Deliverables**:

- A configured billing client exporting methods to create checkout sessions.
- A Next.js API route functioning as a secure webhook endpoint for the payment gateway.
- Shared constants defining the limits and features of each subscription tier.

**Acceptance Criteria**:

- The billing client initializes securely using environment variables.
- The webhook endpoint accurately verifies cryptographic signatures to ensure requests genuinely originate from the payment gateway.
- Webhook handlers correctly parse payloads for events like `subscription.created`, `subscription.updated`, and `subscription.deleted`.
- Subscription statuses are mapped directly to database fields within the workspace entity.
- Idempotency is implemented to prevent processing the same webhook event multiple times.

**Testing Requirements**:

- Unit tests mocking webhook payloads and verifying correct signature validation and event handling logic.
- Integration testing using CLI tools (like Stripe CLI) to simulate webhook events hitting the local development server.

---

## Task 10: Billing UI and Subscription Management

**Description**:
Create the user interface within the dashboard for users to view their current plan, manage billing details, and upgrade their subscription. This involves building a pricing table component, integrating the checkout session redirect, and displaying usage metrics against plan limits.

**Packages Affected**:

- `apps/web`
- `packages/trpc`
- `packages/services`

**Files Expected**:

- `apps/web/src/app/(dashboard)/[workspaceId]/settings/billing/page.tsx`
- `apps/web/src/components/billing/pricing-cards.tsx`
- `apps/web/src/components/billing/usage-meter.tsx`
- `packages/services/src/billing/billing.service.ts`
- `packages/trpc/src/routers/billing.ts`

**Dependencies**:

- Task 8 (Dashboard Layout)
- Task 9 (Billing Infrastructure)

**Deliverables**:

- A dedicated billing settings page scoped to the current workspace.
- Pricing cards displaying available tiers and features.
- tRPC endpoints to generate checkout URLs and portal session URLs.
- A usage meter component displaying current resource utilization versus tier limits.

**Acceptance Criteria**:

- Clicking "Upgrade" on a pricing card correctly invokes the tRPC mutation and redirects the user to the payment gateway's hosted checkout page.
- Users with active subscriptions see a "Manage Subscription" button redirecting to the customer portal.
- The current plan details and status (e.g., Active, Past Due, Canceled) are accurately retrieved and displayed.
- The UI handles loading states and errors gracefully during checkout session generation.
- Usage metrics dynamically reflect the actual data usage queried from the database.

**Testing Requirements**:

- E2E tests verifying the UI flow from the billing page to the external checkout provider (mocked).
- Component tests for the usage meter ensuring it calculates and displays percentages accurately, including edge cases like 100% usage.

---

## Task 11: Background Jobs Initialization with Inngest

**Description**:
Set up the `packages/workflow` package utilizing Inngest to handle reliable, distributed background jobs and event-driven workflows. This foundational task requires configuring the Inngest client, defining event types, and creating the Next.js API route that serves as the execution endpoint for the Inngest orchestrator.

**Packages Affected**:

- `packages/workflow`
- `apps/web`
- `packages/shared`

**Files Expected**:

- `packages/workflow/package.json`
- `packages/workflow/src/client.ts`
- `packages/workflow/src/events.ts`
- `packages/workflow/src/index.ts`
- `apps/web/src/app/api/inngest/route.ts`

**Dependencies**:

- Task 1 (Monorepo Foundation)

**Deliverables**:

- A strictly typed Inngest client configured with the project's event definitions.
- The `api/inngest/route.ts` file serving the functions to the Inngest platform.
- Exported utility functions to trigger events from anywhere in the monorepo.

**Acceptance Criteria**:

- The Inngest client compiles and enforces type safety based on defined event schemas (e.g., `workspace.created`, `repo.synced`).
- The API route handler successfully registers with the local Inngest development server.
- Firing an event from a tRPC procedure successfully queues a job in the Inngest system.
- The package exposes necessary types and client instances without coupling tightly to Next.js specific logic, ensuring reusability.
- Development scripts are updated to launch the Inngest Dev Server concurrently with Next.js.

**Testing Requirements**:

- Type testing to ensure payload schemas map correctly to event names.
- Integration tests ensuring the Inngest route handler responds correctly to discovery pings.

---

## Task 12: GitHub App Integration and Authentication

**Description**:
Initialize the `packages/github` package to manage the integration with GitHub. Set up the logic for users to authenticate and install a GitHub App to their repositories. This involves handling OAuth exchanges for the GitHub App, securely storing installation tokens, and utilizing Octokit to interact with the GitHub API.

**Packages Affected**:

- `packages/github`
- `packages/db`
- `packages/trpc`
- `apps/web`

**Files Expected**:

- `packages/github/package.json`
- `packages/github/src/client.ts`
- `packages/github/src/auth.ts`
- `packages/db/src/schema/githubInstallations.ts`
- `apps/web/src/app/api/github/callback/route.ts`

**Dependencies**:

- Task 2 (Database Infrastructure)

**Deliverables**:

- Octokit client wrapper configured to authenticate as a GitHub App installation.
- Database schema to store `installationId`, `repositoryIds`, and associated workspace references.
- Callback API route to process the OAuth redirect after a user installs the GitHub App.

**Acceptance Criteria**:

- Users can click an "Install GitHub App" button, which redirects to GitHub's authorization flow.
- The callback route successfully captures the `installation_id`, fetches associated metadata via Octokit, and persists it in the `github_installations` table linked to the current workspace.
- The `packages/github` client can dynamically generate short-lived installation access tokens using a private key to perform API actions.
- The GitHub App private key and Webhook secret are securely loaded via environment variables.
- Duplicate installations for the same workspace are handled gracefully, updating the existing record instead of crashing.

**Testing Requirements**:

- Unit tests mocking the Octokit REST API to verify token generation logic.
- Integration tests for the callback route ensuring the database state is mutated correctly upon receiving an installation payload.

---

## Task 13: Repository Synchronization Workflow

**Description**:
Create a background workflow using Inngest (from Task 11) to synchronize a newly connected GitHub repository's metadata into the local database. When a user connects a repository, a job should be triggered to fetch branches, recent commits, and open pull requests, storing this data for the dashboard to display rapidly.

**Packages Affected**:

- `packages/workflow`
- `packages/services`
- `packages/db`
- `packages/github`

**Files Expected**:

- `packages/workflow/src/functions/github/sync-repository.ts`
- `packages/services/src/repository/repository.service.ts`
- `packages/db/src/schema/repositories.ts`
- `packages/db/src/schema/commits.ts`

**Dependencies**:

- Task 11 (Background Jobs)
- Task 12 (GitHub App Integration)

**Deliverables**:

- Database schemas for `repositories`, `branches`, and `commits`.
- An Inngest function `sync-repository` that listens to a `github.installation.created` or manual sync event.
- Service layer methods utilizing Octokit to paginate through GitHub API results and batch insert them into the database.

**Acceptance Criteria**:

- The Inngest function implements retry logic, ensuring transient GitHub API errors (e.g., rate limits) do not cause permanent failure.
- Pagination is handled correctly, capable of syncing repositories with hundreds of commits.
- Batch inserts are utilized in Drizzle to ensure database performance is optimal during the sync.
- The sync function updates a status field in the database (`SYNCING`, `COMPLETED`, `FAILED`), allowing the UI to reflect real-time progress.
- Incremental syncing is supported, storing a cursor to only fetch commits since the last sync.

**Testing Requirements**:

- End-to-end testing of the workflow using the Inngest test SDK, mocking Octokit responses to ensure the entire pipeline executes.
- Unit tests verifying the batch insert formatting logic in the service layer.

---

## Task 14: Project/Repository Dashboard Interface

**Description**:
Develop the user interface to manage connected repositories within a workspace. This includes listing synced repositories, displaying their sync status, and providing detailed views of recent activity (commits, active branches). This connects the frontend to the data populated by the synchronization workflows in Task 13.

**Packages Affected**:

- `apps/web`
- `packages/trpc`
- `packages/services`

**Files Expected**:

- `apps/web/src/app/(dashboard)/[workspaceId]/projects/page.tsx`
- `apps/web/src/app/(dashboard)/[workspaceId]/projects/[projectId]/page.tsx`
- `apps/web/src/components/project/project-list.tsx`
- `apps/web/src/components/project/sync-status-indicator.tsx`
- `packages/trpc/src/routers/project.ts`

**Dependencies**:

- Task 8 (Dashboard Layout)
- Task 13 (Repository Sync Workflow)

**Deliverables**:

- A robust overview page listing all projects/repositories associated with the workspace.
- A detailed project page showing a timeline of recent commits and branches.
- Real-time or polling mechanisms to update the UI while a synchronization job is in progress.
- tRPC endpoints to query paginated projects and commits.

**Acceptance Criteria**:

- The project list utilizes virtualization or pagination to handle workspaces with numerous repositories efficiently.
- Sync statuses are visually distinct, using animations for "Syncing" and clear error states if a sync fails.
- Users can manually trigger a re-sync from the UI, which executes the corresponding tRPC mutation and queues an Inngest job.
- Empty states are handled gracefully, prompting users to install the GitHub App if no repositories exist.
- Navigation between the workspace overview and detailed project views is instantaneous, leveraging Next.js layout caching.

**Testing Requirements**:

- Component tests for the `sync-status-indicator` ensuring it correctly renders varying states.
- Interaction tests verifying manual sync button triggers the correct mutation and updates the local cache.

---

## Task 15: AI Core Initialization and Provider Setup

**Description**:
Initialize the `packages/ai` module utilizing the Vercel AI SDK. This task establishes the foundational interface for interacting with Large Language Models (LLMs). It involves configuring providers (e.g., OpenAI, Anthropic), defining the standardized input/output interfaces, and implementing a service to manage prompt templates.

**Packages Affected**:

- `packages/ai`
- `packages/shared`

**Files Expected**:

- `packages/ai/package.json`
- `packages/ai/src/index.ts`
- `packages/ai/src/providers.ts`
- `packages/ai/src/prompts/code-review.ts`
- `packages/ai/src/client.ts`

**Dependencies**:

- Task 1 (Monorepo Foundation)

**Deliverables**:

- An AI client wrapper abstracting the specific model implementations, allowing seamless switching between models (e.g., GPT-4o, Claude 3.5 Sonnet).
- Prompt template utilities capable of injecting variables safely.
- Type definitions for expected structured outputs utilizing Zod schemas.

**Acceptance Criteria**:

- The AI client can stream responses or return parsed structured data based on the method invoked.
- Provider API keys are securely retrieved from environment variables.
- System prompts are cleanly separated from user prompts, maintaining rigorous contextual boundaries.
- The module includes fallback logic; if the primary provider experiences downtime, it can automatically route to a secondary provider.
- Telemetry or logging is integrated to track token usage for billing purposes.

**Testing Requirements**:

- Unit tests mocking the AI SDK responses to verify correct parsing of structured outputs against Zod schemas.
- Tests verifying the prompt injection utility accurately replaces template variables without executing malicious input.

---

## Task 16: Automated Code Review Workflow Setup

**Description**:
Implement the core background workflow that performs automated code reviews on GitHub Pull Requests. Utilizing the GitHub integration (Task 12), the Workflow engine (Task 11), and the AI Core (Task 15), this task strings together the logic to listen for a PR event, fetch the diff, analyze it, and post comments back to GitHub.

**Packages Affected**:

- `packages/workflow`
- `packages/services`
- `packages/ai`
- `packages/github`

**Files Expected**:

- `packages/workflow/src/functions/review/process-pr.ts`
- `packages/services/src/review/review.service.ts`
- `apps/web/src/app/api/webhooks/github/route.ts`

**Dependencies**:

- Task 11, 12, 13, 15

**Deliverables**:

- A GitHub webhook endpoint in Next.js to receive `pull_request` events.
- An Inngest function `process-pr` that coordinates the review lifecycle.
- Service methods to map AI analysis results into GitHub inline review comments.

**Acceptance Criteria**:

- The GitHub webhook correctly verifies the HMAC signature using the webhook secret.
- When a PR is opened or synchronized, the webhook triggers the `process-pr` Inngest event.
- The workflow fetches the PR diff, chunks it intelligently if it exceeds the LLM context window, and passes it to the `packages/ai` module.
- The AI's response is parsed, and Octokit is utilized to post inline comments precisely on the offending lines in the PR.
- The system prevents spamming by not reviewing the same commit hash twice.

**Testing Requirements**:

- Comprehensive integration tests simulating a GitHub webhook payload, mocking the AI response, and asserting the Octokit create review comment method is called with precise parameters.
- Unit tests for the diff chunking logic to ensure large files don't violate context limits.

---

## Task 17: Review Configuration and Rules Engine

**Description**:
Create a configuration engine allowing users to define specific rules and focus areas for the AI Code Reviewer at the workspace or project level. This involves creating the database schema to store rules (e.g., "Enforce strict TypeScript typing," "Check for SQL injection vulnerabilities") and injecting these rules dynamically into the AI prompt during the review workflow.

**Packages Affected**:

- `packages/db`
- `packages/services`
- `packages/ai`
- `packages/trpc`

**Files Expected**:

- `packages/db/src/schema/reviewRules.ts`
- `packages/services/src/rules/rules.service.ts`
- `packages/trpc/src/routers/rules.ts`
- `packages/ai/src/prompts/context-builder.ts`

**Dependencies**:

- Task 16 (Automated Code Review Workflow)

**Deliverables**:

- Database schema representing custom rules associated with a repository.
- CRUD operations via tRPC for users to manage these rules.
- A context builder utility in `packages/ai` that prepends active rules to the system prompt prior to execution.

**Acceptance Criteria**:

- Users can create, update, enable, disable, and delete rules via the API.
- The `process-pr` workflow fetches all active rules for the repository and seamlessly injects them into the AI context.
- The prompt engineering guarantees the LLM strictly adheres to user-defined rules over general programming advice.
- Limits are enforced on the number of rules per project to prevent prompt bloating.
- Rules can be defined utilizing specific categories (Security, Performance, Style).

**Testing Requirements**:

- Unit tests for the context builder ensuring rules are formatted and appended correctly to the system prompt.
- Integration tests ensuring the workflow queries and applies the latest rules state during a review.

---

## Task 18: Code Review Settings Interface

**Description**:
Develop the user interface where developers manage the review configurations created in Task 17. This includes a robust forms interface to add new rules, toggle existing ones, and set global review thresholds (e.g., "Only review PRs with specific labels").

**Packages Affected**:

- `apps/web`

**Files Expected**:

- `apps/web/src/app/(dashboard)/[workspaceId]/projects/[projectId]/settings/page.tsx`
- `apps/web/src/components/rules/rule-list.tsx`
- `apps/web/src/components/rules/create-rule-dialog.tsx`
- `apps/web/src/components/settings/review-preferences.tsx`

**Dependencies**:

- Task 14 (Project Dashboard)
- Task 17 (Rules Engine)

**Deliverables**:

- A settings tab within the detailed project view.
- An interactive list allowing drag-and-drop prioritization of review rules.
- A dialog/modal utilizing React Hook Form and Zod to create specific textual rules.
- Toggles for general preferences like auto-approval if no issues are found.

**Acceptance Criteria**:

- The UI accurately lists all rules fetched from the tRPC endpoint.
- Optimistic UI updates are applied when toggling rule statuses to ensure a snappy user experience.
- The create rule dialog validates length and character constraints to prevent abusive prompts.
- Changes are persisted reliably to the database.
- Clear error states and toast notifications guide the user upon success or failure of mutations.

**Testing Requirements**:

- E2E tests verifying a user can navigate to settings, create a rule, and see it persist after a page reload.
- Component tests for the rule creation form verifying validation logic triggers appropriately.

---

## Task 19: Real-time Review Status Updates via WebSockets/SSE

**Description**:
Implement real-time updates to the dashboard so users can view the progress of a code review instantaneously without refreshing. Since Inngest handles the workflow asynchronously, Server-Sent Events (SSE) or WebSockets must be established to push status changes (e.g., "Queued", "Analyzing", "Commenting", "Completed") to the connected frontend clients.

**Packages Affected**:

- `apps/web`
- `packages/services`
- `packages/workflow`

**Files Expected**:

- `apps/web/src/app/api/sse/reviews/route.ts`
- `apps/web/src/hooks/use-review-status.ts`
- `packages/services/src/realtime/emitter.ts`

**Dependencies**:

- Task 16 (Automated Code Review Workflow)

**Deliverables**:

- An SSE endpoint in Next.js managing active client connections.
- A publisher utility in the backend to broadcast events.
- A React hook `useReviewStatus` to consume the SSE stream and update local component state.

**Acceptance Criteria**:

- The SSE connection authenticates the user, ensuring they only receive updates for their workspace.
- The `process-pr` Inngest workflow emits status updates at distinct stages of the review lifecycle.
- The dashboard UI updates dynamically as events stream in, showing progress bars or status badges.
- Connections gracefully reconnect upon unexpected drops, preventing missed events.
- Memory leaks are strictly prevented by properly closing SSE connections when clients disconnect.

**Testing Requirements**:

- Integration tests ensuring the emitter successfully broadcasts messages to active streams.
- Client-side tests verifying the hook properly parses incoming SSE messages and updates state.

---

## Task 20: Audit Logging and Usage Tracking

**Description**:
Implement an extensive audit logging system tracking critical actions within the platform (e.g., User logins, Workspace modifications, PR reviews initiated). Simultaneously, track detailed token usage generated by the AI module to facilitate billing. This data must be robustly stored and queried.

**Packages Affected**:

- `packages/db`
- `packages/services`
- `packages/ai`

**Files Expected**:

- `packages/db/src/schema/auditLogs.ts`
- `packages/db/src/schema/usageMetrics.ts`
- `packages/services/src/audit/audit.service.ts`
- `packages/services/src/metrics/metrics.service.ts`

**Dependencies**:

- Task 2 (Database Infrastructure)
- Task 15 (AI Core)

**Deliverables**:

- Database tables designed for high-volume insertions (`audit_logs`, `usage_metrics`).
- Middleware or utility functions wrapping critical tRPC procedures to automatically log actions.
- Integration within the `packages/ai` client to intercept token counts and write them to the usage table.

**Acceptance Criteria**:

- Every significant mutation (Create, Update, Delete) logs the actor (user ID), action, entity affected, and a timestamp.
- The AI client reliably captures prompt and completion tokens for every LLM request, associating them with the specific workspace and project.
- Data insertions utilize asynchronous, non-blocking methods to ensure they do not degrade the performance of the primary user requests.
- The schema is optimized with appropriate indexes (e.g., by workspaceId and date) to allow fast querying for billing aggregation.
- Audit logs are immutable; the API must not expose endpoints capable of modifying or deleting historical logs.

**Testing Requirements**:

- Unit tests ensuring the AI wrapper correctly extracts token counts from various provider response formats.
- Integration tests verifying that invoking a protected tRPC mutation results in a corresponding row in the `audit_logs` table.

# SECTION 13 — TASK BREAKDOWN (Part 2/2)

This document contains the extremely detailed technical tasks from 21 to 40 for the ShipFlow AI platform. These tasks cover the integration of AI agents using the Vercel AI SDK, asynchronous background processing via Inngest, robust GitHub integrations using Octokit, billing infrastructure using Razorpay, complex frontend implementations using Next.js and Shadcn UI, and final production deployment strategies.

---

### Task 21: Setup Inngest Client and Core Infrastructure

**Description:**
Initialize and configure the Inngest client within the `packages/workflow` workspace to serve as the backbone for all asynchronous background processing across the ShipFlow platform. Given the nature of our application—which relies heavily on long-running AI operations and resilient third-party webhook handling—a robust background job queue is absolutely critical. This task entails creating the Inngest client instance, setting up the API route handler in the Next.js application (`apps/web/src/app/api/inngest/route.ts`), and implementing the foundational event schemas. The event schemas must be strictly typed using Zod to ensure runtime safety when events are dispatched. Furthermore, you will need to establish a shared utility layer for dispatching events from our tRPC routers securely.

**Packages affected:**

- `packages/workflow`
- `apps/web`
- `packages/shared`

**Files expected:**

- `packages/workflow/src/client.ts`
- `packages/workflow/src/events.ts`
- `packages/workflow/src/index.ts`
- `apps/web/src/app/api/inngest/route.ts`

**Dependencies:**

- Task 5 (Database Schema Setup)
- Task 8 (tRPC Setup)

**Deliverables:**

- A functional Inngest client exported from the workflow package.
- An operational Inngest API endpoint within the Next.js application.
- Fully typed Zod schemas for the initial domain events (e.g., `github.webhook.received`, `ai.analysis.requested`).

**Acceptance Criteria:**

- The Inngest client must successfully authenticate using environment variables `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.
- The Next.js API route must correctly process incoming requests from the Inngest executor and return 200 OK statuses.
- All event payloads must be validated at runtime against their respective Zod schemas; invalid payloads must throw descriptive errors before entering the workflow queue.
- The Inngest Dev Server must be capable of discovering the local Next.js endpoint when running `npm run dev`.
- Event dispatchers must accurately infer TypeScript types based on the event name.

**Testing Requirements:**

- **Unit Testing:** Write tests to ensure event schemas correctly validate valid payloads and reject invalid payloads.
- **Integration Testing:** Simulate dispatching an event locally to ensure the Next.js endpoint correctly parses the Inngest payload.
- **End-to-End Testing:** Trigger a mock event using the Inngest Dev UI and assert that an empty workflow function executes without errors.

---

### Task 22: GitHub App Webhook Integration (PR Opened/Synchronized)

**Description:**
Implement the GitHub App webhook receiver in the Next.js application to listen for `pull_request` events, specifically the `opened` and `synchronize` actions. This is a critical ingestion point for the platform, as it triggers the entire AI code review pipeline. The implementation requires verifying the webhook signature using the GitHub App secret to ensure the payload is authentic and hasn't been tampered with. Once verified, the webhook handler should parse the payload, extract relevant repository and PR metadata, and dispatch an Inngest event (e.g., `github.pr.opened`) for asynchronous processing. This ensures the Next.js API route responds to GitHub within the required 10-second timeout window, preventing webhook delivery failures.

**Packages affected:**

- `apps/web`
- `packages/github`
- `packages/workflow`

**Files expected:**

- `apps/web/src/app/api/webhooks/github/route.ts`
- `packages/github/src/webhooks/verify.ts`
- `packages/github/src/webhooks/parsers.ts`

**Dependencies:**

- Task 21 (Setup Inngest Client)
- GitHub App Registration (External)

**Deliverables:**

- A secure webhook endpoint at `/api/webhooks/github`.
- A cryptographic signature verification utility.
- Successful dispatch of typed Inngest events based on GitHub webhook payloads.

**Acceptance Criteria:**

- The endpoint must aggressively reject requests missing the `x-hub-signature-256` header with a 401 Unauthorized status.
- The signature verification logic must use the `crypto` module to accurately compare the calculated HMAC SHA-256 signature with the header provided by GitHub.
- Requests with invalid signatures must be rejected with a 401 status to prevent spoofing.
- Valid requests must be parsed, and essential metadata (PR number, repository full name, installation ID, commit SHA) must be extracted safely.
- The handler must dispatch an event to Inngest and return a 202 Accepted status within 3 seconds, well below GitHub's 10-second limit.
- The handler must be resilient to unknown event types and simply return a 200 OK without processing them further.

**Testing Requirements:**

- **Unit Testing:** Write comprehensive tests for the signature verification utility using known good payloads and signatures.
- **Integration Testing:** Mock the Inngest client to ensure it is called with the correct event payload when a valid webhook request is simulated.
- **Security Testing:** Ensure timing attacks are mitigated by using `crypto.timingSafeEqual` during signature comparison.

---

### Task 23: Core AI SDK Setup & Prompt Engineering Foundation

**Description:**
Establish the foundation for all AI features by integrating the Vercel AI SDK into the `packages/ai` workspace. This task involves configuring the core language model providers (e.g., OpenAI, Anthropic) based on environment configurations, ensuring secure API key management, and creating a structured prompt engineering system. Instead of hardcoding prompts throughout the codebase, you will create a centralized prompt registry that utilizes template literals and context injection. Furthermore, you must define the base system prompts that define the personas of our various AI agents (e.g., Senior Code Reviewer, Technical Product Manager). This layer must also include retry mechanisms, timeout configurations, and token usage tracking utilities.

**Packages affected:**

- `packages/ai`

**Files expected:**

- `packages/ai/src/client.ts`
- `packages/ai/src/prompts/system.ts`
- `packages/ai/src/prompts/templates.ts`
- `packages/ai/src/utils/token-tracker.ts`

**Dependencies:**

- Monorepo Setup

**Deliverables:**

- A unified AI client interface abstracting the underlying provider (Vercel AI SDK wrappers).
- A centralized prompt repository with versioning and context-aware templating.
- Token tracking utilities to monitor usage for billing purposes.

**Acceptance Criteria:**

- The AI client must instantiate successfully using the primary API key (e.g., `OPENAI_API_KEY`) and fallback gracefully if secondary providers are configured.
- The prompt registry must allow injecting dynamic variables (like code diffs or commit messages) into templates securely.
- System prompts must explicitly instruct the AI to return structured outputs (JSON) where necessary, mitigating hallucination risks.
- The client must wrap generation calls in logic that catches rate limits (429 errors) and applies exponential backoff retries.
- Every successful AI generation must calculate and return the exact token usage (prompt tokens, completion tokens) for downstream billing integration.

**Testing Requirements:**

- **Unit Testing:** Validate prompt templating logic with various string inputs to ensure no injection vulnerabilities.
- **Integration Testing:** Create mock providers within the AI SDK to simulate responses and verify the token tracking calculations.
- **Error Handling Testing:** Simulate API timeouts and 429 errors to ensure the retry mechanism functions as intended.

---

### Task 24: AI Code Review Agent Implementation

**Description:**
Develop the "Code Review Agent" within the `packages/ai` workspace. This agent is the crown jewel of the platform. It takes a unified diff of a pull request, alongside relevant file context, and generates a comprehensive, line-by-line code review. The agent must be capable of identifying security vulnerabilities, performance bottlenecks, architectural anti-patterns, and stylistic inconsistencies. You will utilize the `generateObject` function from the Vercel AI SDK alongside a strict Zod schema to ensure the AI's output is structured as an array of review comments, each containing a file path, line number, severity level, and markdown-formatted feedback. This task requires intense prompt engineering to strike the right balance between being overly pedantic and dangerously permissive.

**Packages affected:**

- `packages/ai`
- `packages/shared`

**Files expected:**

- `packages/ai/src/agents/code-reviewer/index.ts`
- `packages/ai/src/agents/code-reviewer/schema.ts`
- `packages/ai/src/agents/code-reviewer/prompt.ts`

**Dependencies:**

- Task 23 (Core AI SDK Setup)

**Deliverables:**

- The Code Review Agent service class/function.
- Zod schema defining the strict output structure for code reviews.
- Specialized system prompts tuned for high-quality software engineering feedback.

**Acceptance Criteria:**

- The agent must accept a large string containing the git diff, along with metadata such as language/framework context.
- The agent must consistently return a well-formed JSON object matching the `CodeReviewResultSchema`.
- The output schema must enforce fields: `filePath` (string), `lineNumber` (number or null for general comments), `severity` (enum: 'critical', 'warning', 'suggestion'), and `comment` (string).
- The agent must gracefully handle diffs that exceed the context window by implementing a chunking strategy or truncation mechanism.
- The generated comments must be actionable and objective, avoiding subjective formatting complaints if they conflict with standard linters like Prettier.

**Testing Requirements:**

- **Unit Testing:** Validate the output schema against various mock JSON payloads to ensure strictness.
- **Integration Testing:** Run the agent against pre-defined, static diffs (containing known bugs) using a real LLM call (in a controlled test environment) to evaluate the quality and accuracy of the generated review.
- **Edge Case Testing:** Pass empty diffs, enormous diffs, and malformed diffs to ensure the agent does not crash.

---

### Task 25: GitHub PR Commenting Integration for Code Review

**Description:**
Implement the GitHub integration layer responsible for posting the AI-generated code review comments back to the originating Pull Request. Within `packages/github`, use the `@octokit/rest` client, authenticated as the GitHub App installation, to create inline review comments on specific lines of code. This task is highly complex because GitHub's API requires strict adherence to commit SHAs and line numbers relative to the diff. You must translate the output of the AI Code Review Agent (Task 24) into the exact format expected by the `octokit.rest.pulls.createReview` API endpoint. The system must also be capable of updating existing reviews or dismissing outdated AI comments when new commits are pushed.

**Packages affected:**

- `packages/github`

**Files expected:**

- `packages/github/src/services/pr-reviewer.ts`
- `packages/github/src/utils/diff-mapper.ts`

**Dependencies:**

- Task 24 (AI Code Review Agent)
- GitHub App authentication utilities.

**Deliverables:**

- A service function to publish inline pull request reviews.
- A utility to map AI-generated line numbers to GitHub diff positions.

**Acceptance Criteria:**

- The service must successfully authenticate using an Installation Access Token scoped to the specific repository.
- The service must aggregate individual AI comments into a single cohesive GitHub Review to minimize notification spam for the user.
- Comments must be accurately placed on the correct `line` and `side` (RIGHT for additions, LEFT for deletions) within the PR diff.
- If an AI comment targets a line that is outside the bounds of the PR diff (a common AI hallucination), the service must catch this error and post it as a general PR comment instead of failing the entire review.
- The review submission must include an overarching summary comment detailing the general health of the PR.
- The service must include robust error handling for API rate limits and network instability.

**Testing Requirements:**

- **Integration Testing:** Mock the Octokit client and verify that the `createReview` API is called with the correctly shaped payload based on mock AI outputs.
- **Unit Testing:** Rigorously test the diff position mapping logic with complex diffs (multiple hunks, overlapping changes) to ensure comments aren't rejected by GitHub's API.

---

### Task 26: Asynchronous PR Analysis Workflow via Inngest

**Description:**
Tie together the GitHub webhook reception, the AI code review generation, and the GitHub commenting system into a unified, resilient asynchronous workflow using Inngest. Inside `packages/workflow`, create the `analyzePullRequest` workflow function. This function will be triggered by the `github.pr.opened` or `github.pr.synchronized` events. The workflow must define explicit "steps" using Inngest's `step.run` mechanism to ensure state is preserved and retries are handled cleanly. The workflow will: 1) Fetch the raw diff from GitHub, 2) Pass the diff to the AI Code Review Agent, 3) Track token usage and update the database, 4) Post the review to GitHub. This orchestrates the core value proposition of the SaaS.

**Packages affected:**

- `packages/workflow`
- `packages/db`

**Files expected:**

- `packages/workflow/src/workflows/analyze-pr.ts`
- `packages/workflow/src/index.ts` (exporting the new workflow)

**Dependencies:**

- Task 21, 22, 24, 25

**Deliverables:**

- A fully functional, resilient Inngest workflow orchestrating the PR analysis lifecycle.

**Acceptance Criteria:**

- The workflow must declare appropriate concurrency limits based on the user's subscription tier to prevent abuse.
- Each distinct operation (fetching diff, AI generation, posting review) must be wrapped in a separate `step.run` to allow independent retries if a specific external API fails.
- If the AI generation step fails, the workflow must retry with exponential backoff up to 3 times before marking the job as failed.
- Upon successful completion, the workflow must write a record to the `db.analysisRuns` table, recording the PR metadata, execution duration, and total token usage.
- The workflow must check the database prior to execution to ensure the organization has not exceeded its monthly usage limits; if exceeded, the workflow must terminate early and post a warning comment on the PR.

**Testing Requirements:**

- **E2E Testing:** Use the Inngest testing utilities to simulate a full workflow execution from start to finish, mocking the external Octokit and AI SDK calls, ensuring state transitions and database writes occur correctly.
- **Failure Scenario Testing:** Force a failure in the GitHub posting step and ensure the workflow pauses and retries without re-running the expensive AI generation step.

---

### Task 27: AI Planning Agent for Ticket Generation

**Description:**
Develop a specialized AI agent designed to ingest unstructured project requirements (e.g., a brief description of a feature or a raw transcript from a meeting) and decompose them into structured, actionable engineering tasks or Jira/Linear-style tickets. This agent resides in `packages/ai` and focuses heavily on breaking down complexity. It must output a JSON array of tasks, where each task includes a title, technical description, estimated complexity (story points), and acceptance criteria. This feature will power the "Auto-Plan" button in the frontend dashboard.

**Packages affected:**

- `packages/ai`
- `packages/shared`

**Files expected:**

- `packages/ai/src/agents/planner/index.ts`
- `packages/ai/src/agents/planner/schema.ts`
- `packages/ai/src/agents/planner/prompt.ts`

**Dependencies:**

- Task 23 (Core AI SDK Setup)

**Deliverables:**

- The Planning Agent service.
- Strict Zod schema for generating engineering tickets.
- Specialized prompts mimicking a seasoned Technical Product Manager.

**Acceptance Criteria:**

- The agent must accept arbitrary length strings containing requirements.
- The output must strictly adhere to the defined Zod schema, ensuring no missing fields like `acceptanceCriteria`.
- The generated tasks must be logically sequential and avoid massive overlapping scopes (e.g., it shouldn't create a single task to "build the entire backend").
- The system prompt must instruct the model to favor technical specificity over vague business language.
- The agent must return an array of at least 3 tasks for any non-trivial requirement input.

**Testing Requirements:**

- **Unit Testing:** Validate the output schema against mock JSON.
- **Integration Testing:** Provide a sample requirement (e.g., "Build a user login system with MFA") and verify the AI outputs distinct tasks for UI, backend auth, and database schema updates.

---

### Task 28: AI Summarization Agent for Release Notes

**Description:**
Create the Summarization Agent within `packages/ai` responsible for analyzing a collection of merged Pull Requests and generating polished, user-facing release notes. This agent takes an array of PR titles, descriptions, and commit messages, and synthesizes them into a coherent changelog categorized into "Features", "Bug Fixes", and "Chores". The agent must be capable of filtering out internal noise (e.g., "bump dependencies") and focusing on value delivered to the end-user. It will format the output as clean Markdown.

**Packages affected:**

- `packages/ai`

**Files expected:**

- `packages/ai/src/agents/summarizer/index.ts`
- `packages/ai/src/agents/summarizer/prompt.ts`

**Dependencies:**

- Task 23 (Core AI SDK Setup)

**Deliverables:**

- The Release Note Summarization service.
- Prompts designed to extract user value from technical commits.

**Acceptance Criteria:**

- The agent must successfully process arrays containing up to 50 PR metadata objects.
- The output must be formatted as Markdown, utilizing appropriate headers and bullet points.
- The agent must accurately categorize changes based on semantic meaning, not just conventional commit prefixes.
- The agent must automatically ignore trivial PRs (e.g., minor typo fixes in readmes) unless specifically instructed to include them.
- The output must maintain a professional, engaging tone suitable for a public changelog.

**Testing Requirements:**

- **Integration Testing:** Feed a static list of 10 mock PRs to the agent and assert that the resulting markdown contains the appropriate categories and filters out the 2 "chore" PRs included in the mock data.

---

### Task 29: Release Note Generation Workflow Integration

**Description:**
Implement the Inngest workflow that orchestrates the release note generation process. This workflow will be manually triggered by a user from the web dashboard or automatically triggered via a webhook when a GitHub Release is published. The workflow will utilize Octokit to fetch all merged PRs since the last release tag, pass that data to the Summarization Agent (Task 28), and then either save the draft to the database or directly update the GitHub Release body via the API.

**Packages affected:**

- `packages/workflow`
- `packages/github`

**Files expected:**

- `packages/workflow/src/workflows/generate-release-notes.ts`

**Dependencies:**

- Task 28 (AI Summarization Agent)
- Task 21 (Inngest Setup)

**Deliverables:**

- Inngest workflow for fetching PRs and generating release notes.
- Octokit utilities for fetching commit history between tags.

**Acceptance Criteria:**

- The workflow must accurately identify the previous release tag and fetch only the PRs merged since that timestamp.
- The step fetching PRs must handle GitHub pagination correctly, fetching all results even if there are hundreds of PRs.
- The data passed to the AI must be sanitized to remove overly verbose diffs, sending only titles and descriptions to conserve token usage.
- Upon generation, the workflow must successfully update the GitHub Release entity via the API.
- If triggered manually via the dashboard, the workflow must stream progress updates or save the result to the database for the user to review before publishing.

**Testing Requirements:**

- **Integration Testing:** Mock the Octokit pagination responses to ensure all pages are processed.
- **E2E Testing:** Simulate a manual trigger event and trace the workflow through to the database persistence step.

---

### Task 30: Billing Core System & Razorpay Setup

**Description:**
Establish the foundation for the platform's monetization strategy by integrating Razorpay into the `packages/billing` workspace. This involves setting up the Razorpay Node.js SDK, securely configuring API keys, and defining the core domain models for subscriptions, plans, and invoices within the Drizzle schema. This is a critical security and compliance task. You must ensure that sensitive data is handled properly and that the architecture supports future expansion to other payment gateways if necessary.

**Packages affected:**

- `packages/billing`
- `packages/db`

**Files expected:**

- `packages/billing/src/client.ts`
- `packages/db/src/schema/billing.ts`
- `packages/billing/src/config/plans.ts`

**Dependencies:**

- Task 5 (Database Schema Setup)

**Deliverables:**

- Configured Razorpay client.
- Drizzle schema tables: `subscriptions`, `invoices`, `usage_records`.
- Centralized configuration file defining the platform's pricing tiers (Free, Pro, Enterprise).

**Acceptance Criteria:**

- The Razorpay client must initialize securely using `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` without exposing them to the client-side.
- The Drizzle schema must include a `subscriptions` table linked to the `organizations` table, tracking status (active, past_due, canceled), plan_id, and current_period_end.
- The pricing plans configuration must define exact feature limits (e.g., max PRs analyzed per month) associated with each tier.
- All monetary values in the database must be stored in the smallest currency unit (e.g., paise for INR, cents for USD) to avoid floating-point inaccuracies.

**Testing Requirements:**

- **Unit Testing:** Validate that the pricing plan configurations load correctly and contain valid tier identifiers.
- **Database Testing:** Write Drizzle schema tests to ensure foreign key constraints between organizations and subscriptions are enforced.

---

### Task 31: Subscription Tier Management Service

**Description:**
Develop the internal services within `packages/billing` required to manage the lifecycle of a customer's subscription. This includes functions to create Razorpay checkout sessions, upgrade/downgrade plans, cancel subscriptions, and retrieve the current billing status for an organization. This service layer acts as the intermediary between our tRPC routers and the Razorpay API, abstracting away the specifics of the payment gateway from the rest of the application.

**Packages affected:**

- `packages/billing`

**Files expected:**

- `packages/billing/src/services/subscription.ts`
- `packages/billing/src/services/checkout.ts`

**Dependencies:**

- Task 30 (Billing Core System)

**Deliverables:**

- Service functions for creating Razorpay Orders/Subscriptions.
- Logic for computing prorated upgrades and downgrades.
- Service function to query active feature entitlements based on the current plan.

**Acceptance Criteria:**

- The checkout service must generate a Razorpay Order ID securely and return it to the client for frontend processing.
- The subscription service must correctly map our internal plan IDs to Razorpay Plan IDs.
- When an organization requests a cancellation, the service must update the database to reflect that the subscription will end at the current billing cycle, preventing immediate loss of access.
- The entitlement query function must quickly and accurately return true/false when asked if an organization has access to a specific feature (e.g., `canAccessAIPlanner(orgId)`).
- Error handling must gracefully manage Razorpay API timeouts and invalid card errors.

**Testing Requirements:**

- **Integration Testing:** Mock the Razorpay SDK to ensure the correct payload is sent when creating a subscription order.
- **Unit Testing:** Rigorously test the entitlement logic against organizations with various mocked subscription statuses (active, canceled, past_due).

---

### Task 32: Razorpay Webhook Handler Implementation

**Description:**
Implement the critical webhook endpoint that receives asynchronous notifications from Razorpay regarding payment success, subscription renewals, and failed charges. This handler, located in `apps/web/src/app/api/webhooks/razorpay/route.ts`, must verify the Razorpay signature to prevent fraud, and then dispatch events to Inngest to handle the database updates. This asynchronous decoupling ensures that the webhook endpoint responds rapidly to Razorpay, preventing webhook retries and potential duplicate processing.

**Packages affected:**

- `apps/web`
- `packages/workflow`
- `packages/billing`

**Files expected:**

- `apps/web/src/app/api/webhooks/razorpay/route.ts`
- `packages/workflow/src/workflows/billing-sync.ts`

**Dependencies:**

- Task 30 (Billing Core System)
- Task 21 (Inngest Setup)

**Deliverables:**

- Secure Razorpay webhook API endpoint.
- Signature verification utility.
- Inngest workflows to process `subscription.charged`, `subscription.cancelled`, and `payment.failed` events.

**Acceptance Criteria:**

- The API route must use `crypto.createHmac` to verify the `x-razorpay-signature` header against the raw request body.
- Invalid signatures must result in an immediate 400 Bad Request response.
- Valid requests must be parsed, and a strongly typed event (e.g., `billing.payment.success`) must be dispatched to Inngest.
- The Inngest workflow must idempotently update the `subscriptions` table in the database, extending the `current_period_end` upon a successful charge.
- If a payment fails, the workflow must update the subscription status to `past_due` and potentially trigger an email notification to the organization owner.

**Testing Requirements:**

- **Unit Testing:** Test the webhook signature verification using sample payloads and secrets provided in Razorpay's documentation.
- **E2E Testing:** Simulate a webhook event through the Next.js API, verifying that the database is updated correctly by the background Inngest worker.

---

### Task 33: Usage Tracking and Enforcement Service

**Description:**
Implement a robust mechanism to track the consumption of resources (specifically AI tokens and PR analysis counts) and enforce the limits defined by the organization's subscription tier. This service, spanning `packages/billing` and `packages/db`, acts as the gatekeeper. Every time an AI agent is executed, this service must record the usage and decrement the available quota. If the quota is exceeded, the service must block further executions and prompt the user to upgrade.

**Packages affected:**

- `packages/billing`
- `packages/db`

**Files expected:**

- `packages/billing/src/services/usage.ts`

**Dependencies:**

- Task 30 (Billing Core System)
- Task 26 (Asynchronous PR Analysis Workflow)

**Deliverables:**

- High-performance functions to increment usage counters.
- Gatekeeping middleware/functions to check remaining limits before expensive operations.
- Scheduled task (cron job via Inngest) to reset usage limits at the start of a new billing cycle.

**Acceptance Criteria:**

- The usage tracking function must utilize database transactions or atomic increments (e.g., Drizzle's `sql` operator) to prevent race conditions during concurrent PR analyses.
- The limit checking function must be highly optimized, ideally caching the current usage state in Redis or memory to prevent database bottlenecks on every request.
- When an organization hits 90% of their limit, the system should trigger an event to notify the user.
- When the limit is reached, the service must reliably block further API calls and return a specific `QuotaExceededError`.
- The monthly reset cron job must accurately reset counters for all active subscriptions precisely on their billing anniversary date.

**Testing Requirements:**

- **Concurrency Testing:** Simulate 50 concurrent requests trying to consume a quota of 10 to ensure the atomic increments prevent the limit from being bypassed.
- **Integration Testing:** Verify the reset cron job correctly zeroes out usage for a mocked set of organizations.

---

### Task 34: Billing Frontend UI & Checkout Flow

**Description:**
Build the user-facing billing management interfaces within the Next.js application (`apps/web`). This involves creating a comprehensive "Billing & Plans" settings page where users can view their current usage, upgrade their subscription, and manage their payment methods. This task requires integrating the Razorpay Checkout script dynamically and handling the frontend lifecycle of a payment transaction, ensuring a seamless and visually polished experience using Shadcn UI components.

**Packages affected:**

- `apps/web`
- `packages/ui`

**Files expected:**

- `apps/web/src/app/(dashboard)/org/[slug]/settings/billing/page.tsx`
- `apps/web/src/components/billing/pricing-cards.tsx`
- `apps/web/src/components/billing/usage-progress.tsx`

**Dependencies:**

- Task 31 (Subscription Tier Management)
- Task 16 (Shadcn UI Setup)

**Deliverables:**

- A responsive pricing page detailing features of Free, Pro, and Enterprise tiers.
- Integration of the Razorpay Checkout modal.
- Visual progress bars showing current month's API usage vs. limits.
- A table displaying past invoice history.

**Acceptance Criteria:**

- The pricing cards must dynamically reflect the configuration defined in `packages/billing/src/config/plans.ts`.
- Clicking "Upgrade" must securely fetch an Order ID via tRPC and launch the Razorpay Checkout modal without reloading the page.
- The UI must handle Razorpay's success and failure callbacks, showing appropriate toast notifications (using `sonner` or similar) to the user.
- The usage progress bar must accurately display remaining quota and change color (e.g., to red) when approaching the limit.
- The page must be fully responsive, stacking pricing cards neatly on mobile devices.
- Invoice history must be fetched via tRPC and displayed in a paginated, accessible data table.

**Testing Requirements:**

- **Component Testing:** Verify the progress bar logic renders correctly at 0%, 50%, and 100% capacity.
- **E2E Testing:** Use Playwright/Cypress to click the upgrade button, mock the Razorpay script injection, and assert the success state is reached.

---

### Task 35: Project Settings & Team Member Management UI

**Description:**
Develop the organizational management interface allowing administrators to manage their team members, configure GitHub repository access, and adjust project-level AI settings. This page resides within the dashboard and interacts deeply with the BetterAuth access control layer. You must implement features to invite new users via email, assign roles (Admin, Member, Viewer), and revoke access. Additionally, provide a UI to link or unlink specific GitHub repositories to the ShipFlow platform.

**Packages affected:**

- `apps/web`
- `packages/auth`

**Files expected:**

- `apps/web/src/app/(dashboard)/org/[slug]/settings/members/page.tsx`
- `apps/web/src/app/(dashboard)/org/[slug]/settings/integrations/page.tsx`
- `apps/web/src/components/settings/member-list.tsx`
- `apps/web/src/components/settings/repo-selector.tsx`

**Dependencies:**

- Task 6 (BetterAuth Setup)
- Task 14 (tRPC API implementation)

**Deliverables:**

- Member management dashboard with role selection.
- Email invitation workflow UI.
- GitHub integration settings page displaying connected repositories.

**Acceptance Criteria:**

- The member list must display all active users, their roles, and their avatar images.
- Administrators must be able to change a user's role via a dropdown menu, immediately updating the database via a tRPC mutation.
- The invitation form must validate email addresses on the client-side and display clear error messages if the user is already in the organization.
- Non-admin users attempting to access the settings page must be redirected to the main dashboard or shown an unauthorized message.
- The repository selector must fetch available repositories from the GitHub API (via tRPC) and allow admins to toggle ShipFlow AI access per repository.
- Changes to AI settings (e.g., "Strictness Level") must be saved optimistically for a snappy user experience.

**Testing Requirements:**

- **E2E Testing:** Log in as an Admin, invite a new test email, verify the member list updates optimistically, and ensure a non-admin user cannot access the page.

---

### Task 36: Dashboard Frontend Implementation

**Description:**
Construct the primary landing dashboard for logged-in users. This page (`apps/web/src/app/(dashboard)/org/[slug]/page.tsx`) acts as the command center, providing a high-level overview of the organization's engineering velocity and AI interactions. It should aggregate data across all connected repositories. The dashboard must feature key metrics (e.g., PRs analyzed, critical bugs found, time saved), a feed of recent AI activity, and quick actions (like triggering a release note generation). This task requires complex data fetching via tRPC and sophisticated UI composition.

**Packages affected:**

- `apps/web`
- `packages/ui`

**Files expected:**

- `apps/web/src/app/(dashboard)/org/[slug]/page.tsx`
- `apps/web/src/components/dashboard/stat-cards.tsx`
- `apps/web/src/components/dashboard/activity-feed.tsx`
- `apps/web/src/components/dashboard/charts.tsx`

**Dependencies:**

- Task 16 (Shadcn UI Setup)
- Task 14 (tRPC API implementation)

**Deliverables:**

- A visually striking, data-rich dashboard.
- Recharts or similar library integration for metric visualization.
- Real-time or polling-based activity feed of recent PR reviews.

**Acceptance Criteria:**

- The dashboard must load critical data (stat cards) within 500ms, utilizing React Suspense and streaming SSR where applicable.
- The activity feed must display a timeline of recent PRs reviewed by the AI, including links directly to the GitHub PR.
- Charts must accurately visualize engineering metrics (e.g., a bar chart of AI comments generated over the last 7 days).
- The UI must handle empty states gracefully—if a new organization has no repositories connected, it must display a clear, guided onboarding call-to-action.
- The dashboard layout must use CSS Grid/Flexbox to adapt beautifully to diverse screen sizes, ensuring charts don't overflow on mobile.

**Testing Requirements:**

- **Component Testing:** Ensure empty states render correctly when no data is provided to the components.
- **Performance Profiling:** Verify that the page meets Core Web Vitals thresholds, particularly LCP (Largest Contentful Paint).

---

### Task 37: Detailed PR Review Insights Page

**Description:**
Build a dedicated, deep-dive page within the web application to view the detailed results of a specific AI PR analysis. While the AI posts comments directly to GitHub, this internal page provides a holistic summary, security vulnerability highlights, and an interactive diff viewer enriched with AI insights. This page allows managers to review the AI's performance and allows developers to see an aggregated view of architectural concerns that might be lost in scattered GitHub inline comments.

**Packages affected:**

- `apps/web`
- `packages/ui`

**Files expected:**

- `apps/web/src/app/(dashboard)/org/[slug]/pr/[id]/page.tsx`
- `apps/web/src/components/pr/diff-viewer.tsx`
- `apps/web/src/components/pr/security-alerts.tsx`

**Dependencies:**

- Task 26 (Asynchronous PR Analysis Workflow)

**Deliverables:**

- A dedicated page for specific PR insights.
- A custom React component to render code diffs with highlighted syntax and inline AI annotations.
- A summary section categorizing AI findings by severity.

**Acceptance Criteria:**

- The page must fetch the comprehensive analysis record from the database, including the original diff and the structured AI JSON output.
- The `diff-viewer` component must accurately render side-by-side or unified diffs, clearly marking additions and deletions.
- AI comments must be visually anchored to the correct lines within the `diff-viewer` component, expanding upon click.
- Critical security alerts flagged by the AI must be prominently displayed at the top of the page in a warning banner.
- The page must include a feedback mechanism (e.g., thumbs up/down buttons on AI comments) to collect data for future model fine-tuning.
- Data fetching must be secure, ensuring a user from Organization A cannot view a PR analysis belonging to Organization B.

**Testing Requirements:**

- **Integration Testing:** Ensure the tRPC route enforcing authorization correctly rejects unauthorized access attempts.
- **Component Testing:** Feed a complex, multi-file diff into the `diff-viewer` and assert that line numbers and syntax highlighting render correctly without throwing React errors.

---

### Task 38: Deployment Webhook & Status Tracking

**Description:**
Implement a system to track the deployment status of connected repositories. This involves creating a generic webhook receiver in Next.js that can accept deployment payloads from platforms like Vercel, AWS Amplify, or standard CI/CD pipelines. The system must parse these payloads, update the internal database with the deployment status (pending, successful, failed), and optionally trigger Inngest workflows (e.g., notifying a Slack channel or running post-deployment AI sanity checks).

**Packages affected:**

- `apps/web`
- `packages/db`
- `packages/workflow`

**Files expected:**

- `apps/web/src/app/api/webhooks/deploy/route.ts`
- `packages/db/src/schema/deployments.ts`

**Dependencies:**

- Task 5 (Database Schema Setup)

**Deliverables:**

- A generic deployment webhook endpoint.
- Database tables to track deployment history linked to specific commits and repositories.
- Dashboard integration to display the current deployment status of the project.

**Acceptance Criteria:**

- The webhook endpoint must be secured via a secret token provided in the URL query string or headers, preventing unauthorized state changes.
- The endpoint must parse common deployment payloads (e.g., Vercel's webhook format) to extract the environment (production, preview), commit SHA, and status.
- Incoming webhook data must be stored in a new `deployments` table in PostgreSQL.
- The dashboard UI must reflect the real-time deployment status, displaying a green indicator for successful deployments and red for failures.
- If a deployment fails, the system must trigger an Inngest event capable of alerting the engineering team.

**Testing Requirements:**

- **E2E Testing:** POST a mock Vercel payload to the webhook endpoint and verify that the database updates and the dashboard reflects the new status.
- **Security Testing:** Ensure requests lacking the secret token are rejected with a 401 status.

---

### Task 39: End-to-End System Integration Testing

**Description:**
Execute a comprehensive, platform-wide integration testing phase. This task does not involve building new features, but rather writing extensive automated tests using Playwright to ensure all previously built systems—Auth, Billing, GitHub Webhooks, AI Generation, and UI—communicate flawlessly. You will create dedicated test scripts that simulate the entire critical path of the application, from user sign-up to PR analysis and billing limits.

**Packages affected:**

- `apps/web` (e2e tests directory)

**Files expected:**

- `apps/web/e2e/auth.spec.ts`
- `apps/web/e2e/billing.spec.ts`
- `apps/web/e2e/pr-workflow.spec.ts`

**Dependencies:**

- All preceding tasks (1-38).

**Deliverables:**

- A robust suite of Playwright E2E tests.
- CI configuration to run these tests against a preview database/environment.

**Acceptance Criteria:**

- The `auth.spec.ts` must automate user registration, login, and organization creation.
- The `pr-workflow.spec.ts` must simulate a GitHub webhook firing, mock the Inngest execution and AI SDK response, and verify that the resulting data appears correctly on the Dashboard UI.
- The `billing.spec.ts` must simulate hitting a usage limit and assert that the UI correctly blocks further actions and displays the upgrade prompt.
- All tests must run reliably in a headless CI environment without flaky failures caused by race conditions.
- Test coverage must target the critical business paths; edge cases can be left to unit tests.

**Testing Requirements:**

- **Execution:** Run the entire Playwright suite locally and ensure 100% pass rate.
- **CI Integration:** Integrate the test suite into a GitHub Actions workflow that blocks merging if tests fail.

---

### Task 40: Production Deployment & CI/CD Pipeline Configuration

**Description:**
Prepare and execute the final deployment strategy for the ShipFlow AI platform. This involves configuring GitHub Actions for continuous integration (linting, type-checking, testing) and continuous deployment. The Next.js web application will be deployed to Vercel, the PostgreSQL database will be provisioned on a managed service (e.g., Supabase, Neon), and environment variables must be securely synchronized. This task solidifies the project infrastructure for public release.

**Packages affected:**

- Entire Monorepo

**Files expected:**

- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`
- `vercel.json`
- Infrastructure documentation (e.g., `DEPLOYMENT.md`)

**Dependencies:**

- Task 39 (E2E Testing)

**Deliverables:**

- Fully functioning CI/CD pipeline.
- Production database provisioning.
- Live, accessible production environment on Vercel.

**Acceptance Criteria:**

- The CI pipeline (`ci.yml`) must trigger on all Pull Requests to the `main` branch, running TurboRepo commands to execute `lint`, `typecheck`, and `test` across all packages in parallel.
- The CD pipeline or Vercel integration must automatically deploy the `apps/web` application upon merging into `main`.
- Database migrations must be executed automatically during the deployment process using Drizzle's migration utilities.
- Production environment variables (Database URLs, API Keys, Razorpay Secrets) must be securely stored in Vercel's environment variable manager and verified.
- The deployment must include setting up a custom domain with strict SSL/TLS enforcement.
- A final smoke test must be manually executed on the production URL to ensure core functionality (Auth, Dashboard loading) is operational.

**Testing Requirements:**

- **Infrastructure Validation:** Verify that a dummy PR successfully triggers the CI checks and blocks merging if a deliberate type error is introduced.
- **Production Smoke Testing:** Manually register a new user on the live production environment to verify database connectivity and auth configuration.

---

**End of Section 13**

# SECTION 14: RATE LIMITING STRATEGY

## 14.1 Overview and Philosophy

In a SaaS platform that interfaces with external platforms (GitHub), AI models (OpenAI/Anthropic), and internal APIs, a robust rate limiting strategy is non-negotiable. Rate limiting serves multiple purposes in the ShipFlow architecture:

1. **Protection against abuse**: Preventing malicious actors from overwhelming our servers.
2. **Cost control**: Especially critical for AI model usage, where unconstrained generation can lead to massive unexpected bills.
3. **Fair use enforcement**: Ensuring that multi-tenant environments do not suffer from "noisy neighbor" problems.
4. **Third-party compliance**: GitHub API limits must be strictly respected to prevent our GitHub App from being suspended or banned.
5. **Billing enforcement**: Aligning platform usage with the tenant's subscribed plan and available credits.

To achieve these goals, we implement a multi-layered rate limiting strategy utilizing Upstash Redis for distributed counting and token bucket algorithms.

## 14.2 Authentication and Public API Limits

The first layer of defense is at the edge and application entry points.

- **Authentication Endpoints**: Login, signup, password reset, and magic link generation are prime targets for credential stuffing and brute-force attacks. We implement strict rate limits here:
  - 5 requests per minute per IP for login attempts.
  - 3 requests per hour per IP for password reset or magic link generation.
  - BetterAuth provides built-in mechanisms for some of this, but we augment it with Upstash Redis middleware in Next.js edge functions.
- **Public APIs**: Any unauthenticated API routes (if applicable, e.g., public project status pages) are limited to 60 requests per minute per IP address.
- **Authenticated APIs (tRPC)**: Standard platform interactions via the Next.js frontend are limited to a generous but safe baseline, e.g., 1000 requests per minute per organization. This prevents scraping or runaway scripts on the client side from degrading performance.

## 14.3 GitHub API Rate Limit Management

The GitHub API imposes strict rate limits on GitHub Apps (typically 5,000 requests per hour per installation, scalable with user count). Exceeding these limits results in HTTP 403 or 429 responses and potential suspension.

- **Global Counter**: We maintain a Redis-backed counter for GitHub API calls per installation. Before initiating a sync or large data retrieval, the `github` package checks this counter against the GitHub reported limit (using the `x-ratelimit-remaining` header from previous responses).
- **Proactive Throttling**: If the remaining limit drops below 10%, we pause non-essential background syncs and only allow user-initiated critical actions (e.g., merging a PR, reading a specific issue).
- **Secondary Rate Limits**: GitHub also has secondary rate limits (abuse limits) for concurrent requests. Our Octokit client is configured with the `@octokit/plugin-throttling` plugin. This plugin automatically handles `429` and `403` responses related to rate limits, pausing execution and retrying after the specified `retry-after` interval.
- **Webhook Processing**: Webhooks from GitHub do not count against our API request limits, but processing them might trigger API calls. Webhook handlers queue jobs in Inngest rather than making immediate API calls, allowing us to control the concurrency and rate of outgoing GitHub requests.

## 14.4 AI Usage Limits and Credit Enforcement

AI usage is the most expensive operational component of ShipFlow.

- **Token Bucket Algorithm**: We use a token bucket algorithm implemented in Upstash Redis to manage AI generation limits. Each organization has a bucket of "credits" or "tokens".
- **Cost Normalization**: Different AI models have different costs (e.g., GPT-4o vs Claude 3.5 Sonnet). We normalize these costs into internal "Compute Credits". Every AI request estimates the cost and deducts credits accordingly.
- **Tier-based Limits**:
  - Free tier: 1,000 credits per month. Hard cap.
  - Pro tier: 10,000 credits per month. Soft cap with auto-recharge.
  - Enterprise tier: Custom limits.
- **Concurrency Limits**: To prevent abuse and ensure system stability, we limit concurrent AI generations per organization to 5. Additional requests are queued or rejected with a 429 status code.
- **Graceful Degradation**: If an organization exhausts its AI credits, the platform gracefully degrades. Standard non-AI features continue to function perfectly. AI features present a clear UI message indicating that credits are exhausted and prompt the user to upgrade or purchase an add-on via Razorpay.

## 14.5 Webhook Processing Strategy

Webhooks from GitHub or payment gateways (Razorpay) can arrive in massive bursts.

- **Ingestion Layer**: The Next.js API route handling webhooks does absolutely minimal work. It verifies the signature (using secret keys), extracts the payload, and immediately pushes an event to Inngest. It responds with a `200 OK` within milliseconds.
- **Asynchronous Processing**: Inngest acts as a massive shock absorber. It queues the webhook events and processes them according to our defined concurrency limits.
- **Idempotency**: All webhook handlers must be idempotent. If Inngest retries a failed webhook delivery, the system state must not be corrupted. We achieve this by tracking processed webhook IDs in the database or Redis.
- **Dead Letter Queue**: If a webhook fails to process after multiple retries (e.g., due to a temporary database outage or bug in the handler), it is moved to a Dead Letter Queue (DLQ) for manual inspection and replay.

## 14.6 Redis / Upstash Architecture

Upstash Redis is chosen for its serverless nature, excellent integration with Vercel and Next.js Edge functions, and low latency.

- **Key Structure**: Redis keys are carefully namespaced to avoid collisions. Examples:
  - `ratelimit:api:ip:<ip_address>`
  - `ratelimit:ai:org:<org_id>`
  - `github_limit:installation:<installation_id>`
  - `webhook_idempotency:<webhook_id>`
- **TTL (Time to Live)**: Every rate limiting key MUST have a TTL set to ensure that counters reset correctly (e.g., hourly, daily) and that Redis memory is not exhausted by stale keys.

## 14.7 Failure Handling and Fallbacks

If the Redis cluster is temporarily unavailable, we must have a fallback strategy.

- **Fail-Open vs Fail-Closed**: For critical business paths (e.g., accepting payment webhooks), we may choose a "fail-open" approach if Redis is down, allowing the request through and logging a warning. For AI generation or login attempts, we default to "fail-closed" to protect against runaway costs and brute-force attacks, returning a generic error until Redis is restored.
- **Circuit Breakers**: We implement circuit breakers around Redis calls. If Redis operations fail consecutively, the circuit opens, and we bypass Redis (falling back to the defined open/closed strategy) for a short period before attempting to reconnect.

# SECTION 15: SECURITY ARCHITECTURE

## 15.1 Core Principles

Security in ShipFlow is built on the principle of defense-in-depth. We do not rely on a single perimeter; rather, security is embedded at the network edge, the application layer, the database layer, and within external integrations. The platform handles sensitive customer source code, AI prompts, and payment information, making security paramount.

## 15.2 Row Level Security (RLS) and Multi-Tenancy

Multi-tenancy is the most critical security boundary in a SaaS application. A flaw here could allow one organization to view or modify another organization's data.

- **Drizzle ORM and Postgres RLS**: While Drizzle handles the application-level queries, we back it up with PostgreSQL Row Level Security (RLS) policies. This ensures that even if an application bug attempts to query data across tenant boundaries, the database engine will reject it.
- **Tenant Context**: Every database query initiated from an authenticated user context must include the `tenant_id` (organization ID).
- **RLS Policy Example**:
  ```sql
  CREATE POLICY "Tenant Isolation" ON projects
  FOR ALL
  USING (organization_id = current_setting('app.current_tenant_id')::uuid);
  ```
- **Application Implementation**: Before executing Drizzle queries, a middleware or higher-order function sets the `app.current_tenant_id` in the PostgreSQL transaction context. This guarantees that all subsequent queries within that transaction are strictly scoped to that tenant.

## 15.3 Role-Based Access Control (RBAC)

Within an organization, users have different levels of access.

- **Roles**: We define standard roles: `Owner`, `Admin`, `Member`, `Viewer`.
- **Permissions Framework**: Roles are mapped to granular permissions (e.g., `project:create`, `pr:merge`, `billing:manage`).
- **tRPC Middleware Enforcement**: Access control is enforced at the tRPC router level using middleware.

  ```typescript
  export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return next({ ctx: { user: ctx.user } });
  });

  export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    const role = await getOrgRole(ctx.user.id, ctx.org.id);
    if (role !== "Admin" && role !== "Owner") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return next({ ctx });
  });
  ```

- **UI Reflection**: The UI strictly reflects RBAC. Actions a user cannot perform are hidden or disabled with tooltips explaining the required role.

## 15.4 Webhook Verification and Integrity

Webhooks are external inputs and must be treated as untrusted until verified.

- **GitHub Webhooks**: GitHub signs all webhook payloads with an HMAC hex digest using a configured secret.
- **Verification Logic**: Our `/api/webhooks/github` route computes the HMAC hex digest of the raw request body using our stored `GITHUB_WEBHOOK_SECRET`. It compares this computed digest against the `x-hub-signature-256` header provided by GitHub using a constant-time string comparison function to prevent timing attacks.
- **Replay Protection**: While GitHub doesn't provide strict nonce-based replay protection, we mitigate this by processing webhooks idempotently based on the `x-github-delivery` header.
- **Razorpay Webhooks**: Similarly, Razorpay webhooks are verified using the Razorpay-provided signature and the Razorpay Webhook Secret. Failure to verify immediately results in a 401 Unauthorized response.

## 15.5 API Keys and Secrets Management

- **Environment Variables**: No secrets are ever hardcoded in the repository. All secrets are injected via environment variables.
- **Vercel Environment Setup**: Production secrets are managed securely within Vercel's Environment Variables interface.
- **Secret Rotation**: We support zero-downtime rotation of critical secrets (like API keys) by allowing the application to accept multiple valid keys during a rotation window.
- **Customer API Keys**: If ShipFlow provides an API for customers, API keys are generated using a cryptographically secure random number generator, hashed using SHA-256 before being stored in the database, and only shown to the user once upon creation. We do not store plain-text customer API keys.

## 15.6 Input Validation and Sanitization

- **Zod Schemas everywhere**: Zod is the single source of truth for all input validation. Every tRPC endpoint, REST API route, and form submission uses a Zod schema to validate the shape, type, and constraints of incoming data.
- **Type Safety**: Zod schemas generate TypeScript types, ensuring that validation and type-checking are inextricably linked.
- **Sanitization**: For rich text inputs or markdown fields (e.g., PR descriptions), we use DOMPurify (on the client) and strict sanitization libraries on the server before rendering to prevent Cross-Site Scripting (XSS).
- **SQL Injection**: Drizzle ORM uses parameterized queries by default, effectively neutralizing standard SQL injection vectors. We strictly forbid raw SQL string concatenation.

## 15.7 Audit Logging and Compliance

- **Action Tracking**: Critical actions within the platform (e.g., changing billing plans, deleting a project, modifying user roles, executing a deployment workflow) are logged to an `audit_logs` table.
- **Log Structure**: An audit log entry contains: `timestamp`, `actor_id` (user who performed the action), `organization_id`, `action_type` (e.g., `USER_INVITED`), `target_id` (the ID of the affected resource), and a `metadata` JSONB column for detailed context.
- **Immutability**: The audit log table is append-only. Application code is not granted permissions to `UPDATE` or `DELETE` records from this table.

## 15.8 Security Headers and CORS

- **Next.js Security Headers**: We configure Next.js `headers()` in `next.config.js` to emit strict security headers:
  - `Strict-Transport-Security` (HSTS): Enforcing HTTPS.
  - `X-Frame-Options`: `DENY` to prevent clickjacking.
  - `X-Content-Type-Options`: `nosniff`.
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
  - `Content-Security-Policy` (CSP): A robust CSP is defined to restrict the sources from which scripts, styles, images, and connections can be loaded, severely limiting the impact of any potential XSS vulnerabilities.
- **CORS (Cross-Origin Resource Sharing)**: API routes are configured to only accept requests from our specific frontend domains. Wildcard `*` origins are strictly prohibited.

# SECTION 16: TESTING STRATEGY

## 16.1 Philosophy and Testing Pyramid

The ShipFlow testing strategy is designed to provide high confidence in code correctness while maintaining developer velocity. We adhere to a modified testing pyramid: a massive base of fast unit tests, a robust middle layer of integration tests focusing on database and API boundaries, and a targeted, critical top layer of End-to-End (E2E) tests testing crucial user journeys.

## 16.2 Unit Testing Strategy

Unit tests focus on isolated business logic, pure functions, and individual components without external dependencies.

- **Framework**: Vitest is used for all unit testing due to its speed, native TypeScript support, and compatibility with the Vite ecosystem.
- **Target Areas**:
  - `packages/shared`: Utility functions, Zod schemas, formatting logic. This must have near 100% coverage.
  - `packages/ai`: Prompt generation logic, response parsing, context window calculation. We mock the actual LLM API calls and test the input/output transformations.
  - `packages/workflow`: State machine logic, condition evaluation.
  - **React Components**: We use React Testing Library alongside Vitest to test UI components for rendering, state changes, and accessibility, without mounting the full application context.
- **Mocking**: Dependencies like database connections, external APIs, and Next.js routers are strictly mocked at this level.

## 16.3 Integration Testing Strategy

Integration tests verify that different modules work together correctly, particularly focusing on database interactions and internal API boundaries.

- **Framework**: Vitest, but utilizing a separate configuration that connects to a real (but isolated) test database.
- **Database Testing**: We use a dedicated PostgreSQL test container or isolated schema for integration tests. Tests perform real insertions, updates, and reads, verifying Drizzle schemas, relationships, and queries.
  - Each test suite runs within a transaction that is rolled back at the end of the suite, ensuring test isolation and speed.
- **tRPC Router Testing**: We test tRPC routers by instantiating the router with a mocked context (e.g., a mock authenticated user) and calling the procedures directly, bypassing the HTTP layer. This tests the authorization logic, input validation (Zod), and database interactions in a cohesive unit.
- **Inngest Function Testing**: Inngest functions are tested by invoking them locally with mock event payloads and asserting the resulting side effects (e.g., database updates).

## 16.4 End-to-End (E2E) Testing Strategy

E2E tests simulate a real user interacting with the application in a headless browser. They are slow and brittle, so we reserve them for the absolute most critical paths.

- **Framework**: Playwright is our E2E framework of choice for its cross-browser support, speed, and excellent developer tooling.
- **Target Critical Journeys**:
  1. **Authentication Flow**: Sign up, verify email, login, logout.
  2. **Project Onboarding**: Connect a GitHub repository, configure initial settings.
  3. **Core AI Workflow**: Create a feature request, trigger AI PR generation, wait for completion, view the PR.
  4. **Billing Flow**: Upgrade to a Pro plan (using a Stripe/Razorpay test card).
- **Environment**: E2E tests run against a staging environment or a fully provisioned ephemeral preview environment, interacting with test databases and test GitHub accounts.

## 16.5 Specialized Domain Testing

ShipFlow integrates with complex external systems requiring specific testing approaches.

- **GitHub Testing**: We cannot make real GitHub API calls for every test run to avoid rate limits and pollution. We heavily utilize `msw` (Mock Service Worker) to intercept HTTP requests from Octokit and return predefined mock responses for PRs, issues, and commit data.
- **Webhook Testing**: We test our webhook endpoints by manually constructing valid webhook payloads (including computing the correct HMAC signatures using a test secret) and POSTing them to the endpoint to verify the correct Inngest events are emitted.
- **AI Testing (LLM Evals)**: Testing AI outputs is notoriously difficult due to non-determinism.
  - **Deterministic Testing**: Testing the scaffolding (prompts sent, functions called) is done via standard unit/integration tests with mocked LLM responses.
  - **Evals**: We implement an internal evaluation framework. We maintain a dataset of input prompts and "golden" expected outputs or evaluation criteria. Periodically, we run the AI models against this dataset and use another LLM (e.g., GPT-4) as a "judge" to score the quality, structure, and accuracy of the generated code or PR descriptions.
- **Workflow/State Machine Testing**: The Inngest state machine is tested by triggering the initial event and fast-forwarding time or mocking intermediate step completions to ensure the workflow transitions through states (Pending -> Processing -> Success/Failure) correctly.

## 16.6 CI/CD and Coverage Targets

- **Continuous Integration**: GitHub Actions runs the entire test suite on every pull request.
  - Unit tests run on every push.
  - Integration and E2E tests run when the PR is marked "Ready for Review".
- **Coverage Targets**:
  - We do not mandate arbitrary global coverage numbers (e.g., "must be 90%"), as this often leads to low-quality tests written just to hit the metric.
  - Instead, we enforce strict coverage on critical packages: `shared` (95%+), `auth` (90%+), `billing` (90%+). UI components have lower coverage targets, focusing instead on visual regression and E2E coverage of critical paths.

# SECTION 17: DEPLOYMENT ARCHITECTURE

## 17.1 Cloud Infrastructure Philosophy

ShipFlow embraces a serverless and edge-first deployment architecture. This minimizes operational overhead, provides automatic horizontal scaling, and aligns costs closely with actual usage.

## 17.2 Next.js and Frontend Deployment (Vercel)

- **Host**: Vercel is the natural home for the Next.js application (`apps/web`).
- **Features utilized**:
  - **Edge Functions**: Used for middleware (authentication checks, rate limiting) to provide sub-10ms latency globally before hitting the main application logic.
  - **Serverless Functions**: Used for standard API routes and tRPC endpoints, auto-scaling to handle variable loads.
  - **ISR/SSG**: Incremental Static Regeneration is used for public-facing marketing pages or documentation to ensure blazing fast load times.
- **Preview Environments**: Every pull request automatically gets a fully functional Vercel preview deployment. This allows product managers, designers, and QA to test features before they are merged into `main`.

## 17.3 Database Deployment (PostgreSQL)

- **Host**: We utilize a managed serverless PostgreSQL provider like Supabase or Neon.
- **Why Serverless Postgres?**: It provides connection pooling out of the box (critical for serverless Next.js functions which can quickly exhaust traditional database connections), automatic branching for preview environments, and bottomless storage.
- **Migrations**: Drizzle migrations are executed automatically during the CI/CD pipeline before the Vercel deployment completes. We use a strict "expand and contract" migration strategy to ensure zero-downtime database changes.

## 17.4 Redis Deployment (Upstash)

- **Host**: Upstash provides a serverless Redis offering.
- **Usage**: Used for rate limiting, distributed locking, and short-term caching. Its HTTP-based API makes it perfect for edge environments where persistent TCP connections are problematic.

## 17.5 GitHub App Deployment and Configuration

- **Environments**: We maintain three separate GitHub Apps:
  - `ShipFlow-Dev`: Used by developers locally. Webhooks are routed via tools like ngrok or Localtunnel.
  - `ShipFlow-Staging`: Connected to the staging environment.
  - `ShipFlow-Prod`: The public, verified GitHub App.
- **Webhook Routing**: The production GitHub App points to `https://api.shipflow.io/api/webhooks/github`.

## 17.6 Background Jobs (Inngest)

- **Architecture**: Inngest operates differently than traditional queues. We do not host worker nodes. Instead, Inngest calls our Next.js API route (`/api/inngest`) via HTTP to trigger functions.
- **Deployment**: Inngest functions are deployed as part of the Vercel deployment. Inngest Cloud manages the state, retries, and scheduling, abstracting away the infrastructure complexity.

## 17.7 Monitoring, Logging, and Observability

- **Error Tracking**: **Sentry** is integrated into both the frontend (React) and backend (Next.js server/edge). It catches unhandled exceptions, tracks performance bottlenecks, and associates errors with specific user sessions and releases.
- **Logging**: Application logs are streamed from Vercel to a central logging provider (e.g., Datadog, Axiom, or Better Stack). We utilize structured JSON logging to allow for easy searching and alerting based on metadata (e.g., filtering logs by `organization_id`).
- **Performance Monitoring**: Vercel Analytics and Sentry Performance provide insights into Web Vitals (LCP, INP) and server-side endpoint latency. We set up alerts for latency spikes or error rate increases.

# SECTION 18: DEMO STRATEGY AND SCRIPT

## 18.1 Demo Objectives

The demo is the ultimate proof of concept for ShipFlow. It must effectively communicate the core value proposition: accelerating the software delivery lifecycle through AI automation and tight GitHub integration.
The goal is to show a seamless journey from an abstract idea to shipped code, highlighting the AI's contextual awareness and the platform's workflow automation.

## 18.2 Target Audience and Persona

The demo targets Engineering Managers, Staff Engineers, and CTOs. They care about developer velocity, code quality, visibility, and minimizing context switching. The presenter assumes the persona of a Lead Engineer using ShipFlow to manage a small team.

## 18.3 Pre-Demo Setup

1. **Clean Environment**: A fresh organization in ShipFlow.
2. **Demo Repository**: A standard Next.js + Tailwind web application repository connected to ShipFlow. The repository should have some existing code (e.g., a simple landing page) to demonstrate the AI's ability to understand existing context.
3. **Seeded Data**: No massive backlogs, but perhaps 1-2 completed feature requests to show what a populated dashboard looks like.

## 18.4 The Golden Path Demo Script

### Phase 1: The Request (Minutes 0-2)

- **Action**: Open the ShipFlow dashboard. Click "New Feature Request".
- **Narrative**: "Let's say our PM wants a dark mode toggle. Usually, this means writing a Jira ticket, assigning it, and a dev spending a few hours digging through the UI components."
- **Input**: Type a deliberately vague request into ShipFlow: _"Add a dark mode toggle to the header."_
- **Highlight**: Point out that the AI immediately starts analyzing the connected repository to understand _how_ the header is currently built.

### Phase 2: Clarification and PRD Generation (Minutes 2-4)

- **Action**: The AI responds. It doesn't just write code; it asks a clarifying question.
- **AI Output**: _"I see you are using Tailwind CSS. Should I implement dark mode using Tailwind's 'class' strategy or rely on the system preference media query? Also, do you want a specific icon library for the toggle?"_
- **Narrative**: "Notice how ShipFlow acts like a senior engineer. It spots ambiguity and asks for clarification based on our actual stack."
- **Action**: Reply: _"Use the class strategy, persist it in local storage, and use Lucide React icons."_
- **Action**: The AI generates a structured mini-PRD and a proposed task list (e.g., 1. Setup ThemeProvider, 2. Create Toggle Component, 3. Update Header). Click "Approve Plan".

### Phase 3: The Autonomous Build (Minutes 4-6)

- **Action**: ShipFlow transitions to the "Building" state. We see real-time updates as Inngest orchestrates the AI agents.
- **Narrative**: "ShipFlow is now reading the specific files—the layout file, the header component, the package.json to check for lucide-react. It's writing the code and crafting a commit."
- **Action**: A notification pops up: "Pull Request Created". Click the link to open the GitHub PR.
- **Highlight**: Show the GitHub PR. Point out the incredibly detailed PR description generated by ShipFlow, the accurate code changes utilizing the existing project patterns, and the clean commit history.

### Phase 4: AI Review and Iteration (Minutes 6-8)

- **Action**: Act as the code reviewer. In the GitHub PR, leave a review comment on the AI's code: _"Make the toggle transition smoother, maybe add a 200ms duration."_
- **Narrative**: "ShipFlow listens to GitHub webhooks. It sees my review comment and immediately jumps back into action."
- **Action**: Switch back to ShipFlow (or stay in GitHub and wait). Watch as ShipFlow pushes a new commit addressing the feedback.
- **Highlight**: Show the new commit in GitHub. The AI correctly added `transition-colors duration-200` to the Tailwind classes.

### Phase 5: Approval and Ship (Minutes 8-10)

- **Action**: Approve the PR in GitHub and merge it.
- **Narrative**: "The code looks good. I hit merge. ShipFlow detects the merge."
- **Action**: Switch back to the ShipFlow dashboard. The feature request is automatically moved to the "Shipped" status.
- **Conclusion**: "In 10 minutes, we went from a vague product idea to deployed code, with architectural decisions validated, code written in our exact style, and feedback incorporated—all without leaving the context of the platform. That is ShipFlow."

## 18.5 Edge Case Demonstrations (Optional Extensions)

If time permits, demonstrate:

- **Test Failure Recovery**: Show a PR where the AI's code breaks an existing Vitest suite. Show how ShipFlow intercepts the CI failure, reads the error log, and automatically proposes a fix.
- **Context Expansion**: Ask the AI to build something requiring a new library. Show it generating the `npm install` command equivalents and updating dependencies.
