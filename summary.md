# ShipFlow AI - Technical Project Summary

This document provides a concrete, code-level summary of the features and architectural implementations currently active in the ShipFlow AI monorepo. It details what has been built, how it works, and the reasoning behind these structural choices.

## 1. Monorepo Structure & Stack

The codebase is organized as a **Turborepo** monorepo using `pnpm workspaces`. This isolates dependencies and strictly separates business logic from presentation.

*   **`apps/web`**: A Next.js App Router application. Serves as the user-facing dashboard for organizations to view deployments, manage team members, and track AI Pull Request insights.
*   **`apps/api`**: A standalone Express server that hosts the tRPC backend and OpenAPI endpoints. 
*   **`packages/db`**: The single source of truth for the database schema using **Drizzle ORM** (PostgreSQL).
*   **`packages/services`**: The core logic layer. Contains classes and utilities for database mutations, GitHub API interactions, and Pinecone vector embeddings.
*   **`packages/workflow`**: The background job orchestrator. Contains declarative background workflows managed by **Inngest**.
*   **`packages/trpc`**: Type-safe API routers shared between the frontend and the backend.

---

## 2. Implemented Code Features & Rationale

### A. AI Pull Request Review System
**What is built:** A complete, automated pipeline that reviews code when a PR is opened.
*   **`packages/workflow/src/workflows/review-pull-request.ts`**: An Inngest workflow that triggers when a GitHub `pull_request` webhook fires.
*   **Pinecone RAG Integration (`packages/services/src/pinecone`)**: The codebase utilizes Pinecone to store vectorized code chunks. During a PR review, the AI retrieves relevant files from the database to understand the broader context of the PR diff, rather than just reviewing isolated lines.
*   **AI SDK & OpenRouter**: Utilizes Vercel's AI SDK to stream and generate structured JSON review comments.
*   **GitHub Octokit (`packages/services/src/github`)**: Automatically translates the AI's review into exact line-number annotations and posts them as a review directly on the GitHub PR.
*   **Rationale**: To catch architectural issues, security flaws, and logic errors proactively without requiring human intervention or context-switching.

### B. Repository Vector Synchronization
**What is built:** The `repo-sync.ts` background workflow.
*   **How it works**: When a repository is connected via the GitHub App, this workflow recursively fetches the repository's file tree, chunks the code into manageable pieces, calculates embeddings, and upserts them into a dedicated Pinecone namespace.
*   **Rationale**: Large language models cannot process entire codebases at once. By syncing the repo to a vector database, the AI can perform semantic searches to pull in only the necessary files needed to review a PR or answer a question.

### C. Feature & Task Lifecycle Management
**What is built:** The `feature-lifecycle.ts` workflow and associated database models (`features.ts`, `tasks.ts`, `prds.ts`).
*   **How it works**: Tracks the state machine of a feature from ideation to deployment. Includes functionality to auto-generate Release Notes (`generate-release-notes.ts`) upon successful deployments.
*   **Rationale**: To tie code changes (PRs) back to the original business requirements, providing a unified view of what code was shipped for what feature.

### D. Billing & Subscriptions
**What is built:** The `billing-sync.ts` workflow and `billing.ts` database models.
*   **How it works**: Synchronizes subscription states (Free, Pro, Enterprise) based on Stripe webhooks. Enforces usage limits (e.g., maximum AI reviews per month).
*   **Rationale**: To seamlessly gate premium features and meter expensive AI operations without blocking the core application thread.

### E. Multi-Tenant Architecture & RBAC
**What is built:** Organization and Member database models (`organizations.ts`, `users.ts`).
*   **How it works**: All data (Repositories, Features, PRs) belongs to a specific `orgId`. Users are invited to organizations as "Members" with specific roles (Admin, Viewer).
*   **Rationale**: Allows ShipFlow AI to operate as a secure B2B SaaS platform where different companies can safely connect their proprietary GitHub repositories without data leakage.

---

## 3. Notable Architectural Fixes

*   **Decoupled Workflow Client**: The `inngest` client and event schemas were moved from `packages/workflow` down into `packages/services/src/workflow/client`. 
    *   *Reason*: To resolve a critical cyclic dependency and adhere to Turborepo best practices, allowing the service layer to trigger background events without importing the entire workflow runner.
*   **Bulletproof Local CORS**: The Express API server (`apps/api`) and the Next.js API fallback route were configured to unconditionally reflect requested Origins during development.
    *   *Reason*: To eliminate false-positive CORS preflight errors when the frontend routes through tunneling services like `ngrok` (which strip or mask standard headers during API requests).
