# ShipFlow AI — Technical Design Document

**Status:** Planning (no implementation yet)
**Scope:** Full architecture, data model, integration design, and build sequence for the complete platform described in the product spec.

This document is the blueprint we'll build from. Once you confirm the open decisions at the end, the next step is implementation, in the order laid out in §11.

---

## 1. Monorepo Architecture

Turborepo + pnpm workspaces, as specified.

```
shipflow-ai/
├── apps/
│   └── web/                       # Next.js 15 (App Router), the only app
├── packages/
│   ├── ui/                        # shadcn/ui-based component library
│   ├── database/                  # Prisma schema, generated client, seed scripts
│   ├── auth/                      # BetterAuth config, role/permission helpers
│   ├── trpc/                      # tRPC root router, context, middleware
│   ├── github/                    # Octokit client, GitHub App webhook handlers
│   ├── ai/                        # AI SDK provider setup, prompt templates, structured schemas
│   ├── billing/                   # Razorpay client, plan config, credit metering
│   ├── workflow/                  # Inngest client + all workflow functions
│   └── shared/                    # Zod schemas, shared types, constants, enums
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Why this split:** every integration (`github`, `billing`, `ai`, `workflow`) is isolated in its own package so it can be unit-tested against its real SDK without booting the web app, and so `trpc` routers stay thin — they call into these packages rather than embedding integration logic.

---

## 2. Tech Stack

| Layer         | Choice                                                                             | Notes                                                                 |
| ------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Framework     | Next.js 15 (App Router), React 19                                                  | apps/web only                                                         |
| API layer     | tRPC v11                                                                           | type-safe, no separate REST layer needed                              |
| Database      | PostgreSQL + Prisma                                                                | recommend Neon or Supabase for serverless-friendly Postgres on Vercel |
| Auth          | BetterAuth                                                                         | email + OAuth providers, session management                           |
| GitHub        | Octokit (`@octokit/rest`, `@octokit/webhooks`)                                     | via a **GitHub App**, not a plain OAuth token (see §6)                |
| AI            | Vercel AI SDK (`ai`) + `@ai-sdk/anthropic`                                         | structured outputs via `generateObject` + Zod                         |
| Async jobs    | Inngest                                                                            | every long-running step is a durable function                         |
| Billing       | Razorpay Node SDK                                                                  | subscriptions + webhook-driven status sync                            |
| Styling       | Tailwind + shadcn/ui                                                               |                                                                       |
| Validation    | Zod                                                                                | shared between client, tRPC, and AI structured outputs                |
| Rate limiting | Upstash Redis (sliding window)                                                     | serverless-compatible, low-latency                                    |
| Observability | Pino (structured logs) + Sentry (errors) + Inngest dashboard (workflow monitoring) |                                                                       |

---

## 3. Data Model

Full Prisma schema. This is the single source of truth for every entity in the spec.

```prisma
// ---------- Auth (BetterAuth-managed tables) ----------
model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  image         String?
  createdAt     DateTime     @default(now())
  memberships   Membership[]
  sessions      Session[]
  accounts      Account[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  user              User    @relation(fields: [userId], references: [id])
  provider          String  // "credentials" | "github" | "google" ...
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  @@unique([provider, providerAccountId])
}

// ---------- Tenancy ----------
model Workspace {
  id            String         @id @default(cuid())
  name          String
  slug          String         @unique
  createdAt     DateTime       @default(now())
  memberships   Membership[]
  projects      Project[]
  subscription  Subscription?
  usageRecords  UsageRecord[]
  auditLogs     AuditLog[]
  workflowRuns  WorkflowRun[]
}

enum Role {
  OWNER
  ADMIN
  PRODUCT_MANAGER
  ENGINEER
  REVIEWER
  VIEWER
}

model Membership {
  id          String    @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  role        Role
  createdAt   DateTime  @default(now())
  @@unique([workspaceId, userId])
  @@index([workspaceId])
}

// ---------- Projects & Repos ----------
model Project {
  id            String          @id @default(cuid())
  workspaceId   String
  workspace     Workspace       @relation(fields: [workspaceId], references: [id])
  name          String
  description   String?
  createdAt     DateTime        @default(now())
  repositories  Repository[]
  featureRequests FeatureRequest[]
  tasks         Task[]
  @@index([workspaceId])
}

