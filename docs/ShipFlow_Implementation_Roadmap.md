# ShipFlow AI — Complete Implementation Roadmap
### Score Recovery: 39 → 95/100 | Engineering Design Document + Sprint Plan + Kiro Spec + Task Pack

> **Document Purpose:** This is a fully self-contained implementation roadmap for a team of engineers to close every identified scoring gap in the ShipFlow AI hackathon project. Every task is decomposed to the file level, every acceptance criterion is testable, and every dependency is named. No prior knowledge of the codebase is assumed beyond what is described here.

---

## SCORE BASELINE & RECOVERY TARGETS

| Category | Current | Target | Delta | Priority |
|---|---|---|---|---|
| Core Workflow Implementation | 5/20 | 19/20 | +14 | P0 |
| AI Agent Quality | 10/20 | 18/20 | +8 | P0 |
| GitHub Integration | 11/15 | 14/15 | +3 | P1 |
| Review Loop & Human Approval | 3/15 | 14/15 | +11 | P0 |
| tRPC Monorepo & Engineering Quality | 6/15 | 13/15 | +7 | P1 |
| SaaS Product Experience | 3/10 | 9/10 | +6 | P1 |
| Demo & Documentation | 1/5 | 5/5 | +4 | P2 |
| **TOTAL** | **39/100** | **92/100** | **+53** | — |

---

## PART 1 — MASTER GAP ANALYSIS

### 1.1 Missing Requirements (0% Implementation)

#### GAP-01: Feature Request Creation — No Entry Point to the Entire Product
- **Requirement (init.md):** "User creates a feature request via email, support ticket, customer service call (or) any mode"
- **Why It Matters:** This is the literal first step of the described workflow. Without it, a judge cannot trigger any part of the product. `grep -r "insert(featureRequests"` across the entire repo returns zero results.
- **Impact on Score:** –5 pts Core Workflow, –2 pts SaaS UX (missing page), –1 pt AI Agent (clarification loop can never fire)
- **Affected Rubric Categories:** Core Workflow, SaaS UX, AI Agent Quality
- **Files Affected:** `packages/trpc/server/routes/feature/route.ts`, `packages/services/src/feature/feature.service.ts`, `packages/services/src/feature/feature.repository.ts`, `apps/web/src/app/(dashboard)/org/[slug]/features/page.tsx` (new), `apps/web/src/app/(dashboard)/org/[slug]/features/new/page.tsx` (new)

#### GAP-02: AI Clarification Agent — Tables Exist, Zero Logic
- **Requirement:** "AI Agent must gather missing requirements by asking follow-up questions"
- **Evidence:** `clarificationThreads` and `clarificationMessages` tables exist in `packages/db/models/features.ts` but `grep` across all packages for these table names returns only the schema definition. No service, no AI agent, no UI, no tRPC procedure touches them.
- **Impact on Score:** –1 pt Core Workflow, –2 pts AI Agent Quality (clarifier agent missing)
- **Files Affected:** New `packages/ai/src/agents/clarifier/` directory, new tRPC procedures, new UI component

#### GAP-03: Duplicate/Exists Detection — Completely Absent
- **Requirement:** "User might not be aware if such offering is already present so we shall educate in such cases"
- **Evidence:** Zero occurrences of "duplicate" logic in any service or agent.
- **Impact on Score:** –1 pt Core Workflow
- **Files Affected:** `packages/ai/src/agents/clarifier/index.ts` (can be embedded here), `packages/services/src/feature/feature.service.ts`

#### GAP-04: PRD Generator Agent — Not Created
- **Requirement:** "AI Agent will next generate a structured PRD plan" including problem statement, goals, non-goals, user stories, acceptance criteria, edge cases, success metrics
- **Evidence:** No PRD-generation agent exists. The `planner` agent generates tasks, not PRDs. `featurePrdGenerated` Inngest function only flips `status` to `PRD_GENERATED` — no AI call, no row inserted to `prds` or `prdVersions`.
- **Impact on Score:** –3 pts Core Workflow, –4 pts AI Agent (planner agent is dead code)
- **Files Affected:** New `packages/ai/src/agents/prd-generator/`, `packages/workflow/src/workflows/feature-lifecycle.ts`

#### GAP-05: Five Required UI Pages Entirely Absent
- **Requirement (init.md):** Feature Requests, PRD Editor, Task Board, Review History, Billing/Pricing pages
- **Evidence:** None of these directories exist under `apps/web/src/app/(dashboard)/`
- **Impact on Score:** –3 pts SaaS UX, –2 pts Core Workflow
- **Files Affected:** 5 new page directories to create

#### GAP-06: Blocking/Non-Blocking Issue Classification — Zero Schema Support
- **Requirement:** "Issues are categorized as: Blocking, Non-blocking"
- **Evidence:** The `reviewFindings` table has no `severity` or `isBlocking` field. `grep -i blocking` returns one unrelated comment. The `findingTypeEnum` has no severity dimension.
- **Impact on Score:** –3 pts Review Loop & Approval (approval gate cannot enforce blocking issues)
- **Files Affected:** `packages/db/models/github.ts`, `packages/ai/src/agents/code-reviewer/schema.ts`, `packages/services/src/db/reviews.ts`

#### GAP-07: Release Readiness Agent — Not Created
- **Requirement:** "release readiness checks" listed as an Inngest async workflow and AI capability
- **Evidence:** No release readiness agent or workflow exists anywhere.
- **Impact on Score:** –1 pt AI Agent Quality
- **Files Affected:** New `packages/ai/src/agents/release-readiness/`, `packages/workflow/src/workflows/`

### 1.2 Partially Implemented Features

#### PARTIAL-01: PRD Generation — 10% (Status Flip Only)
- **Existing Implementation:** `FeatureService.generatePRD()` validates state and fires `feature.prd.generated` Inngest event. The listener `featurePrdGenerated` updates the DB status to `PRD_GENERATED`.
- **Missing Implementation:** No call to any AI agent. No row inserted to `prds`. No row inserted to `prdVersions`. The `runPlanningAgent` exists but has zero callers. The Inngest function is not even registered in `apps/web/src/app/api/inngest/route.ts`.
- **Required Completion Work:** Wire `featurePrdGenerated` to (1) call a new PRD-generation AI agent, (2) insert a `prds` row, (3) insert a `prdVersions` row with the AI-generated JSONB content, (4) register the function in `serve()`.

#### PARTIAL-02: Task Generation — 5% (Status Flip Only)
- **Existing Implementation:** `FeatureService.generateTasks()` fires `feature.tasks.generated` event. Listener flips status to `TASKS_GENERATED`.
- **Missing Implementation:** No call to `runPlanningAgent`. No rows inserted to `epics` or `tasks`. Function not registered.
- **Required Completion Work:** Wire `featureTasksGenerated` to (1) fetch the PRD content from the DB, (2) call `runPlanningAgent(prdContent)`, (3) insert `epics` rows, (4) insert `tasks` rows with acceptance criteria as `subtasks`.

#### PARTIAL-03: Inngest Function Registration — 5 Functions Missing
- **Existing Implementation:** `packages/workflow/src/index.ts` exports all functions including `featurePrdGenerated`, `featureTasksGenerated`, `featurePlanApproved`, `featureReviewFailed`, `featureHumanApproved`.
- **Missing Implementation:** `apps/web/src/app/api/inngest/route.ts` `serve()` call includes only `reviewPullRequestWorkflow`, `generateReleaseNotesWorkflow`, `billingSyncWorkflow`, `syncRepositoryWorkflow`. The five lifecycle functions are exported but never passed to `serve()`.
- **Required Completion Work:** Add all five to the `functions: []` array. This is a 5-line fix with +2 scoring impact.

#### PARTIAL-04: AI Code Review Grounding — 20% (Diff Only, No PRD)
- **Existing Implementation:** `runCodeReview(diffContent, contextSnippets)` correctly reviews diff + Pinecone RAG context. Finding type `PRD_DEVIATION` exists in schema.
- **Missing Implementation:** PRD content, acceptance criteria, and task list are never passed to the reviewer. `PRD_DEVIATION` findings are structurally impossible.
- **Required Completion Work:** Modify `review-pull-request.ts` to (1) query the `prds`/`prdVersions` table for any PRD linked to the feature request associated with this PR, (2) pass PRD content into `runCodeReview` as a new parameter, (3) update the system prompt to explicitly cross-reference against acceptance criteria.

#### PARTIAL-05: Human Approval Gate — 15% (Role Check Only)
- **Existing Implementation:** `approveHumanRelease()` checks caller role and feature status.
- **Missing Implementation:** (a) Never inspects `reviewFindings` for unresolved blocking issues before allowing `SHIPPED`. (b) The `approvals` table is never written to anywhere in the codebase. (c) No state transition from `IN_REVIEW → AWAITING_HUMAN_APPROVAL` is implemented.
- **Required Completion Work:** (1) Add blocking-findings check before `SHIPPED` transition. (2) Write an `approvals` row with approverId, timestamp, and a HMAC-based signature. (3) Implement the `IN_REVIEW → AWAITING_HUMAN_APPROVAL` state transition in a new service method.

#### PARTIAL-06: Fix→Re-Review Cycle — 30% (PR Level Only)
- **Existing Implementation:** A `synchronize` webhook fires a new AI review workflow. This mechanically re-reviews the PR at the code level.
- **Missing Implementation:** (a) Feature-level state machine has no `FIX_NEEDED → IN_REVIEW` transition. (b) Old AI review comments are not dismissed/superseded. (c) There is no cross-review memory — new review has no awareness of what was previously flagged.
- **Required Completion Work:** (1) Add `fixNeededToReview()` service method. (2) Add stale-review dismissal Octokit call before posting new review. (3) Pass previous review findings as context to new AI review call.

#### PARTIAL-07: Multi-Tenant Data Isolation — 55% (IDOR Bug)
- **Existing Implementation:** Org creation, listing, slug-scoped routing all work. `protectedProcedure` verifies session.
- **Missing Implementation:** `FeatureRepository.getFeatureById(featureId)` has no `orgId` filter. A caller with ADMIN in their own org can act on a `featureId` belonging to a different org (classic IDOR).
- **Required Completion Work:** (1) Add `orgId` parameter to `getFeatureById`. (2) Add `and(eq(featureRequests.id, featureId), eq(featureRequests.orgId, orgId))` filter. (3) Audit all repository methods for the same pattern.

#### PARTIAL-08: Razorpay Billing — 25% (Logic Exists, No Callers)
- **Existing Implementation:** `createCheckoutSession`, `checkAIAccess`, `incrementTokenUsage`, `cancelSubscription` are well-written. Razorpay webhook route exists and forwards `subscription.charged` to Inngest.
- **Missing Implementation:** Zero tRPC router for billing. No billing page. `checkAIAccess()` never called before AI operations. `createCheckoutSession` never called from any UI.
- **Required Completion Work:** (1) Create `packages/trpc/server/routes/billing/route.ts`. (2) Create `apps/web/src/app/(dashboard)/org/[slug]/billing/page.tsx`. (3) Create `apps/web/src/app/(marketing)/pricing/page.tsx`. (4) Gate `reviewPullRequestWorkflow` behind `checkAIAccess`.

#### PARTIAL-09: PR Detail Page — 5% (Fully Hardcoded Mock)
- **Existing Implementation:** Route `pr/[id]/page.tsx` renders, receives `id` param, shows UI shell.
- **Missing Implementation:** The `id` param is never used to query the DB. Title is hardcoded "Refactor billing webhooks". Author is hardcoded "bob-dev". `reviewFindings` are never queried. `DiffViewer` shows a fake diff. `SecurityAlerts` shows a fabricated "timing attack" finding.
- **Required Completion Work:** Full rewrite to query real `pullRequests`, `pullRequestReviews`, `reviewFindings` data using the route `id` (the GitHub PR number for this org).

#### PARTIAL-10: Dashboard Metrics — 0% Real Data
- **Existing Implementation:** UI is visually polished. Cards render.
- **Missing Implementation:** `stat-cards.tsx` has hardcoded "142", "28", "104h", "94%". `activity-feed.tsx` has 4 fabricated entries. `deployments-list.tsx` has `dummyDeployments` array. Chart is a literal placeholder text string.
- **Required Completion Work:** Rewrite all three components to query real data from DB (pull request counts, review findings counts, org member activity).

#### PARTIAL-11: tRPC API Surface — 35% (Mostly Raw DB Queries)
- **Existing Implementation:** tRPC is correctly configured with context, protected procedures, OpenAPI export.
- **Missing Implementation:** Only 4 routers, ~7 procedures. PR list, GitHub repos, org members, and all settings data fetched via direct Drizzle calls in Server Components or raw `fetch()` to Route Handlers — not via tRPC.
- **Required Completion Work:** Create routers for `pullRequest`, `repository`, `member`, `billing`, `feature.query`, and migrate Server Component raw queries to tRPC server-side calls.

### 1.3 Suspected Mocked/Placeholder Features

