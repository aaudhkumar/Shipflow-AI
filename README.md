# Shipflow: AI-Powered Software Development Lifecycle Platform

**Shipflow is an advanced, AI-powered Software Development Lifecycle (SDLC) and Project Management platform.** Designed for modern engineering teams, Shipflow provides a unified workspace to seamlessly manage organizations, projects, product requirements (PRDs), pull requests, and automated tasks. 

What sets Shipflow apart is its **AI Task Execution Engine**: it doesn't just track work; it actively *does* the work. By assigning tasks to AI workers, Shipflow can autonomously draft code, open pull requests, and accelerate your development cycle.

---

> [!IMPORTANT]
> **Evaluating Shipflow for the first time?**
> Start with the comprehensive [Evaluator Walkthrough (DEMO.md)](DEMO.md) for a fast, guided tour of the platform's key features, architecture, and live capabilities.

---

## 🌟 Core Features in Detail

| Feature | Detailed Description | Key APIs / Internal Modules |
|---------|----------------------|-----------------------------|
| **Authentication & Security** | Robust session-based authentication utilizing `better-auth`. Supports traditional email/password flows as well as seamless OAuth integrations (Google, GitHub) for frictionless developer onboarding. | `packages/auth`, `better-auth`, `trpc/auth` |
| **Organizations & Multi-tenancy** | True multi-tenant architecture allowing teams to create isolated workspaces (Organizations). Includes granular member invitation systems, role-based access control (RBAC), and secure data boundaries. | `trpc/organization`, `trpc/member`, `packages/db` |
| **Projects & PRDs** | A structured approach to software planning. Track products from high-level requirements (rich-text Product Requirements Documents) down to actionable engineering tasks, all linked hierarchically. | `trpc/project`, `trpc/prd`, `trpc/feature` |
| **AI Task Execution** | The flagship feature: assign granular tasks to AI-powered workers. Powered by Inngest for reliable background processing, these workers read PRD context and use LLMs (OpenAI, Anthropic, Gemini, OpenRouter) to autonomously generate code and solutions. | `trpc/taskExecution`, `packages/ai`, `packages/workflow` |
| **GitHub Integration**| Bi-directional synchronization with your source control. Link GitHub repositories via a GitHub App to automatically ingest Pull Request data, link PRs to Shipflow Tasks, and track deployment statuses in real-time. | `trpc/repository`, `trpc/pullRequest`, GitHub Webhooks |
| **Billing & Monetization** | Integrated Razorpay subscription and payment tracking. Automatically handles plan upgrades (Pro/Enterprise), webhooks, and feature gating based on the organization's active tier. | `trpc/billing`, `Razorpay API` |
| **Deployments & Workflows**| Event-driven asynchronous processing powered by Inngest. Handles long-running AI tasks, deployment webhooks from CI/CD pipelines, and internal system events reliably without HTTP timeouts. | `trpc/deployment`, `Inngest` |

## 🏗️ Architecture & Tech Stack

Shipflow is built as a modern, type-safe monorepo (managed by `pnpm`) to ensure end-to-end consistency from the database to the UI.

```ascii
                      +------------------------------------------+
                      |             Next.js (Web UI)             |
                      |  React, Tailwind CSS, tRPC React Query   |
                      +-------------------+----------------------+
                                          |
                                [ tRPC HTTP Client ]
                                          |
+-----------------------------------------v-----------------------------------+
|                              Express API Server                             |
|                                                                             |
|  [ Auth Middleware ]        [ tRPC Routers ]        [ trpc-to-openapi ]     |
+-----------+-------------------------+-------------------------+-------------+
            |                         |                         |
     +------v------+           +------v------+           +------v------+
     | Better-Auth |           |   Inngest   |           | AI Providers|
     | (Sessions)  |           | (Workflows) |           | (LLM APIs)  |
     +------+------+           +------+------+           +------+------+
            |                         |                         
     +------v------+           +------v------+           
     |  Postgres   |           |   Upstash   |           
     | (Drizzle)   |           |   (Redis)   |           
     +-------------+           +-------------+           
```

### Key Packages
- `apps/web`: The Next.js frontend application providing the user interface.
- `apps/api`: The Express API server hosting tRPC endpoints and OpenAPI mappings.
- `packages/db`: Centralized Drizzle ORM schemas, type definitions, and migration scripts.
- `packages/auth`: Authentication configuration wrapping `better-auth`.
- `packages/trpc`: The core backend business logic, separated into domain-specific routers.
- `packages/ai`: Standardized integrations with various LLM providers.
- `packages/workflow`: Inngest event definitions and background worker functions.

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed and configured:
- **Node.js**: `>= 18.x`
- **Package Manager**: `pnpm` (v9+)
- **Database**: A running PostgreSQL instance.
- **Redis**: Upstash Redis (or a standard local Redis instance) for rate limiting.
- **AI API Keys**: At least one valid API key from OpenAI, Anthropic, Gemini, or OpenRouter.
- **Workflow Engine**: The Inngest local development server (or an Inngest Cloud account).