model Repository {
  id                   String   @id @default(cuid())
  workspaceId          String
  workspace            Workspace @relation(fields: [workspaceId], references: [id])
  projectId            String
  project              Project  @relation(fields: [projectId], references: [id])
  githubInstallationId String
  owner                String
  name                 String
  fullName             String   @unique
  defaultBranch        String
  isPrivate            Boolean
  connectedById        String
  createdAt            DateTime @default(now())
  pullRequests         PullRequest[]
  @@index([workspaceId])
}

// ---------- Feature Discovery ----------
enum RequestSource { FORM SUPPORT_TICKET EMAIL MANUAL }
enum RequestStatus {
  NEW CLARIFYING DUPLICATE_RESOLVED PRD_GENERATING PRD_READY
  PLANNING IN_DEVELOPMENT IN_REVIEW APPROVED SHIPPED REJECTED
}

model FeatureRequest {
  id              String          @id @default(cuid())
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id])
  projectId       String
  project         Project         @relation(fields: [projectId], references: [id])
  title           String
  description     String
  source          RequestSource
  submitterEmail  String?
  status          RequestStatus   @default(NEW)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  clarification   ClarificationThread?
  duplicateCheck  DuplicateCheckResult?
  prds            PRD[]
  pullRequests    PullRequest[]
  release         Release?
  @@index([workspaceId, status])
}

model ClarificationThread {
  id               String   @id @default(cuid())
  featureRequestId String   @unique
  featureRequest   FeatureRequest @relation(fields: [featureRequestId], references: [id])
  status           String   // OPEN | RESOLVED
  messages         ClarificationMessage[]
}

model ClarificationMessage {
  id        String   @id @default(cuid())
  threadId  String
  thread    ClarificationThread @relation(fields: [threadId], references: [id])
  role      String   // AI | HUMAN
  content   String
  createdAt DateTime @default(now())
}

model DuplicateCheckResult {
  id                          String   @id @default(cuid())
  featureRequestId            String   @unique
  featureRequest               FeatureRequest @relation(fields: [featureRequestId], references: [id])
  resolution                  String   // NEW | DUPLICATE | EXISTING_CAPABILITY
  matchedFeatureRequestId      String?
  existingCapabilityDescription String?
  confidence                  Float
  createdAt                   DateTime @default(now())
}

// ---------- PRD ----------
model PRD {
  id               String   @id @default(cuid())
  featureRequestId String
  featureRequest   FeatureRequest @relation(fields: [featureRequestId], references: [id])
  version          Int      @default(1)
  problemStatement String
  goals            Json     // string[]
  nonGoals         Json     // string[]
  edgeCases        Json     // string[]
  successMetrics   Json     // string[]
  risksAssumptions Json     // string[]
  status           String   // DRAFT | IN_REVIEW | APPROVED
  generatedByAI    Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  userStories      UserStory[]
  acceptanceCriteria AcceptanceCriterion[]
  epics            Epic[]
  @@index([featureRequestId])
}

model UserStory {
  id     String @id @default(cuid())
  prdId  String
  prd    PRD    @relation(fields: [prdId], references: [id])
  asA    String
  iWant  String
  soThat String
  order  Int
}

model AcceptanceCriterion {
  id          String @id @default(cuid())
  prdId       String
  prd         PRD    @relation(fields: [prdId], references: [id])
  description String
  order       Int
}

// ---------- Planning ----------
model Epic {
  id          String @id @default(cuid())
  prdId       String
  prd         PRD    @relation(fields: [prdId], references: [id])
  title       String
  description String
  order       Int
  tasks       Task[]
}

enum TaskStatus { BACKLOG READY IN_PROGRESS REVIEW BLOCKED DONE }
enum Priority { LOW MEDIUM HIGH URGENT }
enum Complexity { XS S M L XL }

