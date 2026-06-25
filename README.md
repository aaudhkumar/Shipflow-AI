# ShipFlow AI — AI-Powered Product Delivery Platform

## Overview
ShipFlow AI is a comprehensive product delivery and workflow automation platform that accelerates software development by integrating AI agents natively into the product management and code review lifecycle. From feature request creation, automated clarification, PRD and Kanban generation, all the way to AI-powered pull request reviews with Pinecone RAG codebase context, ShipFlow ensures faster, more reliable product shipment with complete traceability.

## Tech Stack
- Next.js 15 App Router
- tRPC (type-safe API)
- Drizzle ORM + PostgreSQL
- BetterAuth (authentication)
- Razorpay (billing)
- Octokit (GitHub integration)
- Vercel AI SDK (multi-provider: Gemini/OpenRouter/OpenAI/Anthropic)
- Inngest (durable async workflows)
- Pinecone (vector RAG for codebase context)
- Shadcn UI + Tailwind CSS
- Turborepo (monorepo)

## Architecture
```mermaid
graph TD
    A[apps/web (Next.js)] -->|tRPC| B[packages/trpc (API Layer)]
    B --> C[packages/services (Business Logic)]
    C --> D[packages/db (Drizzle/PostgreSQL)]
    C --> E[packages/ai (AI Agents)]
    C --> F[packages/workflow (Inngest)]
    F --> E
    E --> G[Vercel AI SDK / LLMs]
    E --> H[Pinecone Vector DB]
    C --> I[GitHub / Octokit]
```

## Setup Instructions
### Prerequisites
- Node.js >= 18
- pnpm >= 9.0.0
- PostgreSQL database (e.g., Neon or local)
- Accounts for: GitHub (App creation), Inngest, Pinecone, and Razorpay.

### Steps
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd shipflow
   ```
2. **Install dependencies:**
   ```sh
   pnpm install
   ```
3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` (create it if missing) and fill in your keys.
4. **Database Setup:**
   ```sh
   pnpm db:generate
   pnpm db:migrate
   ```
5. **Start the Development Server:**
   ```sh
   pnpm dev
   ```

## Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Secret for authentication | `generate-a-random-string` |
| `BETTER_AUTH_URL` | Base URL for auth callbacks | `http://localhost:3000` |
| `OPENAI_API_KEY` | (Or GEMINI / ANTHROPIC) LLM API key | `sk-...` |
| `PINECONE_API_KEY` | Vector DB API key | `pcsk_...` |
| `INNGEST_EVENT_KEY` | Key for Inngest dev/prod | `local` |
| `GITHUB_APP_ID` | GitHub App ID | `123456` |
| `GITHUB_PRIVATE_KEY` | GitHub App Private Key | `-----BEGIN RSA...` |
| `GITHUB_WEBHOOK_SECRET` | Secret for GitHub webhooks | `my-webhook-secret` |
| `RAZORPAY_KEY_ID` | Billing test/prod key | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Billing secret | `...` |

## Database Schema Notes
- `organizations` & `members`: Core multitenancy and RBAC.
- `featureRequests`: Tracks product ideas across states (SUBMITTED -> CLARIFIED -> PRD_GENERATED -> TASKS_GENERATED -> PLAN_APPROVED -> IN_DEVELOPMENT -> IN_REVIEW -> AWAITING_HUMAN_APPROVAL -> SHIPPED).
- `prds` & `prdVersions`: Versioned requirements linked to features.
- `epics`, `tasks`, `subtasks`: Kanban board management.
- `pullRequests`, `pullRequestReviews`, `reviewFindings`: Links GitHub PRs to features and stores AI review histories and line-by-line findings.

## GitHub Integration Setup
1. Go to GitHub Developer Settings > GitHub Apps > New GitHub App.
2. Set Webhook URL to `<your-domain>/api/webhooks/github`.
3. Provide a Webhook Secret.
4. **Permissions needed:**
   - Pull Requests (Read & Write)
   - Issues (Read & Write)
   - Contents (Read)
5. Generate a private key and download it.
6. Install the App on your desired repositories.
7. Fill the `GITHUB_*` variables in your `.env`.

## Inngest Workflow Explanation
- `featurePrdGenerated`: Triggered when a feature is clarified; runs the PRD generation AI and saves to `prdVersions`.
- `featureTasksGenerated`: Triggered after PRD generation; runs the Planner agent to generate epics, tasks, and subtasks.
- `reviewPullRequestWorkflow`: Triggered via GitHub webhooks (`pull_request` opened/synchronize); fetches diffs, runs Pinecone RAG and AI Code Reviewer, posts comments to GitHub, and inserts `reviewFindings`.
- `billingSyncWorkflow`: Listens to Razorpay payment events and updates org billing plans.
- `syncRepositoryWorkflow`: Background job to chunk and embed codebase into Pinecone for RAG.

## AI Features Implemented
- **Clarifier Agent**: Asks clarifying questions on vague feature requests and checks for duplicates.
- **PRD Generator**: Structures raw descriptions and Q&A transcripts into fully fleshed-out PRDs (Goals, Non-Goals, Stories, Acceptance Criteria).
- **Planner Agent**: Converts PRDs into actionable engineering tasks and epics.
- **Code Reviewer**: Reviews PR diffs for `SECURITY`, `PERFORMANCE`, `ARCHITECTURE`, and `PRD_DEVIATION`, surfacing actionable `BLOCKING` vs `NON-BLOCKING` findings.
- **Release Readiness Agent**: Evaluates the state of all tasks and code reviews to provide a final "Ship" recommendation.