| Component | File | Evidence | Required Fix |
|---|---|---|---|
| Stat Cards | `components/dashboard/stat-cards.tsx` | Hardcoded literals "142", "28", "104h", "94%" | Query real counts from DB |
| Deployments List | `components/dashboard/deployments-list.tsx` | Variable `dummyDeployments` with "Live Feed" badge | Query real `deployments` table |
| Activity Feed | `components/dashboard/activity-feed.tsx` | 4 fabricated PR entries | Query real `pullRequests` + `pullRequestReviews` |
| PR Detail Page | `app/(dashboard)/org/[slug]/pr/[id]/page.tsx` | Ignores `id` param; hardcoded title/author | Full rewrite with real DB queries |
| DiffViewer | `components/pr/diff-viewer.tsx` | Hardcoded diff content | Fetch real diff from GitHub API |
| SecurityAlerts | `components/pr/security-alerts.tsx` | Fabricated "timing attack" finding | Query real `reviewFindings` |
| Member List | `components/settings/member-list.tsx` | 3 hardcoded fake users | Query real `members` table |
| Trigger Analysis CTA | `app/(dashboard)/org/[slug]/page.tsx` | Always links to `/pr/1` | Link to most recent real PR |
| Sidebar Usage Meter | `components/layout/sidebar.tsx` | Hardcoded "142 / 500 AI PR Analyses" | Query real `usageRecords` |
| Recharts Chart | `app/(dashboard)/org/[slug]/page.tsx` | Literal text `[Recharts AreaChart Placeholder]` | Implement real Recharts component |

### 1.4 Architecture Weaknesses

| Issue | Severity | Location | Fix |
|---|---|---|---|
| IDOR: no orgId filter in feature queries | Critical | `feature.repository.ts:6-9` | Add orgId parameter to all queries |
| No tenant isolation middleware | High | `packages/trpc/server/trpc.ts` | Create `orgMemberProcedure` that validates orgId membership |
| `reviewFindings` is write-only | Critical | Entire codebase | Add query procedures; wire to UI |
| `approvals` table never written | High | `feature.service.ts:69-85` | Add insert on `approveHumanRelease` |
| 5 Inngest functions unregistered | Critical | `apps/web/src/app/api/inngest/route.ts` | Add to `functions: []` array |
| GitHub review always `COMMENT` event | Medium | `packages/services/src/github/comments.ts` | Use `REQUEST_CHANGES` when blocking findings exist |
| No stale comment dismissal | Medium | `review-pull-request.ts` | Call `octokit.rest.pulls.dismissReview` before new review |
| GitHub callback CSRF gap | Medium | `apps/api/github/callback/route.ts` | Use signed `state` parameter (HMAC) |
| `.env` shipped in ZIP with real values | High | Root `.env` file | Add to `.gitignore`, create `.env.example` |
| `apps/api` internally called "Streamyst" | Low | `apps/api/src/` | Rename to ShipFlow |
| `apps/web/app_backup` directory | Low | `apps/web/app_backup/` | Delete from repo |
| No AI credit gating | High | `review-pull-request.ts` | Call `checkAIAccess()` before `runCodeReview()` |
| Single `protectedProcedure` for all mutations | Medium | `packages/trpc/server/trpc.ts` | Add role-scoped procedures |
| No index on `featureRequests.orgId` | Medium | `packages/db/models/features.ts` | Add DB index |

---

## PART 2 — RUBRIC RECOVERY STRATEGY

### 2.1 Category 1: Core Workflow Implementation (5 → 19/20, +14 pts)

**Current Problems:**
1. No feature request creation path — no tRPC mutation, no UI, no DB insert
2. `generatePRD()` and `generateTasks()` are pure status flips — no AI, no data written
3. Five Inngest lifecycle functions are unregistered — events fire into void
4. State machine has no transitions after `PLAN_APPROVED`
5. No clarification loop, no duplicate detection

**Desired State:**
A user can: (1) create a feature request → (2) engage in AI clarification Q&A → (3) have a PRD auto-generated with real structured content → (4) have tasks auto-generated on a Kanban board → (5) review and approve the plan → (6) see the feature progress through development states

**Required Features:**
- Feature request creation form + tRPC mutation + DB insert
- AI clarification agent with multi-turn conversation
- PRD generator agent + DB write to `prds`/`prdVersions`
- Task generator using planner agent + DB write to `epics`/`tasks`/`subtasks`
- Inngest function registration fix
- State machine transitions: `PLAN_APPROVED → IN_DEVELOPMENT`, `IN_DEVELOPMENT → IN_REVIEW`, `IN_REVIEW → AWAITING_HUMAN_APPROVAL`

**Implementation Tasks:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-022

**Acceptance Criteria:**
- [ ] A user can fill a form and have a feature request created in the DB
- [ ] AI responds with clarifying questions when description is vague
- [ ] `prds` table has a row with full JSONB content after PRD generation
- [ ] `tasks` table has rows after task generation
- [ ] All five Inngest functions appear in Inngest dev server dashboard
- [ ] A feature can progress from `SUBMITTED` to `SHIPPED` through the entire state machine

**Estimated Score Recovery:** +14 pts (5 → 19/20)

### 2.2 Category 2: AI Agent Quality (10 → 18/20, +8 pts)

**Current Problems:**
1. Planner agent exists but is dead code (no callers)
2. `PRD_DEVIATION` finding type is structurally unreachable (no PRD passed to reviewer)
3. No clarifier, no release-readiness agent
4. No memory between re-reviews — each review is stateless

**Agent Architecture Improvements Required:**

**Agent 1: PRD Generator** (new)
- Input: feature request title, raw description, clarification Q&A transcript
- Output: Structured PRD with problem statement, goals, non-goals, user stories (at least 3), acceptance criteria (at least 5), edge cases (at least 3), success metrics
- Implementation: Zod schema + `generateObject` + system prompt engineering

**Agent 2: Clarifier** (new)
- Input: feature request raw description, existing PRDs in org (for duplicate detection), conversation history
- Output: `{ needsClarification: boolean, isDuplicate: boolean, duplicateInfo?: string, question?: string }`
- Multi-turn: Each response either adds a message to `clarificationMessages` or resolves the thread
- Implementation: `generateObject` with structured output schema

**Agent 3: Planner** (wire existing)
- Already implemented. Just needs callers in the Inngest workflow.
- Input: PRD content as string
- Output: tasks array with acceptance criteria

**Agent 4: Code Reviewer** (enhance existing)
- Add `prdContext: string` parameter to `runCodeReview()`
- Update system prompt to explicitly require PRD cross-referencing
- Add `isBlocking: boolean` to the output schema

**Agent 5: Release Readiness** (new)
- Input: PRD, all tasks (with status), all review findings, PR state
- Output: `{ isReady: boolean, blockers: string[], warnings: string[], recommendation: string }`
- Called during `AWAITING_HUMAN_APPROVAL` stage to surface a readiness verdict

**Cross-Review Memory:**
- Pass previous `reviewFindings` rows as context to new `runCodeReview` call
- Include in system prompt: "The following issues were flagged in previous reviews. For each, note whether it has been addressed."

**Acceptance Criteria:**
- [ ] Clarifier agent asks at least one clarifying question for vague inputs
- [ ] Clarifier agent detects duplicate requests and educates user
- [ ] PRD generator produces all 7 required PRD sections
- [ ] Code reviewer includes `isBlocking` on every finding
- [ ] PRD content is included in code reviewer context; `PRD_DEVIATION` findings appear on real diffs
- [ ] Re-review includes previous findings as context in the prompt
- [ ] Release readiness agent produces pass/fail verdict with reasons

**Estimated Score Recovery:** +8 pts (10 → 18/20)

### 2.3 Category 3: GitHub Integration (11 → 14/15, +3 pts)

**Current Problems:**
1. AI reviews always posted as `COMMENT`, never `REQUEST_CHANGES` — GitHub branch protection cannot block merges
2. No stale review dismissal on `synchronize` — old AI comments accumulate
3. GitHub callback does not validate `state` as a signed token (CSRF risk)
4. Zero tests for the review pipeline

**Required Fixes:**

**Fix 1: Use `REQUEST_CHANGES` for Blocking Findings**
- After adding `isBlocking` to findings schema (TASK-003), check if `reviewResult.comments.some(c => c.isBlocking)`
- If yes: post with `event: "REQUEST_CHANGES"`
- If no blocking findings: post with `event: "COMMENT"`

**Fix 2: Stale Review Dismissal**
- On `synchronize` action, before posting new review, call: `octokit.rest.pulls.listReviews()` to find previous AI reviews (identified by bot user), then `octokit.rest.pulls.dismissReview()` for each with message "Superseded by new review for commit {headSha}"

**Fix 3: CSRF-Safe State Parameter**
- In `apps/web/src/components/github/connect-card.tsx`, generate state as `HMAC-SHA256(orgId + timestamp, SESSION_SECRET)`
- In `apps/web/src/app/api/github/callback/route.ts`, verify the HMAC before using state value

**Fix 4: Add Tests**
- Add Vitest tests for `verifyGithubWebhook`, `findDiffPosition`, and `postReviewComment`

**Acceptance Criteria:**
- [ ] A PR with a SECURITY blocking finding causes GitHub to show "Changes requested" status
- [ ] On PR push, old AI review comments are dismissed before new ones posted
- [ ] GitHub installation with tampered `state` param is rejected with 403
- [ ] `findDiffPosition` test covers hunk headers, deletions, and context lines

**Estimated Score Recovery:** +3 pts (11 → 14/15)

### 2.4 Category 4: Review Loop & Human Approval (3 → 14/15, +11 pts)

**Current Problems:**
1. PR detail page is 100% hardcoded — judges see fake data
2. `reviewFindings` is write-only — never queried in any UI
3. `approvals` table never written to
4. No enforced blocking-findings check before `SHIPPED`
5. No state transition into `AWAITING_HUMAN_APPROVAL`
6. Feature-level `FIX_NEEDED → IN_REVIEW` transition missing

**State Machine Design (Full):**

```
SUBMITTED ──(createFeature)──▶ SUBMITTED
SUBMITTED ──(startClarification)──▶ CLARIFYING
CLARIFYING ──(resolveClarification)──▶ CLARIFIED
CLARIFIED ──(generatePRD)──▶ [Inngest: PRD_GENERATED]
PRD_GENERATED ──(generateTasks)──▶ [Inngest: TASKS_GENERATED]
TASKS_GENERATED ──(approvePlan)──▶ [Inngest: PLAN_APPROVED]
PLAN_APPROVED ──(linkPR)──▶ IN_DEVELOPMENT
IN_DEVELOPMENT ──(prOpened webhook)──▶ IN_REVIEW
IN_REVIEW ──(reviewPassed)──▶ AWAITING_HUMAN_APPROVAL
IN_REVIEW ──(reviewFailed)──▶ FIX_NEEDED
FIX_NEEDED ──(prSynchronize webhook)──▶ IN_REVIEW
AWAITING_HUMAN_APPROVAL ──(humanApprove)──▶ SHIPPED
AWAITING_HUMAN_APPROVAL ──(humanReject)──▶ FIX_NEEDED
* ──(adminReject)──▶ REJECTED
```

**PR Detail Page Rewrite (Full Data Requirements):**
- Pull Request metadata: `pullRequests` table (title, state, url, githubPrNumber, headSha)
- Repository: `repositories` table (fullName)
- Review history: `pullRequestReviews` table sorted by `createdAt desc`
- For each review: `reviewFindings` with `isBlocking`, `findingType`, `filePath`, `lineNumber`, `description`, `suggestion`, `status`
- Summary: AI review `summary` field from `pullRequestReviews`
- Human approval status: `approvals` table
- Feature context: linked `featureRequests` → `prds` → `prdVersions` (current version)

**Approval Write:**
- On `approveHumanRelease()`: Insert `approvals` row with `approverId`, `pullRequestId`, `timestamp`, and `signature = HMAC-SHA256(pullRequestId + approverId + timestamp, APPROVAL_SECRET)`

**Blocking Check:**
- Before transitioning to `SHIPPED`: query `reviewFindings WHERE reviewId IN (latest review) AND isBlocking = true AND status = 'OPEN'`
- If any exist: throw `Error("Cannot ship: {n} blocking issue(s) remain unresolved")`

**Acceptance Criteria:**
- [ ] PR detail page shows real title, real author (GitHub username), real state from DB
- [ ] Review findings section shows all findings grouped by type with blocking badge
- [ ] Each finding shows file path, line number, description, and suggested fix
- [ ] Approve button is disabled when blocking findings exist and shows tooltip explaining why
- [ ] `approvals` table has a row after every successful human approval
- [ ] Feature cannot reach `SHIPPED` if any blocking findings remain open
- [ ] Re-review state transition works: `FIX_NEEDED → IN_REVIEW` on new PR push

**Estimated Score Recovery:** +11 pts (3 → 14/15)

### 2.5 Category 5: tRPC Monorepo & Engineering Quality (6 → 13/15, +7 pts)

**Current Problems:**
1. Only 4 routers, ~7 procedures total — majority of data fetched via raw DB calls in Server Components
2. No centralized tenant/org membership validation in tRPC middleware
3. IDOR bug: `getFeatureById` has no orgId filter
4. Tests target a non-existent `/pricing` route; 5 test cases total
5. Hygiene issues: `app_backup`, "Streamyst" references, `.env` with real values

**Architecture Refactor Plan:**

**New tRPC Routers Required:**
```
packages/trpc/server/routes/
├── billing/route.ts       (createCheckout, getSubscription, getUsage, cancelSubscription)
├── feature/route.ts       (EXPAND: add create, list, getById, getClarificationThread, addClarificationMessage)
├── pullRequest/route.ts   (list, getById with reviews and findings)
├── repository/route.ts    (list, sync, getSyncStatus)
├── member/route.ts        (list, invite, updateRole, remove)
├── prd/route.ts           (getByFeature, getVersion, updateContent)
├── task/route.ts          (list, updateStatus, assign, getKanban)
└── organization/route.ts  (EXPAND: update, getStats, getActivity)
```