model Task {
  id                 String     @id @default(cuid())
  epicId             String
  epic               Epic       @relation(fields: [epicId], references: [id])
  projectId          String
  project            Project    @relation(fields: [projectId], references: [id])
  title              String
  description        String
  priority           Priority
  status             TaskStatus @default(BACKLOG)
  estimatedComplexity Complexity
  acceptanceCriteria Json       // string[]
  createdAt          DateTime   @default(now())
  subtasks           Subtask[]
  dependsOn          TaskDependency[] @relation("DependentTask")
  dependedOnBy       TaskDependency[] @relation("DependencyTask")
  pullRequests       PullRequest[]
  @@index([projectId, status])
}

model TaskDependency {
  id            String @id @default(cuid())
  taskId        String
  task          Task   @relation("DependentTask", fields: [taskId], references: [id])
  dependsOnId   String
  dependsOn     Task   @relation("DependencyTask", fields: [dependsOnId], references: [id])
  @@unique([taskId, dependsOnId])
}

model Subtask {
  id      String     @id @default(cuid())
  taskId  String
  task    Task       @relation(fields: [taskId], references: [id])
  title   String
  status  TaskStatus @default(BACKLOG)
  order   Int
}

// ---------- GitHub / PRs ----------
enum PRStatus { OPEN UPDATED MERGED CLOSED }

model PullRequest {
  id               String   @id @default(cuid())
  repositoryId     String
  repository       Repository @relation(fields: [repositoryId], references: [id])
  featureRequestId String?
  featureRequest   FeatureRequest? @relation(fields: [featureRequestId], references: [id])
  taskId           String?
  task             Task?    @relation(fields: [taskId], references: [id])
  githubPrNumber   Int
  githubPrId       BigInt
  title            String
  branch           String
  baseBranch       String
  authorGithubLogin String
  status           PRStatus
  url              String
  headSha          String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  files            PullRequestFile[]
  reviews          Review[]
  release          Release?
  @@unique([repositoryId, githubPrNumber])
  @@index([repositoryId, status])
}

model PullRequestFile {
  id            String @id @default(cuid())
  pullRequestId String
  pullRequest   PullRequest @relation(fields: [pullRequestId], references: [id])
  filename      String
  status        String // added | modified | removed
  additions     Int
  deletions     Int
}

// ---------- AI Review ----------
enum ReviewStatus { RUNNING READY_FOR_APPROVAL FIX_NEEDED APPROVED REJECTED CHANGES_REQUESTED }
enum IssueCategory { PRODUCT SECURITY PERFORMANCE QUALITY EDGE_CASE }
enum IssueSeverity { BLOCKING NON_BLOCKING }
enum IssueStatus { OPEN RESOLVED ACKNOWLEDGED }

model Review {
  id              String   @id @default(cuid())
  pullRequestId   String
  pullRequest     PullRequest @relation(fields: [pullRequestId], references: [id])
  cycleNumber     Int      @default(1)
  previousReviewId String?
  previousReview  Review?  @relation("ReviewCycle", fields: [previousReviewId], references: [id])
  nextReview      Review?  @relation("ReviewCycle")
  status          ReviewStatus
  summary         String
  reasoning       String
  createdAt       DateTime @default(now())
  issues          ReviewIssue[]
  approval        Approval?
  @@index([pullRequestId, cycleNumber])
}

model ReviewIssue {
  id              String        @id @default(cuid())
  reviewId        String
  review          Review        @relation(fields: [reviewId], references: [id])
  category        IssueCategory
  severity        IssueSeverity
  title           String
  description     String
  filePath        String?
  lineRangeStart  Int?
  lineRangeEnd    Int?
  recommendation  String
  relatedAcceptanceCriterionId String? // grounds the finding in the PRD, avoids generic feedback
  status          IssueStatus   @default(OPEN)
  createdAt       DateTime      @default(now())
}

// ---------- Human Approval ----------
enum ApprovalDecision { APPROVED REJECTED CHANGES_REQUESTED }

model Approval {
  id         String   @id @default(cuid())
  reviewId   String   @unique
  review     Review   @relation(fields: [reviewId], references: [id])
  reviewerId String
  decision   ApprovalDecision
  comment    String?
  createdAt  DateTime @default(now())
}

