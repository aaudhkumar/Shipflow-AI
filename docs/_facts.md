# Shipflow Codebase Facts

## 1. Tech Stack
- **Languages**: TypeScript, Node.js (>= 18)
- **Package Manager**: pnpm (workspace/monorepo setup)
- **Frontend**: Next.js (`apps/web`), React, Tailwind CSS
- **API Framework**: Express (`apps/api`), tRPC (`@trpc/server`), `trpc-to-openapi`
- **Database**: PostgreSQL (`pg`)
- **ORM**: Drizzle ORM (`@shipflow/db`)
- **Workflow/Queues**: Inngest (Event-driven workflows)
- **Caching/Rate Limiting**: Upstash Redis
- **Testing**: Vitest, Playwright (e2e)
- **Vector DB**: Pinecone

## 2. Public Routes/Endpoints
Served via Express at `apps/api/src/server.ts`:
- `GET /` : Health check/root
- `GET /health` : Health check
- `GET /openapi.json` : Generated OpenAPI JSON document
- `GET /docs` : Scalar API Reference UI
- `/trpc/*` : Raw tRPC endpoints
- `/api/*` : OpenAPI REST-mapped endpoints (via `trpc-to-openapi`)

### tRPC Routers (Resource Groups)
Found in `packages/trpc/server/routes/`:
- **health**: System health and readiness.
- **auth**: Authentication operations.
- **organization**: Org management and settings.
- **feature**: Feature flagging or feature management.
- **project**: Project lifecycle and metadata.
- **pullRequest**: PR tracking and stats.
- **billing**: Razorpay subscription/payment integration.
- **repository**: GitHub repo linking and tracking.
- **member**: Organization member management.
- **prd**: Product Requirements Document management.
- **task**: Task/ticket tracking.
- **audit**: Audit logs for org actions.
- **notification**: User notifications.
- **deployment**: Deployment tracking.
- **taskExecution**: Execution engine for AI tasks/workers.

## 3. Features
*Note: Although original prompts assumed an "AI Evaluation Engine", the codebase is actually an AI-powered Software Development Lifecycle (SDLC) / Project Management platform.*
- **Authentication**: Session management via Better-Auth, supporting OAuth (Google, GitHub).
- **Organization & Member Management**: Multi-tenant orgs with member invites and roles.
- **Project & Feature Tracking**: Planning software development with projects, PRDs, and features.
- **Task Management & Execution**: Creating tasks and running automated "task executions" via AI workers.
- **GitHub Integration**: Linking repositories and tracking pull requests via GitHub App webhooks.
- **Billing**: Subscriptions and payments powered by Razorpay.
- **Workflows & Deployments**: Tracking deployments and running async jobs with Inngest.
- **Notifications & Auditing**: Audit trails for actions and user notifications.

## 4. Auth Model
- **Library**: `better-auth` (`@shipflow/auth`).
- **Mechanisms**: Session/Cookie based.
- **Providers**: Supports Email/Password, Google OAuth, and GitHub OAuth.
- **Middleware**: tRPC context injection in `apps/api/src/server.ts`.

## 5. Environment Variables
From `.env.example`:
| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Postgres connection string | Yes |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Auth library config | Yes |
| `GOOGLE_OAUTH_*`, `GITHUB_OAUTH_*` | OAuth provider credentials | Optional |
| `RAZORPAY_*` | Billing integration credentials | Optional |
| `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET` | GitHub App integration | Optional |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY` | AI Model providers | Yes (at least one) |
| `INNGEST_*` | Workflow engine config | Yes |
| `UPSTASH_REDIS_*` | Rate limiting config | Yes |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL` | Frontend/API URLs | Yes |
| `SESSION_SECRET`, `APPROVAL_SECRET`, `GITHUB_STATE_SECRET` | Various crypto secrets | Yes |
| `CORS_ALLOWED_ORIGINS` | API CORS security | Yes |
| `PORT`, `NODE_ENV`, `BASE_URL` | Server basics | Yes |
| `PINECONE_API_KEY`, `PINECONE_INDEX` | Vector DB config | Optional |
| `DEPLOYMENT_WEBHOOK_SECRET`, `INVITATION_SECRET` | Webhook/Invite security | Optional |
| `RESEND_API_KEY` | Email provider | Optional |
| `BETTER_AUTH_API_KEY` | Better Auth Dash API Key | Optional |

## 6. MCP Server
- **Implemented**: No. (No tools or resources exposed).

## 7. Webhooks
- **GitHub Webhooks**: Validated with `GITHUB_WEBHOOK_SECRET` for PRs and repo events.
- **Razorpay Webhooks**: Validated with `RAZORPAY_WEBHOOK_SECRET` for billing events.
- **Deployment Webhooks**: Validated with `DEPLOYMENT_WEBHOOK_SECRET` for deployment tracking.

## 8. Scripts (from package.json)
- `pnpm build`: Turbo build
- `pnpm dev`: Turbo dev
- `pnpm db:generate`, `pnpm db:migrate`: Drizzle DB management
- `pnpm lint`, `pnpm format`, `pnpm check-types`: Code quality
- `pnpm test`: Vitest runner

## 9. OpenAPI/Swagger
- Generated at runtime via `trpc-to-openapi` at `GET /openapi.json`.
- Served interactively via Scalar UI at `GET /docs`.

## 10. Existing Docs
- `README.md` (Currently short)
- `IMPLEMENTATION_PLAN.md` (Old implementation plan for task-execution agent)
- `Shipflow_Documentation_Implementation_Plan.md` (Instructions being followed now)

## Gaps & Open Questions
- None. The codebase is well understood and all items from Prompt 0 were found successfully.