**New Middleware:**
```typescript
// packages/trpc/server/trpc.ts
export const orgMemberProcedure = t.procedure
  .use(isAuthenticated)
  .use(async ({ ctx, next, rawInput }) => {
    const orgSlug = (rawInput as any)?.orgSlug || (rawInput as any)?.orgId;
    // validate user is a member of this org
    const membership = await db.query.members.findFirst({
      where: and(eq(members.userId, ctx.session.user.id), eq(members.orgId, orgId))
    });
    if (!membership) throw new TRPCError({ code: 'FORBIDDEN' });
    return next({ ctx: { ...ctx, membership, orgId } });
  });
```

**Server Component Migration:**
- `app/(dashboard)/org/[slug]/pr/page.tsx`: Replace raw `db.select()` with `api.pullRequest.list({ orgSlug: slug })`
- `components/github/repos-list.tsx`: Replace `fetch('/api/github/repos')` with `api.repository.list({ orgSlug })`
- `components/settings/member-list.tsx`: Replace hardcoded with `api.member.list({ orgSlug })`

**Test Fixes:**
- Delete `billing.spec.ts` (tests non-existent route) or implement the pricing page first
- Add Vitest unit tests for: `findDiffPosition`, `FeatureService` state transitions, `checkAIAccess` limit enforcement
- Add at minimum 10 test cases covering critical paths

**Hygiene Fixes:**
- Delete `apps/web/app_backup/`
- Rename "Streamyst" to "ShipFlow" in `apps/api/src/`
- Add `.env` to `.gitignore`, create `.env.example` with all keys and placeholder values
- Add `orgId` index to `featureRequests` table

**Acceptance Criteria:**
- [ ] All product data (PRs, repos, members, features, billing) flows through tRPC procedures
- [ ] `orgMemberProcedure` middleware validates org membership on every mutation
- [ ] `getFeatureById` includes `and(eq(featureRequests.orgId, orgId))` filter
- [ ] At least 15 test cases passing, including at least one test per critical service method
- [ ] No raw `.env` file with real values ships in the repository
- [ ] `apps/api` has no "Streamyst" references

**Estimated Score Recovery:** +7 pts (6 → 13/15)

### 2.6 Category 6: SaaS Product Experience (3 → 9/10, +6 pts)

**Required Pages and Their Data Sources:**

| Page | Route | Primary Data Source | Status |
|---|---|---|---|
| Feature Requests List | `/org/[slug]/features` | `featureRequests` table | Create |
| New Feature Request | `/org/[slug]/features/new` | tRPC `feature.create` mutation | Create |
| Feature Detail / PRD Editor | `/org/[slug]/features/[id]` | `featureRequests` + `prds` + `prdVersions` | Create |
| Task Board / Kanban | `/org/[slug]/features/[id]/tasks` | `epics` + `tasks` + `subtasks` | Create |
| Review History | `/org/[slug]/reviews` | `pullRequestReviews` + `reviewFindings` | Create |
| Billing / Pricing | `/org/[slug]/billing` | tRPC `billing.*` | Create |

**Dashboard Fixes:**
- `stat-cards.tsx`: Query `count(pullRequests)`, `count(reviewFindings WHERE findingType='SECURITY' OR isBlocking=true)`, sum of `usageRecords.prAnalyses`, approval rate from `pullRequests WHERE state='MERGED'` / total
- `activity-feed.tsx`: Query `pullRequestReviews JOIN pullRequests ORDER BY createdAt DESC LIMIT 10`
- `deployments-list.tsx`: Query real `deployments` table
- Chart: Implement `AreaChart` from recharts with 7-day PR analysis volume from `pullRequestReviews.createdAt`

**Sidebar Additions:**
- Add "Feature Requests" nav item linking to `/org/${orgSlug}/features`
- Add "Review History" nav item linking to `/org/${orgSlug}/reviews`
- Add "Billing" nav item linking to `/org/${orgSlug}/billing`
- Fix usage meter to read from real `usageRecords` + plan limits

**UX Polish Required:**
- Loading skeletons on all async data (use `Skeleton` component already imported in UI)
- Empty states on every list page (like the excellent empty state already on PR list page)
- Toast notifications (Sonner already installed) on all mutations: feature created, PRD generated, plan approved, shipped
- Error boundaries for all server components

**Inngest Progress Visibility:**
- Add a `WorkflowStatus` component that polls a tRPC endpoint showing current Inngest run status for a feature's active workflows
- Display on Feature Detail page with step-by-step progress: "Generating PRD... ✓ → Generating Tasks... ⏳"

**Acceptance Criteria:**
- [ ] All 13 recommended pages from init.md exist and render real data
- [ ] Dashboard stat cards show real numbers from DB queries
- [ ] Activity feed shows real PR review events
- [ ] All list pages have proper empty states
- [ ] Workflow progress is visible on Feature Detail page during Inngest processing
- [ ] No hardcoded mock data anywhere in the UI

**Estimated Score Recovery:** +6 pts (3 → 9/10)

### 2.7 Category 7: Demo & Documentation (1 → 5/5, +4 pts)

**README.md Requirements (must replace current Turborepo starter template):**

```markdown
# ShipFlow AI — AI-Powered Product Delivery Platform

## Overview
[1-paragraph description matching init.md language]

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
[Package dependency diagram in ASCII or Mermaid]

## Setup Instructions
[Step-by-step local setup with prerequisites]

## Environment Variables
[Complete table with every env var, description, and example]

## Database Schema Notes
[Description of main tables and relationships]

## GitHub Integration Setup
[How to create a GitHub App, configure webhooks, install]

## Inngest Workflow Explanation
[Description of each workflow and what triggers it]

## AI Features Implemented
[List all agents with what they do]
```

**Live Deployment:**
- Deploy to Vercel (already has `vercel.json` configured)
- Set up Neon or Supabase PostgreSQL
- Configure all environment variables in Vercel dashboard
- Include live URL in README

**Demo Video (5-minute script):**
1. Landing page → Register → Onboarding (create org)
2. Connect GitHub repo → show real repo list
3. Create feature request → AI clarification Q&A
4. Generate PRD → show structured PRD content
5. Generate tasks → show Kanban board
6. Approve plan
7. Open real GitHub PR → show webhook fires
8. Show AI review in ShipFlow PR detail page + on GitHub PR
9. Human approval flow → ship

**Acceptance Criteria:**
- [ ] `README.md` contains all 9 required sections from init.md
- [ ] Live deployment URL is accessible and functional
- [ ] Demo video is ≥ 3 minutes and shows the complete core loop
- [ ] `docs/DEPLOYMENT.md` is linked from README
- [ ] `.env.example` is present with all required variables

**Estimated Score Recovery:** +4 pts (1 → 5/5)

---

## PART 3 — KIRO-STYLE FEATURE SPECIFICATIONS

### SPEC-001: Feature Request Creation & Clarification

**Feature Name:** AI-Assisted Feature Request Intake

**Problem Statement:** The product has no entry point. No user can create a feature request, making the entire described workflow unreachable. The clarification Q&A tables exist in the schema but are completely unused.

**Business Value:** Enables the core product loop. Without this, no other feature in the system is accessible to users.

**User Story:**
> As a Product Manager, I want to submit a feature request and have the AI ask me clarifying questions, so that the generated PRD is grounded in complete requirements rather than assumptions.

**Functional Requirements:**

- FR-1: A form exists at `/org/[slug]/features/new` with fields: Title (required, 5-200 chars), Description (required, 20-2000 chars), Channel (enum: IN_APP, EMAIL, SUPPORT_TICKET, CALL), ProjectId (required select)
- FR-2: On submit, a `feature.create` tRPC mutation creates a `featureRequests` row with status `SUBMITTED`
- FR-3: Immediately after creation, the clarifier AI agent evaluates the description and either (a) marks it as needing clarification → status `CLARIFYING`, creates `clarificationThreads` row, returns first question or (b) marks it complete → status `CLARIFIED`, skips clarification
- FR-4: When in `CLARIFYING` state, the Feature Detail page shows a conversation UI. User replies to AI questions. Each exchange creates `clarificationMessages` rows.
- FR-5: The clarifier agent detects if a similar feature already exists by embedding the description and querying Pinecone. If cosine similarity > 0.85 with an existing feature: educate user with the existing feature's title/link and ask if they want to proceed anyway.
- FR-6: When the clarifier resolves the thread (`isResolved = true`), status transitions to `CLARIFIED`. The user sees a "Generate PRD" button.

**Non-Functional Requirements:**

- NFR-1: Feature creation tRPC mutation must respond in < 500ms (async AI work is deferred to Inngest)
- NFR-2: Clarifier AI must respond to each user message within 10 seconds (acceptable for interactive use)
- NFR-3: Clarification history must be persisted and resumable (user can close tab and return)
- NFR-4: All feature requests must be scoped to their `orgId` — no cross-tenant reads

**Technical Design:**

API Design:
```typescript
// packages/trpc/server/routes/feature/route.ts additions
feature.create: orgMemberProcedure
  .input(z.object({
    orgSlug: z.string(),
    projectId: z.string(),
    title: z.string().min(5).max(200),
    rawDescription: z.string().min(20).max(2000),
    channel: z.enum(["IN_APP", "EMAIL", "SUPPORT_TICKET", "CALL"]),
  }))
  .mutation(async ({ ctx, input }) => { ... })

feature.list: orgMemberProcedure
  .input(z.object({ orgSlug: z.string(), projectId: z.string().optional() }))
  .query(...)

feature.getById: orgMemberProcedure
  .input(z.object({ featureId: z.string(), orgId: z.string() }))
  .query(...)

feature.addClarificationReply: orgMemberProcedure
  .input(z.object({ featureId: z.string(), orgId: z.string(), message: z.string() }))
  .mutation(...)
```

Database Design:
- Add `channel` text column to `featureRequests` table
- `clarificationThreads`: already exists — no change needed
- `clarificationMessages`: already exists — no change needed

UI Design:
- `/org/[slug]/features/page.tsx`: List of feature requests with status badges, filter by status/project, create button
- `/org/[slug]/features/new/page.tsx`: Creation form with real-time character count
- `/org/[slug]/features/[id]/page.tsx`: Feature detail showing status timeline, clarification thread (if any), PRD content (if generated), task count

Error Handling:
- Duplicate title within same org: return 400 with `{ error: "A feature with this title already exists" }`
- ProjectId not in org: return 403
- Clarifier AI failure: create thread but mark it `isResolved=true` immediately with a system message "Clarification skipped due to service error"

Edge Cases:
- User submits description in non-English: clarifier should respond in same language
- Description is extremely long (> 2000 chars): truncate at form level; server validates
- Clarification thread already resolved: `addClarificationReply` returns 400

Telemetry:
- Track `feature.created` event with channel type for analytics
- Track `clarification.completed` event with number of rounds

Security:
- `orgMemberProcedure` middleware validates the user is a member of the org before any feature operation
- `getFeatureById` must include `and(eq(featureRequests.orgId, ctx.orgId), eq(featureRequests.id, input.featureId))`

Testing:
- Unit: `FeatureService.createFeature()` inserts correct row with SUBMITTED status
- Unit: `ClarifierAgent` returns `needsClarification: false` for detailed descriptions
- Unit: `ClarifierAgent` returns `isDuplicate: true` when similarity > 0.85
- Integration: Full creation flow via tRPC test client

Acceptance Criteria:
- [ ] Submitting form creates DB row, redirects to feature detail page
- [ ] Vague description triggers clarification Q&A
- [ ] Detailed description skips clarification
- [ ] Duplicate detection surfaces similar features
- [ ] All operations are scoped to correct org
- [ ] Status badge updates in real-time on feature list page

---

### SPEC-002: PRD Generation Pipeline

**Feature Name:** AI PRD Generator

**Problem Statement:** `FeatureService.generatePRD()` fires an event that updates a status field but never calls any AI or writes any PRD content. The `prds` and `prdVersions` tables are empty.

**User Story:**
> As a PM, I want to click "Generate PRD" and have the AI produce a structured Product Requirements Document from my feature request, so that the engineering team has a clear specification to work from.

**Functional Requirements:**

- FR-1: "Generate PRD" button visible on Feature Detail page when feature status is `CLARIFIED`
- FR-2: Clicking button calls `feature.generatePRD` tRPC mutation → fires Inngest event → Inngest workflow calls PRD generator AI agent
- FR-3: PRD generator produces: problem statement, goals (3+), non-goals (2+), user stories (3+), acceptance criteria (5+), edge cases (3+), success metrics (3+)
- FR-4: PRD content is stored as JSONB in `prdVersions.content` with a typed structure
- FR-5: `prds` row is created with `currentVersionId` pointing to the new version
- FR-6: `featureRequests.status` transitions to `PRD_GENERATED`
- FR-7: PRD Editor page at `/org/[slug]/features/[id]/prd` renders the PRD content with inline editing capability for human review and refinement
- FR-8: Each save of the editor creates a new `prdVersions` row (version 2, 3, etc.) with a `changeSummary`

**Technical Design:**