// ---------- Release ----------
model Release {
  id                  String   @id @default(cuid())
  featureRequestId    String   @unique
  featureRequest      FeatureRequest @relation(fields: [featureRequestId], references: [id])
  pullRequestId       String   @unique
  pullRequest         PullRequest @relation(fields: [pullRequestId], references: [id])
  releasedById        String
  releasedAt          DateTime @default(now())
  prReference         String
  deploymentMetadata  Json
}

// ---------- Billing ----------
enum PlanTier { FREE PRO ENTERPRISE }

model Subscription {
  id                  String   @id @default(cuid())
  workspaceId         String   @unique
  workspace           Workspace @relation(fields: [workspaceId], references: [id])
  plan                PlanTier @default(FREE)
  razorpaySubscriptionId String?
  status              String   // active | past_due | cancelled
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
}

model UsageRecord {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  type        String   // AI_CREDIT | REVIEW | REPO_SYNC
  amount      Int
  metadata    Json?
  createdAt   DateTime @default(now())
  @@index([workspaceId, type, createdAt])
}

model BillingEvent {
  id              String   @id @default(cuid())
  workspaceId     String?
  razorpayEventId String   @unique
  type            String
  payload         Json
  processedAt     DateTime @default(now())
}

// ---------- Cross-cutting ----------
model AuditLog {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  actorId     String
  action      String
  entityType  String
  entityId    String
  metadata    Json?
  createdAt   DateTime @default(now())
  @@index([workspaceId, createdAt])
}

model WebhookEvent {
  id        String   @id @default(cuid())
  source    String   // GITHUB | RAZORPAY
  eventId   String   @unique // delivery ID — idempotency key
  eventType String
  payload   Json
  status    String   // RECEIVED | PROCESSED | FAILED
  receivedAt DateTime @default(now())
}