### Quick Start Guide

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/shipflow/shipflow.git
   cd shipflow
   pnpm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   *Open `.env` and carefully fill in your Postgres connection string (`DATABASE_URL`), AI provider keys, Redis credentials, and Auth secrets (`BETTER_AUTH_SECRET`).*

3. **Initialize the Database**:
   Generate and apply the Drizzle ORM migrations to construct the database schema.
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

4. **Start the Development Environment**:
   This command uses TurboRepo to concurrently start the Next.js frontend, the Express API, and any necessary background workers.
   ```bash
   pnpm dev
   ```
   *The Web UI will be available at `http://localhost:3000` and the API at `http://localhost:8000`.*

## 💻 Development Commands

Shipflow uses TurboRepo for highly optimized, cached monorepo task execution.

| Command | Detailed Description |
|---------|----------------------|
| `pnpm dev` | Starts the entire development pipeline concurrently (Web, API, and background workers). |
| `pnpm build` | Compiles and builds all applications and packages for production deployment. |
| `pnpm db:generate`| Inspects schema changes in `packages/db` and generates Drizzle migration SQL files. |
| `pnpm db:migrate` | Applies pending Drizzle migrations directly to the configured PostgreSQL database. |
| `pnpm lint` | Runs ESLint across the workspace to enforce code quality and style guidelines. |
| `pnpm format` | Uses Prettier to automatically format all TypeScript, JavaScript, and Markdown files. |
| `pnpm check-types`| Executes the TypeScript compiler (`tsc`) across all packages to catch type errors. |
| `pnpm test` | Runs the Vitest suite for unit and integration testing across the codebase. |

## 🧪 Testing
Shipflow maintains a rigorous testing standard to ensure platform stability.
- **Unit & Integration Testing**: Executed via `pnpm test` using Vitest. Focuses on individual utility functions, AI prompt compilation, and core tRPC router logic.
- **End-to-End (E2E) Testing**: Located under `apps/web/e2e`, utilizing Playwright to simulate real user interactions across the Next.js frontend and API.

## 📊 Observability & Monitoring
Shipflow provides built-in endpoints for monitoring system health and performance:

- **Health Check Ping**:
  ```bash
  curl {BASE_URL}/api/health
  # Expected Response: {"message": "ShipFlow server is healthy", "healthy": true}
  ```

## 📖 Comprehensive API Documentation
While the backend is strictly typed using tRPC, Shipflow exposes a fully documented, standard REST API via `trpc-to-openapi`. This allows for easy integration with third-party tools and scripts.

- **Interactive API UI**: Accessible at `{BASE_URL}/api/docs` (Powered by Scalar, providing interactive request building and testing).
- **Raw OpenAPI Spec**: Accessible at `{BASE_URL}/api/openapi.json` (Ideal for importing into Postman or Insomnia).

For an in-depth explanation of the API architecture, refer to [DOCS.md](DOCS.md).

## 🔗 Webhook Integrations
Shipflow is designed to react to external events seamlessly via secured webhooks:
- **GitHub Webhooks**: Synchronizes repositories, pull request statuses, and branch updates in real-time. Secured via `GITHUB_WEBHOOK_SECRET`.
- **Razorpay Webhooks**: Handles subscription lifecycle events (upgrades, renewals, payment failures). Secured via `RAZORPAY_WEBHOOK_SECRET`.
- **Deployment Webhooks**: Allows external CI/CD platforms (like Vercel or GitHub Actions) to notify Shipflow when a feature is successfully deployed. Secured via `DEPLOYMENT_WEBHOOK_SECRET`.

## 🚢 Production Deployment
To deploy Shipflow to a production environment:
1. **Environment Variables**: Securely inject all required variables from `.env.example` into your hosting provider (e.g., Vercel, Railway, AWS).
2. **Build Phase**: Execute `pnpm build` to compile the optimized production bundles for both `apps/api` and `apps/web`.
3. **Start API Server**: Run the compiled Express server located at `apps/api/dist/server.js`.
4. **Start Web Server**: Start the Next.js production server using `pnpm start` within the `apps/web` directory.

## 🔒 Security Architecture
Security is a first-class citizen in Shipflow:
- **Session Management**: `better-auth` is utilized to generate and validate secure, HTTP-only, `SameSite` cookies, mitigating XSS vulnerabilities.
- **CORS Protection**: API access is strictly regulated by the `CORS_ALLOWED_ORIGINS` environment variable, preventing cross-site request forgery (CSRF).
- **Webhook Verification**: All incoming webhooks are strictly verified using cryptographic HMAC signatures (e.g., `x-hub-signature-256` for GitHub) before any processing occurs.
- **Rate Limiting**: Distributed rate limiting is implemented via Upstash Redis to prevent API abuse, brute-force attacks, and LLM token exhaustion.