New Agent — `packages/ai/src/agents/prd-generator/`:
```typescript
// schema.ts
export const PRDSchema = z.object({
  problemStatement: z.string().min(50),
  goals: z.array(z.string()).min(3),
  nonGoals: z.array(z.string()).min(2),
  userStories: z.array(z.object({
    role: z.string(),
    action: z.string(),
    benefit: z.string(),
  })).min(3),
  acceptanceCriteria: z.array(z.string()).min(5),
  edgeCases: z.array(z.string()).min(3),
  successMetrics: z.array(z.object({
    metric: z.string(),
    target: z.string(),
    measurement: z.string(),
  })).min(3),
});

// index.ts
export async function runPRDGenerator(
  featureTitle: string,
  rawDescription: string,
  clarificationTranscript: string,
) { ... }
```

Inngest Workflow Changes — `feature-lifecycle.ts`:
```typescript
export const featurePrdGenerated = inngest.createFunction(
  { id: "feature-prd-generated" },
  { event: "feature.prd.generated" },
  async ({ event, step }) => {
    const { featureId, orgId } = event.data;

    // 1. Fetch feature + clarification messages
    const featureData = await step.run("fetch-feature", async () => { ... });
    
    // 2. Run PRD generator AI
    const prdContent = await step.run("generate-prd", async () => {
      return runPRDGenerator(feature.title, feature.rawDescription, transcript);
    });
    
    // 3. Insert prds row
    const prd = await step.run("insert-prd", async () => { ... });
    
    // 4. Insert prdVersions row
    await step.run("insert-prd-version", async () => { ... });
    
    // 5. Update feature status
    await step.run("update-status", async () => { ... });
  }
);
```

Acceptance Criteria:
- [ ] Clicking "Generate PRD" shows a loading state on the button
- [ ] After ~15 seconds, PRD content appears on the Feature Detail page
- [ ] All 7 PRD sections contain non-trivial AI-generated content
- [ ] `prds` table has exactly one row per feature (created on first generation)
- [ ] `prdVersions` table has one row per save, with incrementing `versionNumber`
- [ ] Inngest dev server shows the function executing with all 5 steps

---

### SPEC-003: Task Board & Kanban

**Feature Name:** AI Task Generation + Kanban Board

**Problem Statement:** `generateTasks()` emits an event that only flips status. No tasks are ever written to the DB. No Kanban UI exists.

**User Story:**
> As an Engineer, I want to see the AI-generated engineering tasks organized on a Kanban board, so that I can plan and track implementation of the approved feature.

**Functional Requirements:**

- FR-1: "Generate Tasks" button on Feature Detail page when status is `PRD_GENERATED`
- FR-2: Inngest workflow fetches PRD content, calls `runPlanningAgent(prdContent)`, inserts `epics` and `tasks` rows
- FR-3: Each task from the planner becomes a `tasks` row; its `acceptanceCriteria` become `subtasks` rows
- FR-4: Kanban board at `/org/[slug]/features/[id]/tasks` shows columns: BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE
- FR-5: Tasks can be dragged between columns (use `@dnd-kit/core` or similar), updating `tasks.status` via tRPC mutation
- FR-6: Each task card shows: title, estimation points, assignee avatar (if assigned), subtask completion count
- FR-7: Tasks can be assigned to org members via a dropdown
- FR-8: A task detail sheet shows full technical implementation details and all subtasks with checkboxes

**Technical Design:**

Inngest Change:
```typescript
export const featureTasksGenerated = inngest.createFunction(
  { id: "feature-tasks-generated" },
  { event: "feature.tasks.generated" },
  async ({ event, step }) => {
    const prd = await step.run("fetch-prd", async () => { ... });
    const prdContent = formatPRDAsText(prd); // helper to stringify JSONB PRD
    
    const plannerResult = await step.run("run-planner", async () => {
      const { result } = await runPlanningAgent(prdContent);
      return result;
    });
    
    await step.run("insert-epic", async () => {
      const [epic] = await db.insert(epics).values({
        orgId, projectId, prdId: prd.id,
        title: plannerResult.summary,
        description: plannerResult.summary,
      }).returning();
      
      for (const task of plannerResult.tasks) {
        const [taskRow] = await db.insert(tasks).values({
          orgId, epicId: epic.id,
          title: task.title,
          technicalImplementationDetails: task.description,
          estimationPoints: task.storyPoints,
        }).returning();
        
        await db.insert(subtasks).values(
          task.acceptanceCriteria.map(criterion => ({
            taskId: taskRow.id,
            description: criterion,
            isCompleted: false,
          }))
        );
      }
    });
    
    await step.run("update-status", async () => { ... });
  }
);
```

tRPC additions:
```typescript
task.getKanban: orgMemberProcedure
  .input(z.object({ featureId: z.string(), orgId: z.string() }))
  .query(...)  // returns tasks grouped by status with subtasks

task.updateStatus: orgMemberProcedure
  .input(z.object({ taskId: z.string(), status: taskStatusEnum, orgId: z.string() }))
  .mutation(...)

task.assign: orgMemberProcedure
  .input(z.object({ taskId: z.string(), memberId: z.string(), orgId: z.string() }))
  .mutation(...)
```

Acceptance Criteria:
- [ ] After clicking "Generate Tasks", tasks appear on the Kanban board within 30 seconds
- [ ] Each task has a title, story points, and at least 2 acceptance criteria as subtasks
- [ ] Dragging a task card updates its status in the DB
- [ ] Task detail sheet shows full `technicalImplementationDetails`
- [ ] Subtasks can be checked off, updating `isCompleted` in DB

---

### SPEC-004: Real PR Detail / Review History Page

**Feature Name:** AI Review Insights Page (Production)

**Problem Statement:** The PR detail page (`pr/[id]/page.tsx`) is 100% hardcoded mock content. `reviewFindings` is write-only — the AI correctly generates and stores findings, but no UI displays them.

**User Story:**
> As a Human Reviewer, I want to see all AI review findings for a pull request — grouped by severity, with file paths and line numbers — so that I can make an informed approval decision.

**Functional Requirements:**

- FR-1: Page queries `pullRequests` by `orgId + githubPrNumber` (the `id` URL param)
- FR-2: Page displays PR metadata: real title, real state, real GitHub URL, real repository name
- FR-3: Page shows all `pullRequestReviews` for this PR sorted by `createdAt desc` (review history)
- FR-4: For each review: shows commit SHA, review summary, all `reviewFindings` grouped by `findingType`
- FR-5: Each finding shows: `isBlocking` badge, `findingType` badge, file path, line number, description, `suggestion` in a code block
- FR-6: Findings can be marked as ADDRESSED or IGNORED via tRPC mutation
- FR-7: When all blocking findings are ADDRESSED or IGNORED, an "Approve for Release" button becomes active
- FR-8: "Approve for Release" calls `feature.approveHumanRelease`, which (a) checks for open blocking findings, (b) inserts approval record, (c) transitions feature to `SHIPPED`
- FR-9: Linked feature context panel shows: feature title, PRD summary, task completion ratio (X/Y tasks done)

**Technical Design:**

tRPC additions:
```typescript
pullRequest.getWithReviews: orgMemberProcedure
  .input(z.object({ orgSlug: z.string(), githubPrNumber: z.number() }))
  .query(async ({ ctx, input }) => {
    const pr = await db.query.pullRequests.findFirst({
      where: and(
        eq(pullRequests.orgId, ctx.org.id),
        eq(pullRequests.githubPrNumber, input.githubPrNumber)
      ),
      with: {
        repository: true,
        reviews: {
          with: { findings: { orderBy: [desc(reviewFindings.isBlocking)] } },
          orderBy: [desc(pullRequestReviews.createdAt)],
        },
        featureRequest: {
          with: { prds: { with: { currentVersion: true } } }
        }
      }
    });
    return pr;
  }),

finding.updateStatus: orgMemberProcedure
  .input(z.object({
    findingId: z.string(),
    status: z.enum(["OPEN", "ADDRESSED", "IGNORED"]),
    orgId: z.string(),
  }))
  .mutation(...)
```

Acceptance Criteria:
- [ ] Page renders with real PR title and state from DB
- [ ] All AI review findings are visible (not hardcoded)
- [ ] Blocking findings have a red "BLOCKING" badge
- [ ] Non-blocking findings have an amber "NON-BLOCKING" badge
- [ ] Findings can be individually marked as Addressed
- [ ] Approve button is disabled while any blocking findings remain OPEN
- [ ] Approval creates a record in the `approvals` table
- [ ] Approved feature transitions to SHIPPED status

---

### SPEC-005: Billing Integration

**Feature Name:** Razorpay Billing UI + Enforcement

**Problem Statement:** Complete Razorpay billing logic is implemented in `packages/billing/` but has zero callers, no UI, no tRPC router, and no usage enforcement.

**User Story:**
> As an org Owner, I want to upgrade my plan and see my current AI usage, so that I can manage my team's access to AI-powered features.

**Functional Requirements:**

- FR-1: Pricing page at `/pricing` (public) shows FREE, PRO ($29), ENTERPRISE ($99) plans with feature comparison
- FR-2: Billing page at `/org/[slug]/billing` shows current plan, usage this month (tokens used / limit), next renewal date
- FR-3: "Upgrade" button calls `billing.createCheckout` tRPC mutation → returns Razorpay subscription short URL → redirects user to Razorpay hosted checkout
- FR-4: After successful payment, Razorpay webhook fires `subscription.charged` → Inngest `billingSyncWorkflow` runs → org's plan updated
- FR-5: Before every `runCodeReview()` call in `review-pull-request.ts`, call `checkAIAccess(orgId, estimatedTokens)`. If false, skip AI review and post a GitHub comment: "ShipFlow: AI review skipped — monthly token limit reached. Upgrade at [billing URL]."
- FR-6: Sidebar usage meter shows real data: `usageRecords.prAnalyses / BILLING_PLANS[plan].maxPrsAnalyzedPerMonth`

**tRPC Router:**
```typescript
// packages/trpc/server/routes/billing/route.ts
export const billingRouter = router({
  createCheckout: protectedProcedure
    .input(z.object({ planId: z.enum(["PRO", "ENTERPRISE"]), orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return createCheckoutSession(input.orgId, input.planId);
    }),
  getSubscription: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(...),
  getUsage: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(...),
  cancelSubscription: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(...),
});
```

Acceptance Criteria:
- [ ] `/pricing` page renders with correct prices and plan features
- [ ] Clicking "Upgrade to Pro" redirects to Razorpay checkout
- [ ] Billing page shows real current plan and real token usage
- [ ] Org on FREE plan cannot run more than 5 PR analyses per month
- [ ] Sidebar usage meter reflects real DB data

---

## PART 4 — DEVELOPER TASK FILES

---

### TASK-001: Register All Inngest Lifecycle Functions
**Priority:** P0 | **Effort:** 15 minutes | **Score Impact:** +2 pts

**Objective:** The five feature lifecycle Inngest functions are exported but never passed to `serve()`. Events fire into void. Fix this.

**Dependencies:** None

**Files To Modify:**
- `apps/web/src/app/api/inngest/route.ts`

**Backend Tasks:**
- [ ] Import all lifecycle functions from `@shipflow/workflow`:
  ```typescript
  import {
    inngest,
    generateReleaseNotesWorkflow,
    billingSyncWorkflow,
    syncRepositoryWorkflow,
    reviewPullRequestWorkflow,
    featurePrdGenerated,       // ADD
    featureTasksGenerated,     // ADD
    featurePlanApproved,       // ADD
    featureReviewFailed,       // ADD
    featureHumanApproved,      // ADD
  } from "@shipflow/workflow";
  ```
- [ ] Add all five to the `functions: []` array in `serve()`
- [ ] Restart dev server and verify all 9 functions appear in Inngest dashboard at `http://localhost:8288`

**Done Criteria:**
- [ ] `http://localhost:8288/functions` shows 9 registered functions
- [ ] Sending `feature.prd.generated` event manually via Inngest Dev UI triggers `feature-prd-generated` function
- [ ] No TypeScript errors

---

### TASK-002: Fix IDOR — Add orgId Filter to All Feature Queries
**Priority:** P0 | **Effort:** 30 minutes | **Score Impact:** +1 pt security

**Objective:** `FeatureRepository.getFeatureById(featureId)` has no orgId filter. Anyone with a valid session can operate on any feature.

**Dependencies:** None

**Files To Modify:**
- `packages/services/src/feature/feature.repository.ts`
- `packages/services/src/feature/feature.service.ts`
- `packages/trpc/server/routes/feature/route.ts`

**Backend Tasks:**
- [ ] Change `getFeatureById` signature to `getFeatureById(featureId: string, orgId: string)`
- [ ] Add `and(eq(featureRequests.id, featureId), eq(featureRequests.orgId, orgId))` to where clause
- [ ] Update all callers in `feature.service.ts` to pass `orgId` (available in all service methods already)
- [ ] Audit `FeatureRepository` for any other methods missing orgId scoping
- [ ] Add index on `featureRequests.orgId` in `packages/db/models/features.ts`:
  ```typescript
  (table) => ({ orgIdx: index("feature_requests_org_idx").on(table.orgId) })
  ```

**Done Criteria:**
- [ ] `getFeatureById("valid-feature-id-from-other-org", "my-org-id")` returns `undefined`
- [ ] All existing feature service methods pass

---

### TASK-003: Add Blocking/Non-Blocking Severity to Review Findings
**Priority:** P0 | **Effort:** 45 minutes | **Score Impact:** +3 pts Review Loop

**Objective:** Add `isBlocking` field to `reviewFindings` schema and `CodeReviewResultSchema` so findings can be categorized and the approval gate can enforce them.

**Dependencies:** None (schema-only change)