model WorkflowRun {
  id                String   @id @default(cuid())
  workspaceId       String
  workspace         Workspace @relation(fields: [workspaceId], references: [id])
  type              String   // PRD_GENERATION | TASK_GENERATION | REVIEW | ...
  inngestEventId    String
  status            String   // QUEUED | RUNNING | COMPLETED | FAILED
  relatedEntityType String
  relatedEntityId   String
  error             String?
  startedAt         DateTime @default(now())
  completedAt       DateTime?
  @@index([workspaceId, status])
}
```

**Tenant isolation:** every business table carries `workspaceId` (directly or via a parent that does). All Prisma calls go through a tRPC middleware that injects the caller's `workspaceId` and rejects any query missing that scope. Postgres Row-Level Security policies mirror this as defense-in-depth.

---

## 4. RBAC Matrix

| Action                                | Owner | Admin | PM  | Engineer | Reviewer | Viewer |
| ------------------------------------- | ----- | ----- | --- | -------- | -------- | ------ |
| Manage billing                        | ✓     | ✓     | –   | –        | –        | –      |
| Manage members/roles                  | ✓     | ✓     | –   | –        | –        | –      |
| Connect repository                    | ✓     | ✓     | ✓   | –        | –        | –      |
| Create/edit feature request           | ✓     | ✓     | ✓   | –        | –        | –      |
| Edit PRD                              | ✓     | ✓     | ✓   | –        | –        | –      |
| Approve plan (Phase 2 gate)           | ✓     | ✓     | ✓   | –        | –        | –      |
| Move task status                      | ✓     | ✓     | ✓   | ✓        | –        | –      |
| Trigger re-review                     | ✓     | ✓     | ✓   | ✓        | ✓        | –      |
| Approve / reject release (human gate) | ✓     | ✓     | –   | –        | ✓        | –      |
| View everything in workspace          | ✓     | ✓     | ✓   | ✓        | ✓        | ✓      |

This table becomes a static permission map consumed by a single tRPC middleware (`requirePermission(action)`), not scattered if-checks per route.

---

## 5. Auth Design (BetterAuth)

- **Providers:** email/password + GitHub OAuth + Google OAuth (extensible).
- **Session:** BetterAuth's database-session strategy (rows in `Session`), httpOnly cookies, server-side validation on every tRPC request.
- **Workspace context:** a user can belong to multiple workspaces; the active workspace is resolved from the URL slug (`/[workspaceSlug]/...`) and cross-checked against `Membership` on every request — never trusted from a client-supplied header alone.
- **Roles:** stored on `Membership`, not on `User` — a user is, e.g., Owner in workspace A and Viewer in workspace B.

---

## 6. GitHub Integration Design

**Decision: GitHub App, not a bare OAuth token.** A GitHub App gives per-installation, per-repository scoped access and signed webhooks — required for multi-tenant isolation (workspace A's installation can never see workspace B's repos, which a shared OAuth token couldn't guarantee as cleanly).

- **Connection flow:** workspace admin installs the GitHub App on selected repos → GitHub redirects back with `installation_id` → we store it on `Repository.githubInstallationId` → all subsequent Octokit calls authenticate as that installation (`createAppAuth`).
- **Webhooks handled:** `pull_request` (`opened`, `synchronize`, `closed`), `push`. Each delivery's `X-GitHub-Delivery` ID is the idempotency key written to `WebhookEvent` before processing — duplicate deliveries are dropped at the door.
- **Signature validation:** HMAC-SHA256 over the raw payload using the App's webhook secret, verified before any parsing.
- **File/diff analysis:** `octokit.rest.pulls.listFiles`, `.get`, and `.repos.compareCommitsWithBasehead` for the actual diff content fed to the AI reviewer — fetched live each time, never hardcoded.

---

## 7. AI Engine Design

All AI calls go through the `packages/ai` package using the Vercel AI SDK with the Anthropic provider, and every output that needs to be structured uses `generateObject` against a Zod schema — no parsing free text.

| Capability                              | Input                                                           | Output shape                                           | Notes                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clarification                           | raw feature request                                             | `{ needsClarification: boolean, questions: string[] }` | runs first; loops until resolved or human skips                                                                                                        |
| Duplicate/existing-capability detection | feature request + indexed existing-feature corpus               | `{ resolution, matchedId?, confidence }`               | needs an embeddings model (see open decision in §12)                                                                                                   |
| PRD generation                          | feature request + clarification thread                          | full PRD object matching the Prisma shape              | one `generateObject` call per PRD                                                                                                                      |
| Task generation                         | approved PRD                                                    | `{ epics: [{ title, tasks: [{...}] }] }`               | dependency mapping done in the same call so the model reasons about ordering directly                                                                  |
| PR review                               | PRD + tasks + diff + file list + previous review (if re-review) | `{ summary, reasoning, issues: ReviewIssue[] }`        | every issue must carry `relatedAcceptanceCriterionId` — this is what stops "generic AI responses": the schema _forces_ grounding in a real requirement |
| Release readiness                       | review history + remaining open issues                          | `{ ready: boolean, reasoning: string }`                | final gate before the human-approval screen unlocks                                                                                                    |

**Re-review** reuses the same PR-review function but additionally passes the prior `Review` + its `ReviewIssue[]` so the model explicitly checks each previously-blocking issue against the new diff rather than re-reviewing from scratch.

---

## 8. Inngest Workflows

| Function                         | Trigger event                                          | Key steps                                                                          |
| -------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `featureRequest/clarify`         | `feature_request.created`                              | run clarification check → if needed, post questions, pause until human reply event |
| `featureRequest/duplicate-check` | `feature_request.clarified`                            | embed + search existing features → resolve or continue                             |
| `prd/generate`                   | `feature_request.ready_for_prd`                        | generate PRD → persist → notify PM                                                 |
| `plan/generate-tasks`            | `prd.approved`                                         | generate epics/tasks/subtasks → persist → Kanban populated                         |
| `repository/sync`                | `repository.connected` (and a daily cron)              | pull metadata, branches, recent PRs                                                |
| `pr/process`                     | GitHub webhook → `pull_request.*`                      | upsert `PullRequest` + `PullRequestFile` rows, enqueue review                      |
| `review/run`                     | `pr.ready_for_review`                                  | fetch context → AI review → categorize issues → set status                         |
| `review/rerun`                   | `pull_request.synchronize` while status = `FIX_NEEDED` | same as above + prior-review context                                               |
| `release/readiness-evaluate`     | `review.ready_for_approval`                            | final AI gate before unlocking human approval UI                                   |
| `billing/process-webhook-event`  | Razorpay webhook                                       | idempotent subscription/credit state sync                                          |

Every function writes a `WorkflowRun` row at start (`QUEUED`→`RUNNING`) and updates it on completion/failure, which is exactly what powers the UI's progress tracker — no separate polling system needed.

---

## 9. tRPC API Surface (router list)

`workspace`, `membership`, `project`, `repository`, `featureRequest`, `clarification`, `duplicateCheck`, `prd`, `epic`, `task`, `subtask`, `kanban`, `pullRequest`, `review`, `approval`, `release`, `billing`, `usage`, `auditLog`, `workflowRun`.

Each router's mutations run through two shared middlewares: `requireWorkspaceMembership` (tenant isolation) and `requirePermission(action)` (RBAC, from §4's matrix).

---

## 10. Billing, Rate Limiting, Security

**Billing (Razorpay):** `Subscription.plan` gates feature access; `UsageRecord` rows of type `AI_CREDIT` are debited on every AI call and checked _before_ the call is made (fail closed, not after the fact). Razorpay webhooks (`subscription.activated`, `subscription.charged`, `payment.failed`, etc.) are the single source of truth for `Subscription.status` — never trust client-reported payment success.

**Rate limiting** (Upstash Redis, sliding window):

| Surface             | Limit                                                                |
| ------------------- | -------------------------------------------------------------------- |
| Auth (login/signup) | 10 req/min/IP                                                        |
| AI generation       | plan-based credit balance, not a flat rate                           |
| GitHub sync         | Inngest concurrency limit per workspace, not user-facing             |
| Webhook processing  | idempotent via `WebhookEvent`, not rate-limited (must always accept) |
| Review generation   | 1 credit per review/re-review cycle                                  |

**Security:** RBAC + tenant isolation as above, Zod validation on every tRPC input, HMAC webhook verification, secrets only in environment variables (never in DB rows), `AuditLog` on every mutating action, OWASP-standard headers via Next.js middleware.

---

## 11. Build Sequence

The product itself isn't phased, but the _construction_ has to follow dependency order. This is the sequence I'd implement in once we start:

1. Monorepo scaffold (turborepo, pnpm, tsconfig, lint/format)
2. `packages/database` — schema above, migrations, seed script
3. `packages/auth` — BetterAuth + Membership/Role helpers
4. `packages/trpc` core — context, `requireWorkspaceMembership`, `requirePermission`
5. Workspace / Project / Membership routers + minimal UI shell
6. `packages/github` — GitHub App auth, webhook signature verification, repo connection flow
7. `packages/ai` — provider setup, Zod schemas, clarification + duplicate-check + PRD generation
8. `packages/workflow` — Inngest client + the workflows from §8 covering steps 6–7
9. Task/Epic/Subtask generation + Kanban board UI
10. PR ingestion pipeline (webhook → DB rows)
11. AI Review engine + `ReviewIssue` categorization + re-review loop (the core differentiator — gets the most care)
12. Human approval screen + Release tracking
13. `packages/billing` — Razorpay integration, credit metering, enforcement middleware
14. Rate limiting layer
15. Audit logging + observability wiring
16. Remaining UI pages + polish
17. README, env var documentation, deployment instructions

---

## 12. Open Decisions Before Coding Starts

A few choices affect the schema/integration code directly, so I'd rather confirm them now than guess:

1. **Postgres provider** — Neon, Supabase, or one you already have? (Affects connection pooling setup in `packages/database`.)
2. **Embeddings model for duplicate detection** — Anthropic doesn't ship a first-party embeddings model via the AI SDK. Options: Voyage AI (Anthropic's recommended partner) or OpenAI embeddings. Which would you prefer to account for/key for?
3. **AI model** — defaulting to Claude (via `@ai-sdk/anthropic`) for all generation/review steps unless you want a different provider.
4. **Workflow status UI** — Inngest Realtime (push) vs. simple polling for the Kanban/review progress indicators. Polling is simpler to ship correctly; Realtime is nicer UX. Lower priority, can default to polling.
5. **GitHub App registration** — you'll need to register the GitHub App yourself (App ID, private key, webhook secret) since that requires your GitHub account. I'll document exactly what to fill in.

Once you weigh in on 1–3 (4–5 I'm comfortable defaulting), I'll start on step 1 of the build sequence.