**Files To Modify:**
- `packages/db/models/github.ts`
- `packages/ai/src/agents/code-reviewer/schema.ts`
- `packages/ai/src/agents/code-reviewer/prompt.ts`
- `packages/services/src/db/reviews.ts`
- `packages/db/` — create new migration

**Database Tasks:**
- [ ] Add `isBlocking: boolean("is_blocking").default(false).notNull()` to `reviewFindings` table
- [ ] Add `severity` text column with enum values: `BLOCKER | MAJOR | MINOR | SUGGESTION`
- [ ] Generate and apply Drizzle migration: `pnpm db:generate && pnpm db:migrate`

**Backend Tasks:**
- [ ] Add to `CodeReviewResultSchema` per comment:
  ```typescript
  isBlocking: z.boolean().describe("True if this issue must be fixed before merging (SECURITY, critical PERFORMANCE, or PRD deviation)"),
  severity: z.enum(["BLOCKER", "MAJOR", "MINOR", "SUGGESTION"]),
  ```
- [ ] Update `codeReviewerSystemPrompt` to include:
  ```
  SEVERITY CLASSIFICATION:
  - BLOCKER (isBlocking: true): Security vulnerabilities, PRD deviations, critical failures
  - MAJOR (isBlocking: false): Performance issues, architectural anti-patterns
  - MINOR (isBlocking: false): Code quality, readability
  - SUGGESTION (isBlocking: false): Non-essential improvements
  ```
- [ ] Update `saveAiReviewToDatabase` to write `isBlocking` and `severity` fields

**Done Criteria:**
- [ ] TypeScript compiles with no errors
- [ ] A `SECURITY` finding has `isBlocking: true` in AI output
- [ ] `reviewFindings` table has `is_blocking` and `severity` columns
- [ ] Migration runs without error on fresh DB

---

### TASK-004: Create PRD Generator AI Agent
**Priority:** P0 | **Effort:** 2 hours | **Score Impact:** +4 pts AI Agent

**Objective:** Create the PRD generation agent and wire it into the `featurePrdGenerated` Inngest function.

**Dependencies:** TASK-001 (Inngest registration)

**Files To Create:**
- `packages/ai/src/agents/prd-generator/schema.ts`
- `packages/ai/src/agents/prd-generator/prompt.ts`
- `packages/ai/src/agents/prd-generator/index.ts`

**Files To Modify:**
- `packages/ai/src/index.ts` — export new agent
- `packages/workflow/src/workflows/feature-lifecycle.ts` — wire into `featurePrdGenerated`

**Backend Tasks:**
- [ ] Create `PRDSchema` in schema.ts:
  ```typescript
  export const PRDSchema = z.object({
    problemStatement: z.string().describe("Clear statement of the problem being solved"),
    goals: z.array(z.string()).min(3).describe("What the feature achieves"),
    nonGoals: z.array(z.string()).min(2).describe("What the feature explicitly does NOT do"),
    userStories: z.array(z.object({
      role: z.string(), action: z.string(), benefit: z.string()
    })).min(3),
    acceptanceCriteria: z.array(z.string()).min(5).describe("Testable pass/fail criteria"),
    edgeCases: z.array(z.string()).min(3).describe("Edge cases and error conditions to handle"),
    successMetrics: z.array(z.object({
      metric: z.string(), target: z.string(), measurement: z.string()
    })).min(3),
  });
  ```
- [ ] Write PRD generator system prompt in prompt.ts (5-10 paragraphs of careful prompt engineering)
- [ ] Implement `runPRDGenerator(featureTitle, rawDescription, clarificationTranscript)` using `generateObject`
- [ ] Update `featurePrdGenerated` function in feature-lifecycle.ts:
  - Step 1: Fetch feature + clarification messages from DB
  - Step 2: Build clarification transcript string
  - Step 3: Call `runPRDGenerator()`
  - Step 4: Insert `prds` row
  - Step 5: Insert `prdVersions` row with JSONB content
  - Step 6: Update `prds.currentVersionId`
  - Step 7: Update `featureRequests.status` to `PRD_GENERATED`

**Testing Tasks:**
- [ ] Unit test: `runPRDGenerator` with a sample feature description returns all 7 required sections
- [ ] Unit test: `PRDSchema` rejects output missing required fields

**Done Criteria:**
- [ ] `featurePrdGenerated` Inngest function runs end-to-end without errors
- [ ] After execution, `prds` table has one new row, `prdVersions` has one row with non-empty JSONB content
- [ ] Feature status transitions to `PRD_GENERATED`
- [ ] All 7 PRD sections are present in the generated content

---

### TASK-005: Wire Task Generation to Planner Agent
**Priority:** P0 | **Effort:** 1.5 hours | **Score Impact:** +3 pts Core Workflow

**Objective:** `featureTasksGenerated` Inngest function currently only flips status. Wire it to call `runPlanningAgent` and write actual task/epic/subtask rows.

**Dependencies:** TASK-001, TASK-004 (need PRD to exist first)

**Files To Modify:**
- `packages/workflow/src/workflows/feature-lifecycle.ts` — expand `featureTasksGenerated`

**Backend Tasks:**
- [ ] Create helper `formatPRDAsText(prdContent: PRDSchema): string` that converts JSONB PRD to a prompt-friendly text block
- [ ] Update `featureTasksGenerated`:
  - Step 1: Fetch feature → linked `prds` → `prdVersions.content`
  - Step 2: Call `runPlanningAgent(formatPRDAsText(prdContent))`
  - Step 3: Fetch the project ID from the feature
  - Step 4: Insert one `epics` row using `plannerResult.summary` as title
  - Step 5: For each task in `plannerResult.tasks`: insert `tasks` row
  - Step 6: For each `acceptanceCriteria` in task: insert `subtasks` rows
  - Step 7: Update feature status to `TASKS_GENERATED`

**Done Criteria:**
- [ ] After `featureTasksGenerated` runs, `tasks` table has 3+ rows linked to the feature's epic
- [ ] Each task has matching `subtasks` rows for acceptance criteria
- [ ] `epics` table has one row linked to the feature's PRD

---

### TASK-006: Create Feature Request Creation UI + tRPC Mutation
**Priority:** P0 | **Effort:** 3 hours | **Score Impact:** +5 pts

**Objective:** Build the complete feature request creation UI and backend. This is the most critical missing feature — the entry point to the entire product.

**Dependencies:** TASK-002

**Files To Create:**
- `apps/web/src/app/(dashboard)/org/[slug]/features/page.tsx`
- `apps/web/src/app/(dashboard)/org/[slug]/features/new/page.tsx`
- `apps/web/src/app/(dashboard)/org/[slug]/features/[id]/page.tsx`
- `apps/web/src/components/features/create-feature-form.tsx`
- `apps/web/src/components/features/feature-card.tsx`
- `apps/web/src/components/features/feature-status-badge.tsx`
- `apps/web/src/components/features/clarification-thread.tsx`

**Files To Modify:**
- `packages/trpc/server/routes/feature/route.ts` — add `create`, `list`, `getById` procedures
- `packages/services/src/feature/feature.service.ts` — add `createFeature()` method
- `packages/services/src/feature/feature.repository.ts` — add `createFeature()`, `listFeatures()` methods
- `apps/web/src/components/layout/sidebar.tsx` — add "Feature Requests" nav item
- `packages/trpc/server/index.ts` — (feature router already included)

**Database Tasks:**
- [ ] Add `channel` text column to `featureRequests` in `packages/db/models/features.ts`
- [ ] Add `approvals` table write support in services (it exists in schema, never written)
- [ ] Generate migration

**Backend Tasks:**
- [ ] `FeatureService.createFeature(orgId, projectId, authorId, title, rawDescription, channel)`:
  - Insert `featureRequests` row with status `SUBMITTED`
  - Trigger clarification check: if description < 100 chars or lacks specific details, fire clarifier agent inline (short call, not Inngest) and create `clarificationThreads` + first `clarificationMessages` row
  - If clarification not needed: set status `CLARIFIED` directly
  - Return created feature

- [ ] `feature.create` tRPC procedure with Zod validation
- [ ] `feature.list` tRPC procedure — query with `orgId` filter, order by `createdAt desc`
- [ ] `feature.getById` tRPC procedure — full relational query including PRD + tasks count

**Frontend Tasks:**
- [ ] `features/page.tsx`: Server component querying `feature.list`. Grid of `FeatureCard` components with status filter tabs (All / In Progress / Shipped). Empty state with "Create Feature Request" CTA.
- [ ] `features/new/page.tsx`: Form with Title, Description (textarea with char count), Channel (select), Project (select loaded from org's projects). Submit calls `api.feature.create`. On success: redirect to `features/[id]`.
- [ ] `features/[id]/page.tsx`: Shows status timeline, clarification thread (if any), PRD preview (if generated), action buttons (Generate PRD / Generate Tasks / Approve Plan).
- [ ] `clarification-thread.tsx`: Chat UI showing AI questions and user replies. Input field to reply. Calls `feature.addClarificationReply`.
- [ ] `feature-status-badge.tsx`: Color-coded status badge for all 12 states

**Sidebar Update:**
- [ ] Add route: `{ label: "Feature Requests", icon: FileText, href: /org/${orgSlug}/features }`

**Done Criteria:**
- [ ] User can navigate to `/org/[slug]/features` and see a list or empty state
- [ ] Clicking "New Feature Request" opens the form
- [ ] Submitting the form creates a DB row and redirects to detail page
- [ ] Status badge correctly reflects current state
- [ ] If description is vague, clarification thread appears with AI's first question

---

### TASK-007: Create Clarifier AI Agent
**Priority:** P1 | **Effort:** 2 hours | **Score Impact:** +2 pts AI, +1 pt Core Workflow

**Objective:** Build the multi-turn AI clarification agent that asks follow-up questions and detects duplicates.

**Dependencies:** TASK-006

**Files To Create:**
- `packages/ai/src/agents/clarifier/schema.ts`
- `packages/ai/src/agents/clarifier/prompt.ts`
- `packages/ai/src/agents/clarifier/index.ts`

**Files To Modify:**
- `packages/ai/src/index.ts`
- `packages/services/src/feature/feature.service.ts` — add `processClarificationReply()`
- `packages/trpc/server/routes/feature/route.ts` — add `addClarificationReply` procedure

**Backend Tasks:**
- [ ] `ClarifierInputSchema`:
  ```typescript
  z.object({
    featureTitle: z.string(),
    rawDescription: z.string(),
    conversationHistory: z.array(z.object({ sender: z.string(), content: z.string() })),
    existingFeatureSummaries: z.array(z.string()), // for duplicate detection
  })
  ```
- [ ] `ClarifierOutputSchema`:
  ```typescript
  z.object({
    needsClarification: z.boolean(),
    isDuplicate: z.boolean(),
    duplicateFeatureTitle: z.string().optional(),
    duplicateExplanation: z.string().optional(),
    question: z.string().optional(), // next clarifying question if needsClarification=true
    isResolved: z.boolean(), // true when clarification is complete
    resolutionSummary: z.string().optional(), // summary of clarified requirements
  })
  ```
- [ ] System prompt: personified as "ShipFlow's requirements analyst". Rules: (a) ask only ONE question at a time, (b) after 3 rounds of Q&A, set `isResolved: true` regardless, (c) check for duplicates by comparing to existing feature summaries
- [ ] `runClarifierAgent(input)` → `generateObject()`
- [ ] `FeatureService.processClarificationReply(featureId, orgId, userMessage)`:
  - Insert user's message to `clarificationMessages`
  - Fetch full conversation history
  - Call `runClarifierAgent()`
  - Insert AI response message to `clarificationMessages`
  - If `isResolved: true`: mark thread `isResolved`, update feature status to `CLARIFIED`
  - Return `{ question, isResolved, isDuplicate, duplicateInfo }`

**Done Criteria:**
- [ ] Short description triggers clarification with first AI question
- [ ] User reply generates AI's next question or resolves thread
- [ ] After 3 rounds, thread resolves automatically
- [ ] Duplicate detection surfaces similar existing features

---

### TASK-008: Full PR Detail Page Rewrite
**Priority:** P0 | **Effort:** 3 hours | **Score Impact:** +5 pts Review Loop

**Objective:** Replace 100% hardcoded PR detail page with real data from DB. The existing page ignores its own `id` route parameter.

**Dependencies:** TASK-003 (blocking field needed for display)

**Files To Modify:**
- `apps/web/src/app/(dashboard)/org/[slug]/pr/[id]/page.tsx` — complete rewrite
- `apps/web/src/components/pr/diff-viewer.tsx` — rewrite to show real findings
- `apps/web/src/components/pr/security-alerts.tsx` — rewrite to show real blocking findings

**Files To Create:**
- `apps/web/src/components/pr/review-findings-list.tsx`
- `apps/web/src/components/pr/review-history-timeline.tsx`
- `apps/web/src/components/pr/finding-card.tsx`
- `apps/web/src/components/pr/approval-panel.tsx`

**Backend Tasks:**
- [ ] Add `pullRequest.getWithReviews` tRPC query (see SPEC-004 Technical Design)
- [ ] Add `finding.updateStatus` tRPC mutation
- [ ] Add `feature.approveHumanRelease` tRPC mutation that:
  - Checks for open blocking findings → throw if any exist
  - Inserts `approvals` row: `{ pullRequestId, approverId: member.id, signature: hmac(...), timestamp }`
  - Fires `feature.human.approved` Inngest event

**Frontend Tasks:**
- [ ] `pr/[id]/page.tsx`:
  - Parse `id` param as `parseInt(id)` to get GitHub PR number
  - Call `api.pullRequest.getWithReviews({ orgSlug: slug, githubPrNumber: id })`
  - If no PR found: show 404-style message with link to PR list
  - Layout: PR metadata header | Feature context panel | Review History timeline | Approval panel

- [ ] `review-findings-list.tsx`:
  - Group findings by `findingType`
  - Show `isBlocking` badge (red "BLOCKING") or "non-blocking" (amber)
  - Show `severity` badge
  - Each finding: file path as clickable code tag, line number, description, suggestion in `<pre>` block
  - "Mark as Addressed" button per finding → calls `finding.updateStatus`

- [ ] `approval-panel.tsx`:
  - Shows "X blocking issues remain" count
  - "Approve for Release" button — disabled if any blocking findings are OPEN
  - Tooltip on disabled state: "Resolve {n} blocking issues before approving"
  - On click: confirmation dialog → calls `feature.approveHumanRelease`
  - On success: status badge updates to SHIPPED, confetti animation

**Done Criteria:**
- [ ] Page renders with real PR title and state (not "Refactor billing webhooks")
- [ ] All review findings from DB are displayed
- [ ] Blocking findings prominently highlighted
- [ ] Approve button disabled when blocking findings exist
- [ ] Approval inserts a record to `approvals` table
- [ ] Feature transitions to SHIPPED after approval

---

### TASK-009: Fix Dashboard — Real Data Throughout
**Priority:** P1 | **Effort:** 2 hours | **Score Impact:** +3 pts SaaS UX

**Objective:** Replace all hardcoded mock data in the dashboard with real DB queries.

**Dependencies:** None (uses existing DB tables)

**Files To Modify:**
- `apps/web/src/components/dashboard/stat-cards.tsx`
- `apps/web/src/components/dashboard/activity-feed.tsx`
- `apps/web/src/components/dashboard/deployments-list.tsx`
- `apps/web/src/app/(dashboard)/org/[slug]/page.tsx`
- `apps/web/src/components/layout/sidebar.tsx`

**Backend Tasks:**
- [ ] Add `organization.getStats` tRPC query:
  ```typescript
  // Returns: { totalPRsAnalyzed, criticalBugsCaught, approvalRate, activeFeatures }
  // Queries: count(pullRequests), count(reviewFindings WHERE isBlocking=true), etc.
  ```
- [ ] Add `organization.getRecentActivity` tRPC query:
  ```typescript
  // Returns last 10 pullRequestReviews with PR title, repo name, state, createdAt
  ```

**Frontend Tasks:**
- [ ] `stat-cards.tsx`: Convert to server component that accepts props `{ stats: OrgStats }`. Load in parent with `api.organization.getStats`.
- [ ] `activity-feed.tsx`: Query `api.organization.getRecentActivity`. Map real PR events to activity items. Link each item to real PR detail page.
- [ ] `deployments-list.tsx`: Query real `deployments` table via new `deployment.list` tRPC query. If empty: show empty state "No deployments yet".
- [ ] `org/[slug]/page.tsx`:
  - Replace `<Link href="/pr/1">` with `<Link href={mostRecentPR ? /pr/${mostRecentPR.githubPrNumber} : /pr}>` 
  - Add real Recharts `AreaChart` showing PR review volume over last 7 days. Query counts by day from `pullRequestReviews.createdAt`.
- [ ] `sidebar.tsx`: Replace hardcoded usage meter with real query from `usageRecords` table for current month.

**Done Criteria:**
- [ ] Stat cards show real numbers (including 0 for a new org)
- [ ] Activity feed shows real PR events or empty state
- [ ] Deployments list shows real data or empty state
- [ ] "Trigger Analysis" CTA links to a real PR (or to PR list if none)
- [ ] Chart renders real data (or empty chart with "No data yet" label)
- [ ] Sidebar usage meter shows real token usage

---

### TASK-010: Create Billing UI + tRPC Router
**Priority:** P1 | **Effort:** 3 hours | **Score Impact:** +2 pts SaaS, +1 pt tRPC

**Objective:** The billing package is fully implemented but has no UI and no tRPC router. Build both and enforce usage limits.

**Dependencies:** None (billing package already works)

**Files To Create:**
- `packages/trpc/server/routes/billing/route.ts`
- `apps/web/src/app/(dashboard)/org/[slug]/billing/page.tsx`
- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/components/billing/plan-card.tsx`
- `apps/web/src/components/billing/usage-meter.tsx`

**Files To Modify:**
- `packages/trpc/server/index.ts` — add `billing: billingRouter`
- `apps/web/src/components/layout/sidebar.tsx` — add "Billing" nav item
- `packages/workflow/src/workflows/review-pull-request.ts` — add `checkAIAccess` gate

**Backend Tasks:**
- [ ] Create `billingRouter` with procedures: `createCheckout`, `getSubscription`, `getUsage`, `cancelSubscription`
- [ ] In `review-pull-request.ts` step 0 (before fetch-pr-files):
  ```typescript
  const hasAccess = await step.run("check-ai-access", async () => {
    return checkAIAccess(orgId, 50000); // estimated tokens
  });
  if (!hasAccess) {
    await step.run("post-limit-comment", async () => {
      // post GitHub comment explaining limit reached
    });
    return { skipped: "AI review limit reached" };
  }
  ```

**Frontend Tasks:**
- [ ] `pricing/page.tsx`: Public page (not behind auth) with 3-column plan comparison. Show features per plan. "Get Started" / "Upgrade" CTA buttons.
- [ ] `billing/page.tsx`: Current plan, renewal date, usage meters (tokens, PR analyses), invoice history, upgrade/downgrade buttons, cancel button.
- [ ] Add "Billing" to sidebar and landing page nav

**Done Criteria:**
- [ ] `/pricing` page renders with correct plan details
- [ ] Billing page shows real plan from DB
- [ ] "Upgrade" opens Razorpay checkout URL
- [ ] FREE org that runs 5+ PR analyses gets a GitHub comment instead of an AI review

---

### TASK-011: Create Review History Page
**Priority:** P1 | **Effort:** 2 hours | **Score Impact:** +1 pt SaaS

**Objective:** Create the Review History page that shows all AI reviews across all PRs for the org.

**Dependencies:** TASK-003

**Files To Create:**
- `apps/web/src/app/(dashboard)/org/[slug]/reviews/page.tsx`
- `apps/web/src/components/reviews/review-summary-card.tsx`

**Files To Modify:**
- `apps/web/src/components/layout/sidebar.tsx` — add "Review History" nav item

**Backend Tasks:**
- [ ] Add `pullRequest.listReviews` tRPC query:
  ```typescript
  // Returns reviews with: PR title, repo name, commitSha, createdAt, findingCounts by type, isBlocking count
  // Ordered by createdAt desc, paginated (limit 20)
  ```

**Frontend Tasks:**
- [ ] Filter tabs: All / With Blocking Issues / Clean (no blocking)
- [ ] Each review card: PR title, repo, commit SHA (short), timestamp, finding count badges
- [ ] Click → navigate to PR detail page
- [ ] Empty state: "No reviews yet. Connect a repository and open a pull request."

**Done Criteria:**
- [ ] Page renders with real review data
- [ ] Filter tabs work correctly
- [ ] Empty state visible for new orgs

---

### TASK-012: Implement State Machine Transitions
**Priority:** P0 | **Effort:** 2 hours | **Score Impact:** +3 pts Core Workflow

**Objective:** The feature state machine has no implemented transitions after `PLAN_APPROVED`. A feature can never progress to `SHIPPED` through any code path.

**Dependencies:** TASK-005 (tasks must exist for `PLAN_APPROVED` state to make sense)

**Files To Modify:**
- `packages/services/src/feature/feature.service.ts`
- `packages/workflow/src/workflows/feature-lifecycle.ts`
- `apps/web/src/app/api/webhooks/github/route.ts`

**Backend Tasks:**
- [ ] Add `linkPRToFeature(featureId, orgId, prId)` service method: transitions `PLAN_APPROVED → IN_DEVELOPMENT`
- [ ] In GitHub webhook handler: when a PR is opened, check if `featureRequestId` is set on the PR (may need UI for linking); if set, transition feature to `IN_REVIEW`
- [ ] Add `markReviewPassed(featureId, orgId)` service method: transitions `IN_REVIEW → AWAITING_HUMAN_APPROVAL`. Called when `reviewPullRequestWorkflow` completes with no blocking findings.
- [ ] Add `fixNeededToReview(featureId, orgId)` automatic transition: on `synchronize` webhook, if feature is `FIX_NEEDED`, transition to `IN_REVIEW`
- [ ] Update `reviewPullRequestWorkflow` step 6 to:
  - Check if feature is linked to this PR
  - If linked and no blocking findings: call `markReviewPassed()`
  - If linked and blocking findings: call `featureService.failReview()`

**Done Criteria:**
- [ ] Feature transitions to `IN_DEVELOPMENT` when linked to a PR
- [ ] Feature transitions to `IN_REVIEW` when the PR is opened
- [ ] Feature transitions to `AWAITING_HUMAN_APPROVAL` when AI review finds no blockers
- [ ] Feature transitions to `FIX_NEEDED` when AI review finds blockers
- [ ] Feature transitions to `IN_REVIEW` again when developer pushes a fix
- [ ] Feature transitions to `SHIPPED` when human approves

---

### TASK-013: Fix GitHub Review Event Type (REQUEST_CHANGES on Blockers)
**Priority:** P1 | **Effort:** 30 minutes | **Score Impact:** +1 pt GitHub

**Dependencies:** TASK-003 (isBlocking field)

**Files To Modify:**
- `packages/services/src/github/comments.ts`

**Backend Tasks:**
- [ ] In `postReviewComment`, determine event type before API call:
  ```typescript
  const hasBlockingIssues = reviewResult.comments.some(c => c.isBlocking);
  const reviewEvent = hasBlockingIssues ? "REQUEST_CHANGES" : "COMMENT";
  ```
- [ ] Pass `event: reviewEvent` to `octokit.rest.pulls.createReview()`
- [ ] Update `pullRequestReviews.state` to `CHANGES_REQUESTED` when `REQUEST_CHANGES` is used

**Done Criteria:**
- [ ] PR with a SECURITY finding shows "Changes requested" in GitHub
- [ ] PR with only MINOR findings shows "Commented" in GitHub

---

### TASK-014: Stale Review Dismissal on Synchronize
**Priority:** P1 | **Effort:** 1 hour | **Score Impact:** +1 pt GitHub

**Dependencies:** None

**Files To Modify:**
- `packages/workflow/src/workflows/review-pull-request.ts`

**Backend Tasks:**
- [ ] Add step 0 before "fetch-pr-files": if `action === "synchronize"`, dismiss previous AI reviews:
  ```typescript
  await step.run("dismiss-stale-reviews", async () => {
    const octokit = await getInstallationOctokit(installationId);
    const { data: reviews } = await octokit.rest.pulls.listReviews({ owner, repo, pull_number: prNumber });
    const aiReviews = reviews.filter(r => r.user?.type === "Bot" && r.state === "CHANGES_REQUESTED");
    for (const review of aiReviews) {
      await octokit.rest.pulls.dismissReview({
        owner, repo, pull_number: prNumber, review_id: review.id,
        message: `Superseded by new review for commit ${headSha}`
      });
    }
  });
  ```

**Done Criteria:**
- [ ] After pushing a fix, old "Changes requested" review is dismissed
- [ ] New review appears for the new commit

---

### TASK-015: Add Cross-Review Memory to AI Reviewer
**Priority:** P1 | **Effort:** 1.5 hours | **Score Impact:** +1 pt AI Agent

**Dependencies:** TASK-003

**Files To Modify:**
- `packages/ai/src/agents/code-reviewer/index.ts`
- `packages/ai/src/agents/code-reviewer/prompt.ts`
- `packages/workflow/src/workflows/review-pull-request.ts`

**Backend Tasks:**
- [ ] Add `previousFindings?: string` parameter to `runCodeReview()`
- [ ] In `review-pull-request.ts`: before running AI review, fetch the previous review's findings from DB:
  ```typescript
  const previousFindings = await step.run("fetch-previous-findings", async () => {
    const prevReview = await db.query.pullRequestReviews.findFirst({
      where: and(eq(pullRequestReviews.pullRequestId, pullRequestId)),
      orderBy: [desc(pullRequestReviews.createdAt)],
      with: { findings: true },
    });
    return prevReview?.findings.map(f => 
      `[${f.isBlocking ? 'BLOCKER' : 'non-blocking'}] ${f.filePath}:${f.lineNumber} — ${f.description}`
    ).join('\n') || '';
  });
  ```
- [ ] Pass to `runCodeReview(diffContent, contextSnippets, previousFindings)`
- [ ] Update system prompt: "The following issues were raised in the previous review. For each, explicitly state whether it has been RESOLVED, PARTIALLY ADDRESSED, or REMAINS in the new diff."

**Done Criteria:**
- [ ] Re-review response explicitly references issues from previous review
- [ ] Previously-flagged issues that were fixed are noted as resolved in new review summary

---

### TASK-016: Ground AI Reviewer in PRD Context
**Priority:** P1 | **Effort:** 1.5 hours | **Score Impact:** +2 pts AI Agent (PRD_DEVIATION findings now reachable)

**Dependencies:** TASK-004

**Files To Modify:**
- `packages/ai/src/agents/code-reviewer/index.ts`
- `packages/workflow/src/workflows/review-pull-request.ts`

**Backend Tasks:**
- [ ] Add `prdContext?: string` parameter to `runCodeReview()`
- [ ] In `review-pull-request.ts`, fetch PRD linked to the feature request linked to this PR:
  ```typescript
  const prdContext = await step.run("fetch-prd-context", async () => {
    const pr = await db.query.pullRequests.findFirst({
      where: eq(pullRequests.id, pullRequestId),
      with: { featureRequest: { with: { prds: { with: { currentVersion: true } } } } }
    });
    const prd = pr?.featureRequest?.prds?.[0]?.currentVersion?.content;
    return prd ? formatPRDAsText(prd as any) : '';
  });
  ```
- [ ] Pass to `runCodeReview(diff, ragSnippets, previousFindings, prdContext)`
- [ ] Update system prompt: add section "=== PRD REQUIREMENTS ===" with explicit instruction to flag `PRD_DEVIATION` if implementation diverges from acceptance criteria

**Done Criteria:**
- [ ] When PR adds a feature not in the PRD, a `PRD_DEVIATION` finding appears in AI review
- [ ] When PR correctly implements all acceptance criteria, no `PRD_DEVIATION` findings

---

### TASK-017: Create Release Readiness Agent
**Priority:** P2 | **Effort:** 2 hours | **Score Impact:** +1 pt AI Agent

**Dependencies:** TASK-003, TASK-005

**Files To Create:**
- `packages/ai/src/agents/release-readiness/schema.ts`
- `packages/ai/src/agents/release-readiness/prompt.ts`
- `packages/ai/src/agents/release-readiness/index.ts`
- `packages/workflow/src/workflows/release-readiness.ts`

**Backend Tasks:**
- [ ] Schema: `{ isReady: boolean, overallScore: number (0-100), blockers: string[], warnings: string[], recommendation: string, releaseNotesDraft: string }`
- [ ] Input: PRD content, task completion status (X/Y done), latest review findings summary, PR state
- [ ] Trigger: fire when feature enters `AWAITING_HUMAN_APPROVAL` state
- [ ] Store result in `releases` table as `releaseNotes` field
- [ ] Display readiness score and recommendation on PR approval panel

**Done Criteria:**
- [ ] Release readiness check fires automatically when feature awaits human approval
- [ ] Approval panel shows AI's readiness verdict with score and recommendation
- [ ] Draft release notes appear in the approval panel

---

### TASK-018: Write README.md
**Priority:** P0 | **Effort:** 2 hours | **Score Impact:** +3 pts Demo & Docs

**Objective:** The current README.md is the unmodified Turborepo starter template with zero ShipFlow content. This is the #1 documentation deliverable a judge checks first.

**Files To Modify:**
- `README.md` — complete replacement

**Content Tasks:**
- [ ] Project overview paragraph (3-5 sentences matching init.md language)
- [ ] Tech stack table with version numbers
- [ ] Architecture diagram (ASCII box diagram showing packages and data flow)
- [ ] Prerequisites section (Node version, pnpm, PostgreSQL, env vars)
- [ ] Step-by-step local setup (clone → install → DB setup → env vars → dev)
- [ ] Environment variables table: every `process.env.*` reference in the codebase with description and example
- [ ] Database schema notes: diagram of core entity relationships
- [ ] GitHub Integration Setup: create GitHub App → install → webhook URL
- [ ] Inngest Workflow Explanation: table of all 9 workflows, their triggers, and steps
- [ ] AI Features Implemented: description of all 5 agents
- [ ] Link to `docs/DEPLOYMENT.md` for production deployment
- [ ] Link to live deployment URL
- [ ] Link to demo video

**Done Criteria:**
- [ ] README has no Turborepo boilerplate remaining
- [ ] All 9 required sections from init.md are present
- [ ] Setup instructions work from scratch on a clean machine

---

### TASK-019: Expand tRPC Surface + Migrate Raw Queries
**Priority:** P1 | **Effort:** 3 hours | **Score Impact:** +3 pts tRPC Quality

**Objective:** The current tRPC surface covers ~7% of the product's data access. The majority of data is fetched via raw Drizzle calls in Server Components or plain `fetch()` to route handlers.

**Dependencies:** None (refactor, no new features)

**Files To Create:**
- `packages/trpc/server/routes/pullRequest/route.ts`
- `packages/trpc/server/routes/repository/route.ts`
- `packages/trpc/server/routes/member/route.ts`
- `packages/trpc/server/routes/prd/route.ts`
- `packages/trpc/server/routes/task/route.ts`

**Files To Modify:**
- `apps/web/src/app/(dashboard)/org/[slug]/pr/page.tsx` — replace raw `db.select()` with `api.pullRequest.list()`
- `apps/web/src/components/github/repos-list.tsx` — replace `fetch('/api/github/repos')` with `api.repository.list()`
- `apps/web/src/components/settings/member-list.tsx` — replace hardcoded with `api.member.list()`
- `packages/trpc/server/index.ts` — register all new routers

**Backend Tasks:**
- [ ] `pullRequest.list`: query PRs by org with repo join
- [ ] `pullRequest.getWithReviews`: (see TASK-008)
- [ ] `repository.list`: query repos by org
- [ ] `repository.sync`: trigger repo sync workflow
- [ ] `member.list`: query members by org with user join
- [ ] `member.invite`: send invitation (can be a placeholder email for now)
- [ ] `prd.getByFeature`: return PRD with latest version content
- [ ] `task.getKanban`: return tasks grouped by status
- [ ] `task.updateStatus`: update task status with permission check

**Done Criteria:**
- [ ] Zero raw `db.select()` calls in Server Components (exception: auth-required routes)
- [ ] Zero `fetch('/api/...')` calls for data that can go through tRPC
- [ ] All new procedures have Zod input validation

---

### TASK-020: Add Tenant Isolation Middleware
**Priority:** P0 | **Effort:** 1.5 hours | **Score Impact:** +2 pts tRPC Quality

**Objective:** Create `orgMemberProcedure` middleware that validates org membership before any org-scoped mutation, centralizing the authorization logic currently scattered across service methods.

**Dependencies:** None

**Files To Modify:**
- `packages/trpc/server/trpc.ts`
- `packages/trpc/server/routes/feature/route.ts` — use new middleware
- `packages/trpc/server/routes/organization/route.ts` — use new middleware

**Backend Tasks:**
- [ ] Add `orgMemberProcedure`:
  ```typescript
  export const orgMemberProcedure = t.procedure
    .use(isAuthenticated) // existing session check
    .input(z.object({ orgId: z.string() }).passthrough())
    .use(async ({ ctx, next, input }) => {
      const member = await db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.orgId, (input as any).orgId)
        ),
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this org" });
      return next({ ctx: { ...ctx, member, orgId: (input as any).orgId } });
    });
  ```
- [ ] Migrate all feature, organization, billing, PR, member procedures to use `orgMemberProcedure`

**Done Criteria:**
- [ ] Calling any org-scoped procedure with a different org's ID returns FORBIDDEN
- [ ] No procedure relies on ad-hoc role checks in service layer for authorization (only for role-level access like ADMIN-only)

---

### TASK-021: Security Fixes & Code Hygiene
**Priority:** P1 | **Effort:** 2 hours | **Score Impact:** +1 pt Engineering Quality

**Files To Modify:**
- `apps/web/src/app/api/github/callback/route.ts` — fix CSRF gap in state param
- `apps/web/src/components/github/connect-card.tsx` — generate signed state
- `.gitignore` — add `.env`
- Root directory — delete `apps/web/app_backup/` directory
- `apps/api/src/` — rename "Streamyst" to "ShipFlow"

**Backend Tasks:**
- [ ] Generate state as `base64(orgId + ":" + timestamp + ":" + HMAC(orgId+timestamp, SESSION_SECRET))`
- [ ] Validate state in callback: verify HMAC, check timestamp not > 10 minutes old
- [ ] Create `.env.example` with every variable key and placeholder value
- [ ] Add `.env` (not `.env.example`) to `.gitignore`

**Done Criteria:**
- [ ] Tampered `state` param rejected with 403
- [ ] No `.env` file with real values in the repository
- [ ] No "Streamyst" references in the codebase

---

### TASK-022: Add Tests — Critical Paths
**Priority:** P1 | **Effort:** 2 hours | **Score Impact:** +2 pts Engineering Quality

**Files To Create:**
- `packages/services/src/__tests__/feature.service.test.ts`
- `packages/github/src/__tests__/comments.test.ts`
- `packages/ai/src/__tests__/prd-generator.test.ts`
- `apps/web/e2e/feature-workflow.spec.ts`

**Testing Tasks:**
- [ ] Unit: `findDiffPosition` — test hunk headers, deletions, context lines, out-of-range lines
- [ ] Unit: `FeatureService.createFeature` — creates row with SUBMITTED status
- [ ] Unit: `FeatureService.approveHumanRelease` — throws when blocking findings exist
- [ ] Unit: `checkAIAccess` — returns false when token limit exceeded
- [ ] Unit: `verifyGithubWebhook` — accepts valid, rejects invalid signatures
- [ ] E2E: Create feature request → verify DB row → check status badge
- [ ] Delete `e2e/billing.spec.ts` (tests non-existent `/pricing` route — will fail CI until pricing page is built)
- [ ] Fix `e2e/billing.spec.ts` to test the actual billing page after TASK-010

**Done Criteria:**
- [ ] `pnpm test` runs without failures
- [ ] At least 15 test cases passing
- [ ] No test targets a non-existent route

---

### TASK-023: Create Inngest Progress Visibility UI
**Priority:** P2 | **Effort:** 2 hours | **Score Impact:** +1 pt SaaS UX, +1 pt Inngest (progress visible)

**Objective:** The spec requires "Workflow progress should be visible inside the application." Currently there is no UI showing Inngest run status.

**Files To Create:**
- `apps/web/src/components/features/workflow-status.tsx`
- `apps/web/src/app/api/workflow-status/[featureId]/route.ts`

**Backend Tasks:**
- [ ] Create a Route Handler that queries `webhookEvents` table filtered by featureId-related events and returns them as a status timeline
- [ ] Alternatively: use Inngest's REST API to query run status for a given feature
- [ ] Map events to human-readable step labels: `feature.prd.generated → "PRD Generated ✓"`, etc.

**Frontend Tasks:**
- [ ] `WorkflowStatus` component: shows a vertical timeline of steps with checkmarks
- [ ] Steps: "Feature Submitted → AI Clarification → PRD Generation → Task Generation → Plan Approved → In Development → Code Review → Human Approval → Shipped"
- [ ] Current step has a spinner, future steps are grayed out, past steps have green checkmarks
- [ ] Embed in `features/[id]/page.tsx`

**Done Criteria:**
- [ ] Feature detail page shows current workflow step
- [ ] When Inngest function completes, the step gets a checkmark (polling every 3 seconds during active steps)

---

## PART 5 — EXECUTION ROADMAP

### Phase 1 — Critical Score Recovery (Hours 1-8)
**Expected Score Gain: 39 → 68/100 (+29 pts)**

These are the highest-impact tasks that unblock everything else:

| Order | Task | Time | Score Gain | Reason | Status |
|---|---|---|---|---|---|
| 1 | TASK-001: Register Inngest functions | 15 min | +2 | Unblocks ALL lifecycle testing | ✅ Done |
| 2 | TASK-002: Fix IDOR | 30 min | +1 | Security critical | ✅ Done |
| 3 | TASK-003: Add isBlocking to schema | 45 min | +3 | Unblocks TASK-008, TASK-013 | ✅ Done |
| 4 | TASK-018: Write README | 2 hr | +3 | Massive judge-first-impression impact | ✅ Done |
| 5 | TASK-004: PRD Generator Agent | 2 hr | +4 | Core loop step 3 | ✅ Done |
| 6 | TASK-005: Wire Task Generation | 1.5 hr | +3 | Core loop step 4 | ✅ Done |
| 7 | TASK-012: State Machine Transitions | 2 hr | +3 | Core loop completeness | ✅ Done |
| 8 | TASK-006: Feature Request Creation UI | 3 hr | +5 | ENTRY POINT — critical | ✅ Done |

**Dependency Chain:** TASK-001 → TASK-004 → TASK-005 → TASK-006 → (rest of Phase 1)

### Phase 2 — Core Feature Completion (Hours 9-20)
**Expected Score Gain: 68 → 83/100 (+15 pts)**

| Order | Task | Time | Score Gain |
|---|---|---|---|
| 9 | TASK-008: PR Detail Page Rewrite | 3 hr | +5 |
| 10 | TASK-009: Fix Dashboard | 2 hr | +3 |
| 11 | TASK-016: Ground Reviewer in PRD | 1.5 hr | +2 |
| 12 | TASK-013: REQUEST_CHANGES on blockers | 30 min | +1 |
| 13 | TASK-010: Billing UI + tRPC | 3 hr | +2 |
| 14 | TASK-020: Tenant Isolation Middleware | 1.5 hr | +2 |

### Phase 3 — Production Hardening (Hours 21-30)
**Expected Score Gain: 83 → 89/100 (+6 pts)**

| Order | Task | Time | Score Gain |
|---|---|---|---|
| 15 | TASK-007: Clarifier Agent | 2 hr | +2 |
| 16 | TASK-015: Cross-Review Memory | 1.5 hr | +1 |
| 17 | TASK-019: Expand tRPC Surface | 3 hr | +3 |
| 18 | TASK-021: Security Fixes & Hygiene | 2 hr | +1 |
| 19 | TASK-022: Add Tests | 2 hr | +2 |
| 20 | TASK-014: Stale Review Dismissal | 1 hr | +1 |

### Phase 4 — Judge Delight Features (Hours 31-38)
**Expected Score Gain: 89 → 92/100 (+3 pts)**

| Order | Task | Time | Score Gain |
|---|---|---|---|
| 21 | TASK-017: Release Readiness Agent | 2 hr | +1 |
| 22 | TASK-023: Inngest Progress Visibility | 2 hr | +1 |
| 23 | TASK-011: Review History Page | 2 hr | +1 |
| 24 | Live deployment + Demo video | 4 hr | +1 |

---

## PART 6 — ENGINEERING BACKLOG

| Priority | Task ID | Task | Category | Effort | Dependencies |
|---|---|---|---|---|---|
| P0 | TASK-001 | Register Inngest lifecycle functions | Core Workflow | 15 min | None |
| P0 | TASK-002 | Fix IDOR in FeatureRepository | Security / Engineering | 30 min | None |
| P0 | TASK-003 | Add isBlocking/severity to reviewFindings | Review Loop | 45 min | None |
| P0 | TASK-004 | Create PRD Generator Agent | AI Agent | 2 hr | TASK-001 |
| P0 | TASK-005 | Wire Task Generation to Planner | Core Workflow | 1.5 hr | TASK-004 |
| P0 | TASK-006 | Feature Request Creation UI + tRPC | Core Workflow / SaaS UX | 3 hr | TASK-002 |
| P0 | TASK-008 | Full PR Detail Page Rewrite | Review Loop / SaaS UX | 3 hr | TASK-003 |
| P0 | TASK-012 | Implement State Machine Transitions | Core Workflow | 2 hr | TASK-005 |
| P0 | TASK-018 | Write README | Demo & Docs | 2 hr | None |
| P0 | TASK-020 | Tenant Isolation Middleware | Engineering Quality | 1.5 hr | None |
| P1 | TASK-007 | Clarifier AI Agent | AI Agent | 2 hr | TASK-006 |
| P1 | TASK-009 | Fix Dashboard Real Data | SaaS UX | 2 hr | None |
| P1 | TASK-010 | Billing UI + tRPC + Usage Enforcement | SaaS UX / tRPC | 3 hr | None |
| P1 | TASK-011 | Review History Page | SaaS UX | 2 hr | TASK-003 |
| P1 | TASK-013 | REQUEST_CHANGES on Blocking Findings | GitHub | 30 min | TASK-003 |
| P1 | TASK-014 | Stale Review Dismissal | GitHub | 1 hr | None |
| P1 | TASK-015 | Cross-Review Memory | AI Agent | 1.5 hr | TASK-003 |
| P1 | TASK-016 | Ground AI Reviewer in PRD Context | AI Agent | 1.5 hr | TASK-004 |
| P1 | TASK-019 | Expand tRPC Surface | Engineering Quality | 3 hr | None |
| P1 | TASK-021 | Security Fixes & Code Hygiene | Engineering Quality | 2 hr | None |
| P1 | TASK-022 | Add Tests | Engineering Quality | 2 hr | All P0 tasks |
| P2 | TASK-017 | Release Readiness Agent | AI Agent | 2 hr | TASK-004 |
| P2 | TASK-023 | Inngest Progress Visibility UI | SaaS UX | 2 hr | TASK-001 |
| P2 | Live Deployment | Deploy to Vercel + configure env | Demo & Docs | 2 hr | All P0 |
| P2 | Demo Video | Record 5-min walkthrough | Demo & Docs | 2 hr | All P0 |

---

## PART 7 — VERIFICATION MATRIX

| Requirement | Covering Tasks | Verification Method | Status After Completion |
|---|---|---|---|
| Feature request intake (any channel) | TASK-006 | Create feature via UI, check DB | ✓ |
| AI clarification follow-up loop | TASK-007 | Submit vague request, verify Q&A thread | ✓ |
| Duplicate detection | TASK-007 | Submit duplicate, verify education message | ✓ |
| PRD generation (all 7 sections) | TASK-004 | Check prdVersions.content JSONB | ✓ |
| Task generation + Kanban | TASK-005 + TASK-006 | Check tasks table, verify Kanban board | ✓ |
| Plan review/approval | TASK-006 (UI) + TASK-001 (registration) | Click approve, verify status transition | ✓ |
| GitHub repo connection (real) | Already working (90%) | Manual test via GitHub App install | ✓ |
| Webhook + PR tracking, no hardcoded data | Already working (85%) | Open real PR, check DB | ✓ |
| Fetch diffs / analyze PR | Already working (85%) | Open real PR, check Inngest logs | ✓ |
| Post AI review to GitHub | Already working + TASK-013 | Check GitHub PR for review comments | ✓ |
| AI review grounded in PRD | TASK-016 | Check for PRD_DEVIATION findings | ✓ |
| Blocking vs Non-blocking | TASK-003 | Check reviewFindings.isBlocking field | ✓ |
| Fix-needed → re-review cycle | TASK-012 + TASK-014 | Push fix to PR, verify new review | ✓ |
| Human review of PRD/tasks/PR/AI history | TASK-008 | Navigate to PR detail, verify all data | ✓ |
| Approval gate enforced before shipping | TASK-008 | Try to approve with open blockers → error | ✓ |
| Multi-tenant org isolation | TASK-002 + TASK-020 | Cross-org IDOR attempt → FORBIDDEN | ✓ |
| BetterAuth | Already working (80%) | Login/logout/session persistence | ✓ |
| Razorpay billing | TASK-010 | Click Upgrade → Razorpay checkout | ✓ |
| Usage limits enforced | TASK-010 | Exceed FREE plan limits → blocked | ✓ |
| Inngest for async work, visible progress | TASK-001 + TASK-023 | Check Inngest dashboard, check UI | ✓ |
| All required SaaS pages | TASK-006 + TASK-010 + TASK-011 | Navigate to each page | ✓ |
| tRPC for all type-safe API comms | TASK-019 | Grep for raw db.select in Server Components | ✓ |
| Public repo + live deploy + demo video + README | TASK-018 + Live Deploy | Access each URL, read README | ✓ |

---

## PART 8 — FINAL AUDIT

### Deduction Checklist

| Deduction | Source | Covered By | Status |
|---|---|---|---|
| -5 pts: No feature request creation path | Core Workflow | TASK-006 | ✓ |
| -3 pts: generatePRD doesn't generate PRD | Core Workflow | TASK-004 + TASK-001 | ✓ |
| -2 pts: generateTasks doesn't create tasks | Core Workflow | TASK-005 | ✓ |
| -2 pts: 5 Inngest functions unregistered | Core Workflow | TASK-001 | ✓ |
| -2 pts: No state transitions after PLAN_APPROVED | Core Workflow | TASK-012 | ✓ |
| -1 pt: No duplicate detection | Core Workflow | TASK-007 | ✓ |
| -4 pts: Planner agent is dead code | AI Agent | TASK-005 (wires it) | ✓ |
| -3 pts: PRD_DEVIATION unreachable | AI Agent | TASK-016 | ✓ |
| -2 pts: No clarifier/release-readiness agents | AI Agent | TASK-007 + TASK-017 | ✓ |
| -1 pt: No memory between re-reviews | AI Agent | TASK-015 | ✓ |
| -1 pt: Reviews always COMMENT not REQUEST_CHANGES | GitHub | TASK-013 | ✓ |
| -1 pt: No stale review dismissal | GitHub | TASK-014 | ✓ |
| -1 pt: No tests for GitHub pipeline | GitHub | TASK-022 | ✓ |
| -1 pt: CSRF gap in callback state | GitHub | TASK-021 | ✓ |
| -4 pts: No blocking issue enforcement before approval | Review Loop | TASK-008 | ✓ |
| -3 pts: No UI surface for AI review history | Review Loop | TASK-008 | ✓ |
| -3 pts: approvals table never used | Review Loop | TASK-008 | ✓ |
| -2 pts: Missing IN_REVIEW → AWAITING_HUMAN_APPROVAL | Review Loop | TASK-012 | ✓ |
| -3 pts: tRPC surface is tiny (7 procedures) | tRPC Quality | TASK-019 | ✓ |
| -2 pts: No centralized tenant middleware | tRPC Quality | TASK-020 | ✓ |
| -2 pts: IDOR in FeatureRepository | tRPC Quality | TASK-002 | ✓ |
| -1 pt: Tests target non-existent routes | tRPC Quality | TASK-022 | ✓ |
| -1 pt: Engineering hygiene (Streamyst, backup dir, .env) | tRPC Quality | TASK-021 | ✓ |
| -3 pts: Dashboard on fake metrics | SaaS UX | TASK-009 | ✓ |
| -2 pts: PR detail entirely mock | SaaS UX | TASK-008 | ✓ |
| -1 pt: Deceptive "Live Feed" label on dummy data | SaaS UX | TASK-009 | ✓ |
| -1 pt: 5 required pages absent | SaaS UX | TASK-006, TASK-010, TASK-011 | ✓ |
| -2 pts: README is unmodified Turborepo template | Demo & Docs | TASK-018 | ✓ |
| -1 pt: No demo video/screenshots | Demo & Docs | Demo Video task | ✓ |
| -1 pt: Setup docs unlinked from README | Demo & Docs | TASK-018 | ✓ |

### Self-Audit: Completeness Check

- [x] Every point deduction addressed
- [x] Every missing requirement addressed
- [x] Every partial implementation addressed
- [x] Every mocked feature addressed
- [x] Every rubric category addressed
- [x] Every task has acceptance criteria
- [x] Every task has testing requirements
- [x] Every requirement has implementation coverage

### Coverage Gaps — None Found

After systematic review of all 30 deductions and 23 requirements from the evaluation report, every item has at least one corresponding task with implementation detail down to the file and method level. No orphaned requirements remain.

---

## APPENDIX A — DB MIGRATION REFERENCE

All migrations needed (run in this order):

```sql
-- Migration 1: Add blocking fields to review_findings
ALTER TABLE review_findings 
  ADD COLUMN is_blocking BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN severity TEXT NOT NULL DEFAULT 'MINOR';

-- Migration 2: Add channel to feature_requests
ALTER TABLE feature_requests 
  ADD COLUMN channel TEXT NOT NULL DEFAULT 'IN_APP';

-- Migration 3: Add org index to feature_requests
CREATE INDEX feature_requests_org_idx ON feature_requests(org_id);

-- Migration 4: Rename stripe_customer_id in organizations (cleanup)  
-- (Already has Razorpay, but column is named stripe_customer_id)
ALTER TABLE organizations 
  ADD COLUMN razorpay_customer_id TEXT,
  DROP COLUMN stripe_customer_id;
```

## APPENDIX B — ENV VARIABLES REQUIRED

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
BETTER_AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# GitHub App
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
GITHUB_WEBHOOK_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# AI Providers (multi-provider fallback)
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENROUTER_API_KEY=...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_PRO_PLAN_ID=...
RAZORPAY_ENTERPRISE_PLAN_ID=...

# Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX=...

# Security
APPROVAL_SECRET=...  # New: for HMAC approval signatures
SESSION_SECRET=...   # New: for CSRF-safe GitHub callback state
```

## APPENDIX C — COMPLETE FILE CREATION LIST

New files to create (not modify):

```
packages/ai/src/agents/prd-generator/
  ├── schema.ts
  ├── prompt.ts
  └── index.ts

packages/ai/src/agents/clarifier/
  ├── schema.ts
  ├── prompt.ts
  └── index.ts

packages/ai/src/agents/release-readiness/
  ├── schema.ts
  ├── prompt.ts
  └── index.ts

packages/trpc/server/routes/
  ├── billing/route.ts
  ├── pullRequest/route.ts
  ├── repository/route.ts
  ├── member/route.ts
  ├── prd/route.ts
  └── task/route.ts

apps/web/src/app/(dashboard)/org/[slug]/
  ├── features/page.tsx
  ├── features/new/page.tsx
  ├── features/[id]/page.tsx
  ├── features/[id]/prd/page.tsx
  ├── features/[id]/tasks/page.tsx
  ├── billing/page.tsx
  └── reviews/page.tsx

apps/web/src/app/pricing/page.tsx

apps/web/src/components/
  ├── features/create-feature-form.tsx
  ├── features/feature-card.tsx
  ├── features/feature-status-badge.tsx
  ├── features/clarification-thread.tsx
  ├── features/workflow-status.tsx
  ├── pr/review-findings-list.tsx
  ├── pr/finding-card.tsx
  ├── pr/approval-panel.tsx
  ├── pr/review-history-timeline.tsx
  ├── billing/plan-card.tsx
  ├── billing/usage-meter.tsx
  └── reviews/review-summary-card.tsx

packages/workflow/src/workflows/release-readiness.ts

apps/web/src/app/api/workflow-status/[featureId]/route.ts

packages/services/src/__tests__/feature.service.test.ts
packages/github/src/__tests__/comments.test.ts
packages/ai/src/__tests__/prd-generator.test.ts

.env.example
```

---

*This roadmap covers 39 developer tasks spanning ~38 hours of focused engineering work, addressing every scored deduction, every missing requirement, every mocked feature, and every architecture weakness identified in the evaluation report. Implementation of Phase 1 alone (8 hours) recovers 29 scoring points, bringing the project from 39 to an estimated 68/100. Full execution of all four phases delivers an estimated 92/100.*
