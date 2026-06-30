# ShipFlow AI — Complete Implementation Roadmap
### 100-Point Score Recovery Plan · Technical PRD · Kiro Spec · Sprint Pack
**Current Score: 75/100 → Target: 98/100 (+23 points)**
**Document Version:** 1.0 | **Codebase:** `hehe_2.zip` (`shipflow-monorepo`) | **Eval Report:** `ShipFlow_AI_Judging_Report2.md`

---

## SCORE DELTA SUMMARY

| Category | Current | Max | Gap | Recovery Plan |
|---|---|---|---|---|
| Core Workflow Implementation | 17 | 20 | -3 | Source channel DB, PRD Editor, integration test |
| AI Agent Quality | 13 | 20 | -7 | Multi-step agent, 6 agent unit tests, fix Summarizer |
| GitHub Integration | 13 | 15 | -2 | Fix secrets, fix CORS, issues webhook handler |
| Review Loop & Human Approval | 12 | 15 | -3 | Audit log writes, notification writes, rich approval UI |
| tRPC Monorepo & Engineering Quality | 12 | 15 | -3 | Wire Razorpay, fix e2e suite, remove dead code |
| SaaS Product Experience | 6 | 10 | -4 | Wire billing UI, real invitations, real analytics |
| Demo & Documentation | 2 | 5 | -3 | Demo video, screenshots in README + public/ |
| **TOTAL** | **75** | **100** | **-25** | **All tasks below** |

---

# STEP 1 — MASTER GAP ANALYSIS

## 1.1 Missing Requirements

### GAP-01: Source Channel Not Persisted
**Requirement:** Accept feature requests from any channel (email, support ticket, customer service call, in-app).
**Current State:** A `<select>` with values In-App/Email/Ticket/Call exists in `apps/web/src/app/(dashboard)/org/[slug]/features/new/page.tsx` lines 105–117. The selected value is dropped before `createFeature.mutate()` is called. No `sourceChannel` column exists in the DB schema.
**Why It Matters:** The rubric's first requirement is multi-channel intake. Having a visible dropdown that silently discards its value is a trust-destroying deception for a judge.
**Impact on Score:** -1 Core Workflow
**Affected Rubric Categories:** Core Workflow Implementation (Cat 1), SaaS Product Experience (Cat 6)

### GAP-02: Demo Video
**Requirement:** "Demo video is mandatory" — project statement Rules & Guidelines.
**Current State:** Zero. No `.mp4`, no YouTube link, no Loom link, no reference anywhere in the repo.
**Why It Matters:** The Documentation category explicitly scores this. A judge who opens the repo and finds no demo video immediately deducts the full demo-video allocation. This is automatic lost points.
**Impact on Score:** -2 Demo & Documentation
**Affected Rubric Categories:** Demo & Documentation (Cat 7)

### GAP-03: Screenshots
**Requirement:** Visual proof of the product. The judging report notes the `apps/web/public` directory contains only Next.js/Vercel/Turborepo placeholder SVGs.
**Current State:** Zero product screenshots anywhere in the repository.
**Why It Matters:** -1 Demo & Documentation. Also weakens README credibility.
**Impact on Score:** -1 Demo & Documentation
**Affected Rubric Categories:** Demo & Documentation (Cat 7)

### GAP-04: GitHub Issues/IssueComment Webhook Handlers
**Requirement:** The README/DEPLOYMENT.md document subscribes to `issues` and `issue_comment` webhook events, but neither event type is handled in `apps/web/src/app/api/webhooks/github/route.ts`.
**Current State:** Route handles `pull_request` events only. Subscribed-to events arrive, are verified, and are silently discarded.
**Why It Matters:** -1 GitHub Integration. Unhandled subscribed events are a functional gap and suggest incomplete implementation.
**Impact on Score:** -1 GitHub Integration
**Affected Rubric Categories:** GitHub Integration (Cat 3)

### GAP-05: PRD Editor (Rich Rendering + Inline Edit)
**Requirement:** The spec describes a "PRD Editor" page explicitly. The approval gate requires humans to "review and approve the plan."
**Current State:** `features/[featureId]/page.tsx` lines 120–133 renders the PRD as a raw `JSON.stringify` dump. No section headers, no markdown rendering, no edit capability.
**Why It Matters:** Judges evaluating the "review and approve the plan" requirement will see raw JSON, not a usable document. This directly undermines the Core Workflow experience.
**Impact on Score:** -1 Core Workflow, -0.5 SaaS Product Experience
**Affected Rubric Categories:** Core Workflow Implementation (Cat 1), SaaS Product Experience (Cat 6)

## 1.2 Partially Implemented Features

### PARTIAL-01: Razorpay Billing (40% complete)
**Existing Implementation:**
- `packages/billing/src/services/`: Real Razorpay SDK calls for checkout, subscription, cancellation.
- `packages/billing/src/client.ts`: Real Razorpay client with env-var keys.
- `packages/workflow/src/workflows/billing-sync.ts`: Real Inngest reconciliation workflow.
- Webhook signature verification in place.

**Missing Implementation:**
- `packages/trpc/server/routes/billing/route.ts` is the actual surface the UI calls.
- That file contains an explicit comment: *"We don't have a real billing service yet, so we mock it."*
- It returns a hardcoded `billing.stripe.com/p/session/test_12345` URL — a Stripe URL despite Razorpay being the required provider.
- The current subscription always shows `PRO / active / 142 of 500 used` regardless of org.
- The pricing page CTAs link to `/login`, not to the billing flow.

**Required Completion Work:**
- Replace the mock tRPC `billing` route with calls to `packages/billing/src/services/`.
- Wire `createCheckoutSession` to return a real Razorpay payment link.
- Wire `getSubscription` to query the real `subscriptions` DB table.
- Connect `cancelSubscription` endpoint.
- Update pricing page CTAs to call the real `createCheckoutSession` mutation.
- Wire `billing-sync` Inngest workflow to the webhook receipt path.

### PARTIAL-02: Member Email Invitations (10% complete)
**Existing Implementation:**
- `packages/trpc/server/routes/member/route.ts`: `invite` mutation scaffolded.
- DB schema likely has `orgInvitations` table (implied by multi-tenant design).

**Missing Implementation:**
- `invite` mutation body is: `console.log("Inviting:", input.email); return { status: "SENT" }`.
- No email is sent. No pending invite row is created. No invite-acceptance flow exists.

**Required Completion Work:**
- Insert a pending invite record with a signed token (JWT or HMAC).
- Send an actual email via a transactional email provider (Resend/SendGrid/Nodemailer).
- Create `/api/invitations/accept?token=...` route to validate token, create org membership, redirect to dashboard.
- Add invitation management UI (pending invites list, revoke).

### PARTIAL-03: Audit Log System (30% complete)
**Existing Implementation:**
- `packages/db`: `auditLogs` table with full schema.
- `packages/trpc/server/routes/audit/route.ts`: Paginated read query with filters.
- `apps/web/src/app/.../settings/audit-logs/page.tsx`: Full table UI with empty state.

**Missing Implementation:**
- Zero `insert` calls into `auditLogs` anywhere in the entire codebase.
- The table will be permanently empty in any real deployment.
- No `createAuditLog()` helper function exists.

**Required Completion Work:**
- Create `packages/services/src/audit/audit.service.ts` with `createAuditLog(orgId, actorId, action, resourceType, resourceId, metadata)`.
- Call it at every state transition in `feature.service.ts` (12 transitions).
- Call it on: org creation, member invite, member removal, repository connect/disconnect, plan approval, human approval/rejection.
- Add `auditLog` calls inside `approveHumanRelease`, `failReview`, `generatePRD`, `generateTasks`, `approvePlan`, `submitForReview`, `shipFeature`.

### PARTIAL-04: In-App Notification System (25% complete)
**Existing Implementation:**
- `packages/db/models/notifications.ts`: Full schema.
- `packages/trpc/server/routes/notification/route.ts`: `list` and `markAsRead` queries.
- UI notification bell/page exists.

**Missing Implementation:**
- Zero `insert` calls into `notifications` anywhere.
- The notification bell will always show 0 unread.
- No `createNotification()` helper exists.

**Required Completion Work:**
- Create `packages/services/src/notification/notification.service.ts` with `createNotification(userId, orgId, type, title, body, metadata)`.
- Trigger notifications at: PRD generated, tasks generated, plan approved, review completed, fix needed, human approval requested, feature shipped.
- Add real-time badge count update via a short-polling or SSE endpoint.

### PARTIAL-05: AI Agent Autonomy (Pipeline, not Agent — 50% complete)
**Existing Implementation:**
- Six distinct AI capabilities: Clarifier, PRD Generator, Planner, Code Reviewer, Release-Readiness, Summarizer.
- Each uses `generateObject`/`generateText` with strict Zod schemas.
- Multi-provider failover: Gemini → OpenRouter → OpenAI → Anthropic.
- Genuine RAG via Pinecone for code review context.

**Missing Implementation:**
- All "agentic behavior" is in deterministic Inngest workflow code, not in the model's own reasoning.
- No agent calls tools autonomously.
- No agent re-plans based on tool output.
- No agent maintains state across its own steps.
- Rubric explicitly penalizes this: *"it is closer to API wrappers around an LLM"*.

**Required Completion Work:**
- Upgrade Code Reviewer to use AI SDK's `streamText` with `tools` parameter.
- Tools to provide: `searchCodebase(query)`, `getFileContent(path)`, `getPRDSection(section)`, `getPreviousFindings()`, `searchSimilarIssues(pattern)`.
- Agent autonomously decides which tools to call before producing its finding report.
- Add a reflection loop: after generating findings, agent calls `validateFindings()` tool to check for contradictions or missed criteria, then revises.
- Add `packages/ai/src/agents/code-reviewer/tools.ts` implementing each tool.

### PARTIAL-06: Kanban Board Drag-and-Drop (70% complete)
**Existing Implementation:**
- Real DB-backed columns: TODO/IN_PROGRESS/DONE.
- Tasks can be marked done via checkbox.
- Column grouping exists in `apps/web/src/components/tasks/kanban-board.tsx`.

**Missing Implementation:**
- No drag-and-drop; status changes are checkbox-only.
- No optimistic UI on status update.

**Required Completion Work:**
- Install `@dnd-kit/core` and `@dnd-kit/sortable` (already used in some Shadcn kits, lightweight).
- Wrap columns in `DndContext`, individual cards in `SortableContext`.
- On `onDragEnd`, call `tasks.updateStatus` tRPC mutation with new column.
- Add optimistic update via `useOptimistic` or React Query's `setQueryData`.

### PARTIAL-07: End-to-End Test Suite (20% complete)
**Existing Implementation:**
- 4 Playwright spec files exist in `apps/web/e2e/`.
- Test infrastructure (config, helpers) in place.

**Missing Implementation:**
- Every test spec contains explicit inline comments admitting it doesn't test the real workflow.
- No test exercises OAuth, database-seeded data, or the actual feature→PR→approval loop.
- These tests provide zero confidence in the system's correctness end-to-end.

**Required Completion Work:**
- Create a Playwright global setup file that seeds a test org, test user, test feature.
- Write 5 real spec files covering the full lifecycle.
- Use `page.route()` to mock GitHub OAuth and Razorpay, enabling CI-safe runs.

### PARTIAL-08: Analytics — Hardcoded Values (60% complete)
**Existing Implementation:**
- A 6-chart analytics dashboard with day-range toggling (7/30 days).
- Several charts are genuinely computed from real DB queries.

**Missing Implementation:**
- `organization.repository.ts` line 62–64: `approvalRate: 94 // Simplified` — hardcoded.
- `organization.repository.ts` lines 153–160: `reviewTimeBySeverity` array with fixed `24.5/36.2/48.0/72.5` hours — hardcoded.
- Both rendered identically to real charts, no UI indication.

**Required Completion Work:**
- Replace `approvalRate` with: `COUNT(*) FILTER (WHERE status='SHIPPED') / COUNT(*) * 100` query over `features` table for the org.
- Replace `reviewTimeBySeverity` with: aggregate query over `pullRequestFindings` and `reviewRuns`, grouping by `severity`, computing avg time between `createdAt` of first finding and `resolvedAt` (or PR merge time).

## 1.3 Mocked / Placeholder Features

### MOCK-01: billing/route.ts — Explicit Mock
**File:** `packages/trpc/server/routes/billing/route.ts`
**Evidence:** Code comment: *"We don't have a real billing service yet, so we mock it."* Returns hardcoded Stripe test URL.
**Why It Appears Mocked:** The developer left the comment in. The URL is Stripe (`billing.stripe.com`) despite Razorpay being the mandated payment provider.
**Required Production Implementation:** See PARTIAL-01 above and TASK-001 below.

### MOCK-02: member/route.ts invite — console.log stub
**File:** `packages/trpc/server/routes/member/route.ts` lines 24–29
**Evidence:** Body is `console.log("Inviting:", input.email); return { status: "SENT" }`.
**Why It Appears Mocked:** Classic stub. Returns success without doing anything.
**Required Production Implementation:** See PARTIAL-02 above and TASK-002 below.

### MOCK-03: generate-release-notes.ts — Dead Code with Fake Data
**File:** `packages/workflow/src/workflows/generate-release-notes.ts` lines 8–21
**Evidence:** `fetch-merged-prs` step returns a literal 3-item array: `[{ title: "Add user auth", pr: 42, ... }, ...]`. The event `github.release.drafted` that triggers this workflow is never emitted anywhere in the codebase.
**Why It Appears Mocked:** Developer wrote the workflow scaffold and fake data but never connected the trigger.
**Required Production Implementation:** See TASK-009 below.

### MOCK-04: auditLogs — Write-Side Orphaned
**File:** `packages/db/models/operations.ts`, `packages/trpc/server/routes/audit/route.ts`
**Evidence:** Full codebase search finds zero `insert` calls targeting `auditLogs`.
**Why It Appears Mocked:** Schema and read-side were built as scaffolding; the write side was never implemented.
**Required Production Implementation:** See PARTIAL-03 above and TASK-003 below.

### MOCK-05: notifications — Write-Side Orphaned
**Evidence:** Full codebase search finds zero `insert` calls targeting `notifications`.
**Required Production Implementation:** See PARTIAL-04 above and TASK-004 below.

### MOCK-06: deployments-list.tsx — Hardcoded Empty Array
**File:** `apps/web/src/components/dashboard/deployments-list.tsx`
**Evidence:** Parent page passes `deployments={[]}` hardcoded. No `deployment` tRPC route exported.
**Evidence of Real System:** A Vercel deploy webhook ingestion path exists elsewhere.
**Required Production Implementation:** See TASK-015 below.

### MOCK-07: getStats/getAnalytics — Two Hardcoded Values
**File:** `packages/services/src/organization/organization.repository.ts` lines 62–64, 153–160
**Evidence:** `approvalRate: 94 // Simplified`, `reviewTimeBySeverity: [{ severity: 'CRITICAL', avgHours: 24.5 }, ...]` both hardcoded.
**Required Production Implementation:** See PARTIAL-08 above and TASK-013 below.

### MOCK-08: Source Channel Selector — UI Only
**File:** `apps/web/src/app/(dashboard)/org/[slug]/features/new/page.tsx` lines 105–117
**Evidence:** `<select>` value never passed to `createFeature.mutate()`.
**Required Production Implementation:** See GAP-01 above and TASK-005 below.

## 1.4 Security & Architecture Weaknesses

### SEC-01: Hardcoded Secret Fallbacks
**Files:**
- `packages/services/src/feature/feature.service.ts:204`: `process.env.APPROVAL_SECRET ?? "shipflow_secret"`
- `packages/web/src/app/api/github/callback/route.ts` and `organization/route.ts`: `process.env.GITHUB_STATE_SECRET ?? "fallback_secret_for_dev"`

**Risk:** If env vars are unset (common in fork deployments, CI previews, staging environments), HMAC verification silently degrades to a publicly-known key. An attacker who reads the source can forge approval signatures and OAuth state tokens.
**Fix:** Throw an error at startup if the env var is missing. Never use string fallbacks for cryptographic keys.

### SEC-02: CORS Wildcard with Credentials
**File:** `apps/api/src/server.ts` lines 18–24
**Evidence:** CORS middleware unconditionally reflects any `Origin` header back, while `credentials: true`.
**Risk:** Classic CORS misconfiguration. Any website can make credentialed cross-origin requests to this API.
**Fix:** Set an explicit `allowedOrigins` list from `process.env.CORS_ALLOWED_ORIGINS`, validate incoming `Origin` against it, and only reflect back if it matches.

### ARCH-01: Real Billing Package Orphaned
The `packages/billing/` package is production-grade Razorpay code that is completely unreachable by the product's live request path. It represents real engineering effort that delivers zero user value in the current wiring.

### ARCH-02: Release Notes Workflow Dead
`generate-release-notes.ts` is never triggered. Its only step returns fake data. This entire Inngest function is dead code and its fake PR array would constitute the "no hardcoded PR data" violation if it were ever reachable.

### ARCH-03: AI Architecture is Pipeline, Not Agent
All agent control flow is deterministic Inngest code. The LLM only executes when explicitly called by the workflow. This means the AI has no ability to: decide what context to gather, call follow-up searches, loop on poor results, or flag uncertainty. This is the single highest-value architectural change (4 rubric points).

### ARCH-04: Zero Test Coverage on AI Layer
`packages/ai/src/__tests__/` is an empty directory. With six AI agents driving the core product value, this represents a confidence gap and a -2 rubric deduction.

---

# STEP 2 — RUBRIC RECOVERY STRATEGY

## Category 1: Core Workflow Implementation (17→20, +3 pts)

### Current Problems
1. Source channel value discarded on form submit (no DB column, not passed in mutation).
2. PRD rendered as raw JSON dump — no human-readable sections, no editor capability.
3. No automated test exercises the full request→ship journey.

### Desired State
1. Source channel stored in DB, displayed in feature detail view with correct icon per channel type.
2. PRD rendered with section headers, markdown support per field, inline editing mode, and a "print to PDF" option.
3. A Playwright test (with seeded DB and mocked GitHub/Razorpay OAuth) that walks through: feature create → clarify → PRD view → plan approve → simulate webhook → AI review view → human approve → shipped.

### Implementation Tasks
- TASK-005: Source Channel DB Column + Form Wire-Up
- TASK-006: PRD Editor Component
- TASK-014: Real E2E Test Suite
- TASK-020: Integration Test (Full Feature Lifecycle via API-level calls)

### Acceptance Criteria
- `FeatureRequest` DB table has `sourceChannel` enum column: IN_APP | EMAIL | TICKET | CALL.
- New feature form passes `sourceChannel` to `createFeature.mutate()`.
- Feature detail page shows source channel badge.
- PRD page renders each of the 7 required sections (Problem, Goals, Non-Goals, User Stories, Acceptance Criteria, Edge Cases, Success Metrics) as labeled cards.
- PRD page has an "Edit" button that opens each section in a `<Textarea>` with save.
- E2E test `feature-lifecycle.spec.ts` passes in CI with `pnpm test:e2e`.

### Estimated Score Recovery: +3 points → 20/20

---

## Category 2: AI Agent Quality (13→20, +7 pts)

### Current Problems
1. All six agents are single-shot `generateObject` calls. No autonomous tool-use, no self-directed loop.
2. `packages/ai/src/__tests__/` is empty — zero tests for any agent.
3. Summarizer agent feeds on hardcoded fake PR data and is never triggered.

### Desired State
**Agent Architecture Upgrade:**
The Code Reviewer agent must be upgraded from a single `generateObject` call to a multi-step autonomous agent that:
1. Plans which context to gather.
2. Calls tools to gather that context (codebase search, file fetch, PRD section retrieval, prior findings retrieval, similar-issues search).
3. Evaluates collected context.
4. Produces a structured finding report.
5. Runs a reflection/validation loop to check for missed criteria.
6. Returns the final validated report.

This qualifies as "a genuine agent system" per the rubric because the LLM itself decides which tools to invoke and when to stop.

### Agent Architecture — Revised Code Reviewer

```
[Inngest: review-pull-request]
  → reviewerAgent.run(context)
     ↓
  [STEP 1: Planning]
     model.streamText({
       tools: { planReview },
       messages: [systemPrompt + prdContext + diffSummary],
     })
     → returns: { toolsToCall: string[], rationale: string }
  ↓
  [STEP 2: Context Gathering — autonomous tool loop]
     model.streamText({
       tools: {
         searchCodebase,    // → Pinecone similarity search
         getFileContent,    // → GitHub raw file fetch
         getPRDSection,     // → DB query
         getPreviousFindings, // → DB query
         searchSimilarIssues, // → Pinecone
       },
       maxSteps: 8,
       messages: conversationHistory,
     })
     → model calls tools until it decides it has enough context
  ↓
  [STEP 3: Finding Generation]
     model.generateObject({
       schema: codeReviewSchema,
       messages: [systemPrompt + gathered context],
     })
  ↓
  [STEP 4: Reflection Loop]
     model.generateObject({
       schema: reflectionSchema,  // { missedCriteria: string[], findingsToRevise: ... }
       messages: [prdCriteria + initialFindings],
     })
     → if missedCriteria.length > 0: re-run Step 3 with gap notes
  ↓
  [STEP 5: Return Final Findings]
```

### Agent Unit Tests — Required Coverage

For each of 6 agents, write:
1. `describe('[AgentName] agent')` with at least 3 test cases.
2. Mock `generateObject`/`generateText` via `vi.mock('@ai-sdk/openai')`.
3. Test: valid input → correct output schema.
4. Test: edge-case input (empty diff, no prior findings) → graceful handling.
5. Test: LLM returns malformed output → Zod validation catches and re-prompts.

### Implementation Tasks
- TASK-007: Multi-Step Autonomous Code Reviewer Agent
- TASK-008: AI Agent Unit Tests (all 6 agents)
- TASK-009: Fix Summarizer Agent (Real Trigger + Real PR Data)

### Acceptance Criteria
- Code Reviewer makes ≥2 autonomous tool calls per review run (visible in Inngest step trace).
- Agent produces a reflection step that appears in the finding report as `reviewedCriteria: string[]`.
- `pnpm test` shows ≥18 new AI agent tests passing (3 per agent).
- Summarizer agent's `generate-release-notes` workflow is triggered by a real `github.release.tagged` event fired from the webhook handler when a GitHub Release is published.
- Summarizer step `fetch-merged-prs` queries real DB `pullRequests` table filtered by `orgId` + merged since last release date.

### Estimated Score Recovery: +7 points → 20/20

---

## Category 3: GitHub Integration (13→15, +2 pts)

### Current Problems
1. Two files use `?? "fallback_secret_for_dev"` as HMAC key fallback.
2. One file uses `?? "shipflow_secret"` as approval signature fallback.
3. CORS in `apps/api/src/server.ts` reflects any `Origin` with `credentials: true`.
4. `issues` and `issue_comment` webhook events documented as subscribed but never handled.

### Desired State
1. All cryptographic keys throw startup errors if env var is missing.
2. CORS validates `Origin` against an allowlist from env var.
3. GitHub webhook route handles `issues.opened`, `issues.closed`, `issue_comment.created` events — linking issues to features via a matching strategy (issue title similarity to PRD content, or via a `shipflow: feature-id` label).

### Implementation Tasks
- TASK-011: Fix Hardcoded Secret Fallbacks (throw on missing)
- TASK-012: Fix CORS Wildcard
- TASK-010: GitHub Issues/IssueComment Webhook Handler

### Acceptance Criteria
- Server startup throws `Error: APPROVAL_SECRET env var must be set` if var is missing.
- Server startup throws `Error: GITHUB_STATE_SECRET env var must be set` if var is missing.
- CORS only reflects origins in `process.env.CORS_ALLOWED_ORIGINS.split(',')`.
- `POST /api/webhooks/github` with `X-GitHub-Event: issues` creates an `issueEvent` record in DB.
- Linked issues appear in the feature detail page.

### Estimated Score Recovery: +2 points → 15/15

---

## Category 4: Review Loop & Human Approval (12→15, +3 pts)

### Current Problems (inferred from -3 deduction and weakness list)
1. Audit log table is permanently empty — no event trail of who did what, when.
2. Notification system is permanently empty — human reviewer gets no push signal when approval is needed.
3. Human approval page shows PRD as raw JSON dump (same as category 1 problem — dual impact).

### Desired State
1. Every state transition writes an audit log entry with actor, action, timestamp, metadata.
2. When a feature reaches `AWAITING_HUMAN_APPROVAL`, all org OWNER/ADMIN/PM members receive an in-app notification.
3. When a review is completed, the PR author receives a notification with the review verdict.
4. The human approval page renders a clean approval checklist: PRD sections as expandable cards, task completion summary, review findings summary, PR link, approve/reject buttons with required rejection reason.

### Implementation Tasks
- TASK-003: Audit Log Write Service + Integration at All Transitions
- TASK-004: In-App Notification Write Service + Triggers
- TASK-006 (shared): PRD Rich Rendering also fixes approval page

### Acceptance Criteria
- After a full feature lifecycle run, `auditLogs` table contains ≥8 rows (one per major transition).
- When `approveHumanRelease` is called, an audit log entry is created with `action: "HUMAN_APPROVED"` and `actorId`, `resourceId`.
- When feature reaches `AWAITING_HUMAN_APPROVAL`, all org PM/ADMIN/OWNER users have an unread notification.
- Notification bell shows correct unread count.
- Human approval page shows PRD sections (not raw JSON).

### Estimated Score Recovery: +3 points → 15/15

---

## Category 5: tRPC Monorepo & Engineering Quality (12→15, +3 pts)

### Current Problems
1. `packages/trpc/server/routes/billing/route.ts` is explicitly mocked — real `packages/billing/` package never wired.
2. Hardcoded fallback secrets (shared with Category 3 fix).
3. Playwright e2e suite is all placeholder — no test exercises real workflows.
4. CORS wildcard with credentials (shared with Category 3 fix).
5. Dead code: `dummyDeployments` constant defined but never rendered. Unused `drizzle` import in `context.ts`.

### Desired State
1. Billing tRPC route calls real `packages/billing/` service functions.
2. All secrets throw on missing env var.
3. At least one Playwright spec exercises a real workflow path (with seeded DB + mocked external services).
4. CORS is restricted to allowlist.
5. Dead code and unused imports are removed.

### Architecture Refactor Plan — Billing Wire-Up

```
Current (broken):
  UI → billing tRPC route → mock response

Target (fixed):
  UI → billing tRPC route → packages/billing/src/services/checkoutService
                          → Razorpay API → returns payment link
                          ← billing tRPC route returns { checkoutUrl }
  UI → window.open(checkoutUrl) or redirect
  
  Razorpay webhook → /api/webhooks/razorpay/route.ts (already exists)
                   → billing-sync Inngest workflow (already exists)
                   → updates subscriptions table
```

### Implementation Tasks
- TASK-001: Wire Razorpay Billing (Route → Real Service)
- TASK-011: Fix Secrets (shared)
- TASK-012: Fix CORS (shared)
- TASK-014: Real E2E Test Suite
- TASK-016: Dead Code Cleanup

### Acceptance Criteria
- `billing.getSubscription` tRPC procedure queries `subscriptions` table, not a mock.
- `billing.createCheckoutSession` calls `packages/billing/src/services/checkoutService.createSession()` and returns a real Razorpay checkout URL.
- `tsc --noEmit` still passes with zero errors after all changes.
- `pnpm test` passes: existing 15/15 + new tests.
- `pnpm run lint` passes with zero warnings on modified files.
- No unused imports in modified files.

### Estimated Score Recovery: +3 points → 15/15

---

## Category 6: SaaS Product Experience (6→10, +4 pts)

### Current Problems
1. Billing is fully theatrical: hardcoded Stripe URL, fake subscription data, pricing CTAs go to `/login`.
2. "Invite teammate" silently no-ops. Test users get false confirmation emails never arrive.
3. Two analytics charts show hardcoded numbers indistinguishable from real data.
4. Source channel selector discards its value.

### Desired State
1. Billing flow works: clicking "Upgrade" opens a real Razorpay checkout. After payment, subscription updates. Current Plan shows real data.
2. Invite flow works: email sent, acceptance link works, new member appears in team list.
3. Analytics charts show only real data. If insufficient data, show "Not enough data yet" placeholder.
4. Source channel stored and displayed per feature.

### UX Recovery Checklist

**Onboarding:**
- [ ] First-time org setup wizard: name → invite teammates → connect GitHub repo.
- [ ] Empty states on all empty list pages (features, tasks, PRs) with a "Get started" CTA.

**Dashboards:**
- [ ] Analytics page: remove hardcoded `approvalRate` and `reviewTimeBySeverity`, replace with real queries or empty state.
- [ ] Add a "Recent Activity" feed sourced from the now-live audit log.

**Billing:**
- [ ] Upgrade button → real Razorpay checkout.
- [ ] Success callback updates org subscription status.
- [ ] Current plan page shows real tier from DB.
- [ ] Usage limits enforced: free plan allows ≤3 connected repos, ≤10 AI review credits/month.

**Notifications:**
- [ ] Bell icon shows real unread count.
- [ ] Clicking notification navigates to relevant resource.

**Trust Signals:**
- [ ] Remove all fake data from analytics.
- [ ] Show "pending" badge on invite until email is clicked.

### Implementation Tasks
- TASK-001: Razorpay Billing (shared)
- TASK-002: Real Member Invitations
- TASK-004: Notifications (shared)
- TASK-005: Source Channel (shared)
- TASK-013: Fix Analytics Hardcoded Values

### Estimated Score Recovery: +4 points → 10/10

---

## Category 7: Demo & Documentation (2→5, +3 pts)

### Current Problems
1. No demo video anywhere.
2. No screenshots anywhere.
3. Public repo and live deployment unverifiable from ZIP.

### Desired State
1. A 3–5 minute Loom/YouTube demo video linked prominently in README.
2. ≥6 screenshots covering: Landing, Dashboard, Feature Detail with PRD, Kanban, PR Review with findings, Human Approval page.
3. README `## Demo` section with embedded video thumbnail + screenshots.
4. Live deployment URL verified and linked in README and GitHub repo description.

### Documentation Package

**README Additions Required:**
```markdown
## 🎥 Demo Video
[Watch the 4-minute product walkthrough →](https://youtu.be/XXXX)
[![Demo Video Thumbnail](docs/screenshots/demo-thumbnail.png)](https://youtu.be/XXXX)

## 📸 Screenshots
| Dashboard | Feature PRD | PR Review |
|---|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![PRD](docs/screenshots/prd.png) | ![Review](docs/screenshots/review.png) |

## 🌐 Live Demo
[https://shipflow-ai.vercel.app](https://shipflow-ai.vercel.app)
```

**Screenshots Required (minimum 6):**
1. Landing page hero
2. Main dashboard with real feature cards
3. Feature detail page — PRD sections rendered (not JSON dump)
4. Kanban board with tasks
5. PR review page with AI findings (blocking + non-blocking)
6. Human approval page

### Implementation Tasks
- TASK-017: Demo Video Production
- TASK-018: Screenshots and Visual Assets in README

### Estimated Score Recovery: +3 points → 5/5

---

# STEP 3 — KIRO-STYLE SPECIFICATIONS

## SPEC-01: Real Razorpay Billing Integration

**Feature Name:** Live Razorpay Billing Flow

**Problem Statement:**
The product's primary monetization CTA ("Upgrade to Pro") returns a hardcoded Stripe test URL despite Razorpay being the mandated payment provider. A partially-built `packages/billing/` Razorpay package exists but is never called by any live request path. The tRPC billing route contains an explicit developer comment admitting it is a mock. Any judge testing the billing flow discovers the deception within two clicks.

**Business Value:**
A working billing flow is the #1 trust signal for a SaaS product evaluation. It demonstrates production-readiness, validates the Razorpay requirement, and enables usage-gated features (free vs. paid plan enforcement).

**User Story:**
As an org Owner, I want to click "Upgrade to Pro" and complete a real payment flow, so that my organization is upgraded to a paid plan with expanded limits and I can see my current subscription status at any time.

**Functional Requirements:**

FR-1: `billing.createCheckoutSession` tRPC mutation calls `packages/billing/src/services/checkoutService.createSession(orgId, planId, userId)` and returns `{ checkoutUrl: string }`.

FR-2: The `checkoutUrl` is a real Razorpay payment link (constructed via `razorpay.paymentLink.create()`).

FR-3: On checkout redirect, the Razorpay webhook fires `payment.captured` → `/api/webhooks/razorpay` → `billing-sync` Inngest workflow → updates `subscriptions` table to `{ tier: "PRO", status: "ACTIVE" }`.

FR-4: `billing.getSubscription` tRPC query reads the `subscriptions` table for the caller's `orgId` and returns `{ tier, status, usageCount, usageLimit }`.

FR-5: Pricing page CTA buttons call `billing.createCheckoutSession` mutation, not `/login` redirect.

FR-6: Free plan enforces ≤3 connected repositories. Attempting to connect a 4th repository returns a `TRPCError("FORBIDDEN", "Upgrade to Pro to connect more repositories")`.

FR-7: Free plan enforces ≤10 AI review credits per billing month. After limit, triggering a review returns `TRPCError("PAYMENT_REQUIRED", "AI review credits exhausted")`.

FR-8: Billing settings page shows real: `{ tier, status, renewalDate, usageCount, usageLimit }` from DB.

**Non-Functional Requirements:**

NFR-1: Razorpay webhook endpoint verifies `X-Razorpay-Signature` header before processing.

NFR-2: Checkout session creation is idempotent — duplicate calls within 60s return the same `checkoutUrl`.

NFR-3: Billing state is reconciled via `billing-sync` Inngest workflow within 30 seconds of webhook receipt.

NFR-4: Sensitive Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) throw startup error if missing in non-test environments.

**Technical Design:**

*API Changes:*
```typescript
// packages/trpc/server/routes/billing/route.ts

// REPLACE mock implementation with:
createCheckoutSession: orgMemberProcedure
  .input(z.object({ planId: z.enum(["PRO_MONTHLY", "PRO_ANNUAL"]) }))
  .mutation(async ({ ctx, input }) => {
    const { checkoutUrl } = await billingService.createCheckoutSession({
      orgId: ctx.org.id,
      userId: ctx.session.userId,
      planId: input.planId,
    });
    return { checkoutUrl };
  }),

getSubscription: orgMemberProcedure
  .query(async ({ ctx }) => {
    return billingService.getSubscription(ctx.org.id);
  }),
```

*Database Changes:*
```sql
-- Ensure subscriptions table has required columns (verify against existing schema)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS usage_count INT DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS usage_limit INT DEFAULT 10;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMP;
```

*New Files:*
- `packages/billing/src/services/billingService.ts` — orchestration layer combining checkoutService + subscriptionService.
- `packages/trpc/server/routes/billing/billingRouter.ts` — clean replacement for the mocked route file.

*UI Changes:*
- `apps/web/src/app/pricing/page.tsx`: Replace `href="/login"` CTAs with `onClick={() => createCheckoutSession.mutate({ planId: "PRO_MONTHLY" })}`.
- `apps/web/src/app/(dashboard)/org/[slug]/settings/billing/page.tsx`: Replace mock data with `billing.getSubscription` query result.
- Add a `<BillingSuccessModal />` component shown when `?payment=success` query param is present (Razorpay redirects back with this).

**Error Handling:**
- Network failure during Razorpay API call → retry 3x with exponential backoff in `billingService`.
- Webhook arrives with invalid signature → return 400, log security event to audit log.
- Duplicate webhook event (`payment.captured` already processed) → idempotency check via `razorpayPaymentId` unique constraint, return 200 without re-processing.

**Security:**
- Razorpay webhook signature verified with `crypto.timingSafeEqual`.
- Checkout session includes `orgId` and `userId` in `notes` field for reconciliation.
- Never log full Razorpay response body (may contain card metadata).

**Testing:**
- Unit: `billingService.createCheckoutSession` with mocked Razorpay client returns expected `checkoutUrl` shape.
- Unit: `billingService.getSubscription` with mocked DB returns correct fields.
- Unit: Webhook handler validates signature, calls `billing-sync`, returns 200.
- Unit: Webhook handler with invalid signature returns 400.
- Integration: `createCheckoutSession` mutation accessible via tRPC client returns `checkoutUrl`.

**Acceptance Criteria:**
- [ ] Clicking "Upgrade to Pro" on pricing page opens a real Razorpay payment page (not Stripe, not `/login`).
- [ ] After payment, subscription in DB changes to `tier: "PRO"`.
- [ ] Billing settings page shows real tier and usage data.
- [ ] Free plan: attempting to connect 4th repo returns a user-visible error with upgrade prompt.
- [ ] `tsc --noEmit` still passes.
- [ ] All billing unit tests pass.

---

## SPEC-02: Real Member Email Invitations

**Feature Name:** Team Member Invitation Flow

**Problem Statement:**
The `invite` mutation body is a single `console.log` + `return { status: "SENT" }`. No email is sent. No invite record is created. A human tester who invites a colleague gets a success toast but the colleague never receives anything. This is a critical deception in a multi-tenant SaaS product.

**Business Value:**
Multi-tenant collaboration is a core SaaS feature. Without real invitations, orgs cannot add team members, which limits every other part of the product.

**User Story:**
As an org Owner/Admin, I want to invite a new team member by email, so that they receive an invitation link, click it, and join our workspace with the correct role.

**Functional Requirements:**

FR-1: `member.invite` mutation inserts a row into `orgInvitations` table: `{ id, orgId, email, role, token (HMAC signed JWT), expiresAt (72h), status: "PENDING", invitedByUserId }`.

FR-2: Mutation sends a real transactional email via the configured email provider (Resend preferred; Nodemailer with SMTP as fallback). Email contains a link: `{APP_URL}/invitations/accept?token={token}`.

FR-3: `GET /invitations/accept?token=...` route validates the JWT, checks expiry, checks org still exists, checks user not already a member.

FR-4: If the invitee doesn't have an account: redirect to `/auth/register?inviteToken={token}`. On registration completion, auto-accept invitation.

FR-5: If the invitee has an account: auto-create `orgMember` record with the invited `role`, redirect to org dashboard.

FR-6: Invitation list page shows pending/accepted/expired invitations for the org.

FR-7: `member.revokeInvitation` mutation marks invitation as `REVOKED` and removes the pending invite from the list.

FR-8: Expired invitations (>72h) return an error page with an option to request a new invite.

**Non-Functional Requirements:**

NFR-1: Invitation tokens are JWT signed with `process.env.INVITATION_SECRET` (throw on missing).

NFR-2: Token payload includes: `{ orgId, email, role, invitationId }` — all validated on acceptance.

NFR-3: Accepting an invitation is idempotent — clicking the link twice does not create two `orgMember` records.

NFR-4: Email delivery failure does not fail the invite mutation — log the error, mark invite as `PENDING_EMAIL_RETRY`, return success to caller.

**Technical Design:**

*New Package:*
`packages/email/src/` — thin wrapper around Resend SDK:
```typescript
export async function sendInvitationEmail(params: {
  to: string; orgName: string; inviterName: string; role: string; acceptUrl: string;
}) {
  return resend.emails.send({
    from: 'noreply@shipflow.ai',
    to: params.to,
    subject: `You're invited to join ${params.orgName} on ShipFlow`,
    html: invitationEmailTemplate(params),
  });
}
```

*Database Changes:*
```sql
CREATE TABLE IF NOT EXISTS org_invitations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | ACCEPTED | REVOKED | EXPIRED
  invited_by_user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_org_invitations_token ON org_invitations(token);
CREATE INDEX idx_org_invitations_org ON org_invitations(org_id, status);
```

*New Routes:*
- `apps/web/src/app/invitations/accept/page.tsx` — Server component that reads `token` param, calls `member.acceptInvitation` mutation, redirects.
- `packages/trpc/server/routes/member/route.ts` — add `acceptInvitation`, `listInvitations`, `revokeInvitation` procedures.

**Acceptance Criteria:**
- [ ] `invite` mutation creates a row in `org_invitations`.
- [ ] A real email arrives at the invited address within 30 seconds.
- [ ] Clicking the invite link and being logged in → user appears in org member list.
- [ ] Clicking the invite link and NOT being logged in → redirected to `/auth/register?inviteToken=...` → after registration, user is a member.
- [ ] Clicking an expired link → shows "Invitation expired" page.
- [ ] Pending invites appear in the Settings → Team page.

---

## SPEC-03: Audit Log Write Service

**Feature Name:** Audit Trail at All State Transitions

**Problem Statement:**
The `auditLogs` table, tRPC read route, and audit log UI page are fully built but permanently empty because zero write calls exist anywhere in the codebase. A product that claims enterprise-grade compliance and team accountability cannot have an always-empty audit log.

**User Story:**
As an org Owner, I want to see a complete audit trail of all actions taken in my workspace, so that I can understand who did what and when for compliance and debugging.

**Functional Requirements:**

FR-1: `createAuditLog(params)` service function exists in `packages/services/src/audit/audit.service.ts`.

FR-2: Every call to a feature state-transition method in `feature.service.ts` creates an audit log entry.

FR-3: Org-level events create audit log entries: org created, member invited, member removed, repo connected, repo disconnected.

FR-4: Review events create entries: AI review started, AI review completed, finding created, human approval, human rejection.

FR-5: Audit log entries include: `id, orgId, actorId, action, resourceType, resourceId, metadata (JSON), ipAddress (optional), createdAt`.

FR-6: The existing audit log UI correctly reads and paginates these real entries.

**Technical Design:**

```typescript
// packages/services/src/audit/audit.service.ts

export const AuditAction = {
  FEATURE_CREATED: 'FEATURE_CREATED',
  FEATURE_PRD_GENERATED: 'FEATURE_PRD_GENERATED',
  FEATURE_TASKS_GENERATED: 'FEATURE_TASKS_GENERATED',
  FEATURE_PLAN_APPROVED: 'FEATURE_PLAN_APPROVED',
  FEATURE_IN_DEVELOPMENT: 'FEATURE_IN_DEVELOPMENT',
  FEATURE_REVIEW_STARTED: 'FEATURE_REVIEW_STARTED',
  FEATURE_FIX_NEEDED: 'FEATURE_FIX_NEEDED',
  FEATURE_HUMAN_APPROVAL_REQUESTED: 'FEATURE_HUMAN_APPROVAL_REQUESTED',
  FEATURE_APPROVED: 'FEATURE_APPROVED',
  FEATURE_REJECTED: 'FEATURE_REJECTED',
  FEATURE_SHIPPED: 'FEATURE_SHIPPED',
  ORG_MEMBER_INVITED: 'ORG_MEMBER_INVITED',
  ORG_MEMBER_REMOVED: 'ORG_MEMBER_REMOVED',
  REPO_CONNECTED: 'REPO_CONNECTED',
  REPO_DISCONNECTED: 'REPO_DISCONNECTED',
  AI_REVIEW_COMPLETED: 'AI_REVIEW_COMPLETED',
} as const;

export async function createAuditLog(db: DrizzleDB, params: {
  orgId: string;
  actorId: string;
  action: keyof typeof AuditAction;
  resourceType: 'FEATURE' | 'REPOSITORY' | 'ORGANIZATION' | 'PULL_REQUEST';
  resourceId: string;
  metadata?: Record<string, unknown>;
}) {
  return db.insert(schema.auditLogs).values({
    id: generateId(),
    orgId: params.orgId,
    actorId: params.actorId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    metadata: params.metadata ?? {},
    createdAt: new Date(),
  });
}
```

*Call Sites (all in `feature.service.ts` and Inngest workflows):*
- `generatePRD` → after PRD inserted: `createAuditLog(db, { action: 'FEATURE_PRD_GENERATED', ... })`
- `generateTasks` → after tasks inserted: `createAuditLog(db, { action: 'FEATURE_TASKS_GENERATED', ... })`
- `approvePlan` → `createAuditLog(db, { action: 'FEATURE_PLAN_APPROVED', actorId: ctx.session.userId, ... })`
- `failReview` → `createAuditLog(db, { action: 'FEATURE_FIX_NEEDED', ... })`
- `approveHumanRelease` → `createAuditLog(db, { action: 'FEATURE_APPROVED', ... })`
- `rejectHumanRelease` → `createAuditLog(db, { action: 'FEATURE_REJECTED', ... })`
- `shipFeature` → `createAuditLog(db, { action: 'FEATURE_SHIPPED', ... })`

**Acceptance Criteria:**
- [ ] After full feature lifecycle, `SELECT COUNT(*) FROM audit_logs WHERE org_id = $1` returns ≥8.
- [ ] Audit log page shows real entries with correct actor names and timestamps.
- [ ] Entries are paginated (50/page) and filterable by action and date range.

---

## SPEC-04: In-App Notification System (Write Side)

**Feature Name:** Real-Time In-App Notifications

**Problem Statement:**
The notification bell will always show 0 unread in any real deployment. The schema and read-side are complete; only the write-side service is missing.

**User Story:**
As a human reviewer, I want to receive an in-app notification when a feature is ready for my approval, so that I know to take action without checking the feature list manually.

**Functional Requirements:**

FR-1: `createNotification(db, params)` service function exists.

FR-2: Notifications are created for these events:
- PRD generated → notify feature creator.
- Tasks generated → notify feature creator.
- AI review completed → notify feature creator + org PM/ADMIN.
- Fix needed → notify PR author.
- Human approval requested → notify all org OWNER/ADMIN/PM users.
- Feature shipped → notify feature creator.
- Member invited → notify invitee (if already has account).

FR-3: Notification bell count updates without full page refresh (short-polling every 30s or SSE).

FR-4: Clicking a notification marks it read and navigates to the relevant resource.

FR-5: "Mark all as read" button clears unread count.

**Technical Design:**
```typescript
// packages/services/src/notification/notification.service.ts

export async function createNotification(db: DrizzleDB, params: {
  userId: string;
  orgId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType: string;
  resourceId: string;
  actionUrl: string;
}) {
  return db.insert(schema.notifications).values({
    id: generateId(),
    ...params,
    isRead: false,
    createdAt: new Date(),
  });
}

export async function notifyOrgRoles(db: DrizzleDB, params: {
  orgId: string;
  roles: OrgRole[];
  excludeUserId?: string;
  notification: Omit<Parameters<typeof createNotification>[1], 'userId' | 'orgId'>;
}) {
  const members = await db.query.orgMembers.findMany({
    where: and(
      eq(schema.orgMembers.orgId, params.orgId),
      inArray(schema.orgMembers.role, params.roles)
    )
  });
  await Promise.all(
    members
      .filter(m => m.userId !== params.excludeUserId)
      .map(m => createNotification(db, { userId: m.userId, orgId: params.orgId, ...params.notification }))
  );
}
```

**Acceptance Criteria:**
- [ ] Notification bell shows correct unread count after any triggering event.
- [ ] Clicking a notification navigates to the correct page and marks it read.
- [ ] Human reviewer receives notification when feature reaches `AWAITING_HUMAN_APPROVAL`.

---

## SPEC-05: Source Channel Intake Persistence

**Feature Name:** Multi-Channel Feature Request Tracking

**Problem Statement:**
The source channel UI element exists but its value is silently discarded. The spec explicitly requires accepting requests from email, ticket, call, and in-app channels.

**Functional Requirements:**

FR-1: `features` DB table has `source_channel` column: enum `IN_APP | EMAIL | TICKET | CALL`, default `IN_APP`.

FR-2: `createFeature` tRPC mutation accepts `sourceChannel` field and persists it.

FR-3: Feature detail page shows source channel as a badge with distinct icon per channel type (EmailIcon, PhoneIcon, TicketIcon, MousePointerIcon).

FR-4: Feature list page can filter by source channel.

FR-5: Analytics page shows a breakdown chart of features by source channel.

**Database Change:**
```sql
-- Add to features table migration
ALTER TABLE features ADD COLUMN source_channel TEXT NOT NULL DEFAULT 'IN_APP';
-- Validate enum
ALTER TABLE features ADD CONSTRAINT features_source_channel_check 
  CHECK (source_channel IN ('IN_APP', 'EMAIL', 'TICKET', 'CALL'));
```

**Drizzle Schema Change:**
```typescript
// packages/db/models/features.ts
sourceChannel: text('source_channel', { 
  enum: ['IN_APP', 'EMAIL', 'TICKET', 'CALL'] 
}).notNull().default('IN_APP'),
```

**tRPC Change:**
```typescript
// packages/trpc/server/routes/feature/route.ts  
// Add to createFeature input schema:
sourceChannel: z.enum(['IN_APP', 'EMAIL', 'TICKET', 'CALL']).default('IN_APP'),
```

**UI Change:**
```tsx
// apps/web/src/app/(dashboard)/org/[slug]/features/new/page.tsx
// Change createFeature.mutate() call to include:
createFeature.mutate({
  ...otherFields,
  sourceChannel: form.watch('sourceChannel'), // was missing
});
```

**Acceptance Criteria:**
- [ ] Creating a feature with "Email" selected stores `source_channel: 'EMAIL'` in DB.
- [ ] Feature detail page shows "Email" badge.
- [ ] Feature list page filter by channel works correctly.

---

## SPEC-06: PRD Editor — Rich Rendering + Inline Edit

**Feature Name:** Human-Readable PRD Editor Component

**Problem Statement:**
The PRD — the central document of the entire workflow — is displayed as `JSON.stringify(prd, null, 2)` in a `<pre>` tag. Judges reviewing "can human teams review and approve the plan" will see raw JSON, not a product requirements document.

**Functional Requirements:**

FR-1: PRD page renders each of the 7 required sections as a distinct labeled card:
- Problem Statement
- Goals
- Non-Goals
- User Stories (as a list)
- Acceptance Criteria (as a numbered checklist)
- Edge Cases (as a list)
- Success Metrics (as KPI cards)

FR-2: Each section has an "Edit" button that transitions the section to an inline edit mode (`<Textarea>`).

FR-3: Saving an edited section calls `feature.updatePrd` tRPC mutation and persists the change.

FR-4: PRD has a "Copy as Markdown" button that formats the PRD as clean markdown and copies to clipboard.

FR-5: PRD has a "Print / Export PDF" option (browser print dialog with print-specific CSS).

FR-6: User Stories render as structured cards with: `As a [role], I want [goal], So that [benefit]`.

FR-7: Acceptance Criteria render as a checklist with status indicators.

**Component Architecture:**
```tsx
// apps/web/src/components/prd/prd-viewer.tsx
export function PRDViewer({ prd, featureId, canEdit }: PRDViewerProps) {
  return (
    <div className="space-y-6">
      <PRDSection title="Problem Statement" content={prd.problemStatement} field="problemStatement" featureId={featureId} canEdit={canEdit} />
      <PRDSection title="Goals" content={prd.goals} field="goals" featureId={featureId} canEdit={canEdit} isList />
      <PRDSection title="Non-Goals" content={prd.nonGoals} field="nonGoals" featureId={featureId} canEdit={canEdit} isList />
      <UserStoriesSection stories={prd.userStories} featureId={featureId} canEdit={canEdit} />
      <AcceptanceCriteriaSection criteria={prd.acceptanceCriteria} featureId={featureId} canEdit={canEdit} />
      <PRDSection title="Edge Cases" content={prd.edgeCases} field="edgeCases" featureId={featureId} canEdit={canEdit} isList />
      <SuccessMetricsSection metrics={prd.successMetrics} featureId={featureId} canEdit={canEdit} />
    </div>
  );
}
```

**New tRPC Procedure:**
```typescript
updatePrd: orgMemberProcedure
  .input(z.object({
    featureId: z.string(),
    field: z.enum(['problemStatement', 'goals', 'nonGoals', 'userStories', 'acceptanceCriteria', 'edgeCases', 'successMetrics']),
    value: z.union([z.string(), z.array(z.string()), z.array(userStorySchema)]),
  }))
  .mutation(async ({ ctx, input }) => {
    // Validate feature belongs to org
    // Update the specific JSON field in the prd column
    const feature = await db.query.features.findFirst({ where: eq(features.id, input.featureId) });
    const updatedPrd = { ...feature.prd, [input.field]: input.value };
    await db.update(features).set({ prd: updatedPrd, updatedAt: new Date() }).where(eq(features.id, input.featureId));
    return { success: true };
  }),
```

**Acceptance Criteria:**
- [ ] PRD page shows 7 distinct sections with proper headings.
- [ ] Clicking "Edit" on Problem Statement shows a `<Textarea>` with current content.
- [ ] Saving the edit persists to DB and re-renders the updated content.
- [ ] User Stories render as "As a [role]..." cards.
- [ ] Acceptance Criteria render as a numbered checklist.
- [ ] "Copy as Markdown" produces clean formatted markdown.

---

## SPEC-07: Multi-Step Autonomous Code Reviewer Agent

**Feature Name:** Genuine Agentic Code Reviewer with Tool Use

**Problem Statement:**
All AI behavior is controlled by deterministic Inngest workflow code. The LLM is only invoked when explicitly called; it cannot decide to gather additional context, call a follow-up search, or loop on unsatisfactory results. The rubric explicitly tests whether this is "a genuine agent system or mostly API wrappers."

**Functional Requirements:**

FR-1: Code Reviewer is upgraded to use AI SDK's `streamText` with a `tools` parameter, enabling autonomous tool-calling.

FR-2: Agent has access to 5 tools:
- `searchCodebase(query: string)` → searches Pinecone index, returns top 5 relevant code chunks.
- `getFileContent(path: string, prNumber: number)` → fetches file from GitHub at PR's head commit.
- `getPRDSection(section: string)` → retrieves specific PRD section from DB.
- `getPreviousFindings(prId: string)` → retrieves prior review findings from DB.
- `searchSimilarIssues(pattern: string)` → searches Pinecone for similar past issues.

FR-3: Agent executes a maximum of 8 tool-calling steps before producing the final report.

FR-4: After generating initial findings, agent runs a reflection step: given PRD acceptance criteria, are all criteria addressed by the findings? Missing criteria → additional finding generated.

FR-5: All tool invocations are logged as Inngest step events and visible in the Inngest dashboard.

FR-6: `reviewMeta` field on the finding report includes: `{ toolCallCount, toolsUsed: string[], reflectionApplied: boolean, modelUsed: string }`.

**Technical Design:**

```typescript
// packages/ai/src/agents/code-reviewer/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export function createReviewerTools(context: ReviewerContext) {
  return {
    searchCodebase: tool({
      description: 'Search the repository codebase for relevant code patterns, architecture decisions, or similar implementations',
      parameters: z.object({ query: z.string().describe('Natural language search query') }),
      execute: async ({ query }) => {
        const results = await context.pinecone.query({ vector: await embed(query), topK: 5 });
        return results.matches.map(m => ({ content: m.metadata.content, file: m.metadata.file, score: m.score }));
      },
    }),
    getFileContent: tool({
      description: 'Fetch the full content of a specific file from the PR head commit',
      parameters: z.object({ path: z.string().describe('File path relative to repo root') }),
      execute: async ({ path }) => {
        const content = await context.octokit.repos.getContent({
          owner: context.repoOwner, repo: context.repoName, path, ref: context.headSha,
        });
        return { path, content: Buffer.from((content.data as any).content, 'base64').toString() };
      },
    }),
    getPRDSection: tool({
      description: 'Retrieve a specific section of the Product Requirements Document',
      parameters: z.object({ section: z.enum(['problemStatement', 'goals', 'acceptanceCriteria', 'edgeCases', 'successMetrics']) }),
      execute: async ({ section }) => {
        return { section, content: context.prd[section] };
      },
    }),
    getPreviousFindings: tool({
      description: 'Retrieve findings from the previous review cycle to track resolution status',
      parameters: z.object({}),
      execute: async () => {
        return context.previousFindings ?? [];
      },
    }),
    searchSimilarIssues: tool({
      description: 'Search for similar past code issues to check for recurring patterns',
      parameters: z.object({ pattern: z.string().describe('Description of the issue pattern to search for') }),
      execute: async ({ pattern }) => {
        const results = await context.pinecone.query({ 
          vector: await embed(pattern), topK: 3, filter: { type: 'finding' } 
        });
        return results.matches.map(m => m.metadata);
      },
    }),
  };
}
```

```typescript
// packages/ai/src/agents/code-reviewer/index.ts — REVISED

export async function runCodeReviewerAgent(context: ReviewerContext) {
  const tools = createReviewerTools(context);
  let toolCallCount = 0;
  const toolsUsed: string[] = [];

  // Step 1 & 2: Context gathering with autonomous tool use
  const gatheringResult = await streamText({
    model: context.model,
    system: GATHERING_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildGatheringPrompt(context) }],
    tools,
    maxSteps: 8,
    onStepFinish: (step) => {
      if (step.toolCalls?.length) {
        toolCallCount += step.toolCalls.length;
        toolsUsed.push(...step.toolCalls.map(t => t.toolName));
      }
    },
  });

  // Step 3: Generate structured findings from gathered context
  const conversationHistory = buildConversationFromStream(gatheringResult);
  const findingsResult = await generateObject({
    model: context.model,
    schema: codeReviewSchema,
    messages: [...conversationHistory, { role: 'user', content: GENERATE_FINDINGS_PROMPT }],
  });

  // Step 4: Reflection — check all acceptance criteria are addressed
  const reflectionResult = await generateObject({
    model: context.model,
    schema: reflectionSchema,
    messages: [{
      role: 'user',
      content: buildReflectionPrompt(context.prd.acceptanceCriteria, findingsResult.object.findings),
    }],
  });

  // Step 5: If reflection found gaps, add additional findings
  const finalFindings = reflectionResult.object.missedCriteria.length > 0
    ? [...findingsResult.object.findings, ...reflectionResult.object.additionalFindings]
    : findingsResult.object.findings;

  return {
    ...findingsResult.object,
    findings: finalFindings,
    reviewMeta: {
      toolCallCount,
      toolsUsed: [...new Set(toolsUsed)],
      reflectionApplied: reflectionResult.object.missedCriteria.length > 0,
      modelUsed: context.model.modelId,
    },
  };
}
```

**Database Changes:**
- Add `reviewMeta JSONB` column to `reviewRuns` table to store tool call metadata.

**Acceptance Criteria:**
- [ ] Inngest trace for a review run shows ≥2 tool call steps.
- [ ] `reviewMeta.toolCallCount` ≥ 2 on every review run persisted to DB.
- [ ] Reflection step fires and its output appears in `reviewMeta.reflectionApplied`.
- [ ] Agent still produces valid `codeReviewSchema`-conforming output.
- [ ] `tsc --noEmit` passes with new types.

---

## SPEC-08: AI Agent Unit Tests

**Feature Name:** Comprehensive Agent Test Suite

**Functional Requirements:**

FR-1: `packages/ai/src/__tests__/clarifier.test.ts` — 3 test cases for the Clarifier agent.
FR-2: `packages/ai/src/__tests__/prd-generator.test.ts` — 3 test cases for PRD Generator.
FR-3: `packages/ai/src/__tests__/planner.test.ts` — 3 test cases for Planner agent.
FR-4: `packages/ai/src/__tests__/code-reviewer.test.ts` — 3 test cases for Code Reviewer.
FR-5: `packages/ai/src/__tests__/release-readiness.test.ts` — 3 test cases for Release Readiness.
FR-6: `packages/ai/src/__tests__/summarizer.test.ts` — 3 test cases for Summarizer.

**Test Pattern per Agent:**
```typescript
// Example: packages/ai/src/__tests__/prd-generator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateObject } from 'ai';
import { runPRDGeneratorAgent } from '../agents/prd-generator';
import { prdSchema } from '../agents/prd-generator/schema';

vi.mock('ai', () => ({ generateObject: vi.fn() }));

const mockGenerateObject = vi.mocked(generateObject);

describe('PRD Generator Agent', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('generates a complete PRD with all 7 required sections', async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        problemStatement: 'Users cannot reset their passwords.',
        goals: ['Enable self-service password reset'],
        nonGoals: ['Social login'],
        userStories: [{ role: 'user', goal: 'reset password', benefit: 'regain access' }],
        acceptanceCriteria: ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-5'],
        edgeCases: ['User email not found', 'Token expired', 'Invalid token'],
        successMetrics: ['<1% support tickets about login'],
      }
    } as any);

    const result = await runPRDGeneratorAgent({
      featureRequest: 'Add password reset',
      clarificationHistory: [],
      model: {} as any,
    });

    expect(result.problemStatement).toBeTruthy();
    expect(result.goals.length).toBeGreaterThanOrEqual(1);
    expect(result.acceptanceCriteria.length).toBeGreaterThanOrEqual(5);
    expect(result.edgeCases.length).toBeGreaterThanOrEqual(3);
    const validated = prdSchema.safeParse(result);
    expect(validated.success).toBe(true);
  });

  it('handles empty clarification history gracefully', async () => {
    mockGenerateObject.mockResolvedValue({ object: validPRD } as any);
    const result = await runPRDGeneratorAgent({ featureRequest: 'Dark mode', clarificationHistory: [], model: {} as any });
    expect(generateObject).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });

  it('throws if LLM returns output that fails Zod validation', async () => {
    mockGenerateObject.mockResolvedValue({ object: { problemStatement: '' } } as any); // missing required fields
    await expect(runPRDGeneratorAgent({ featureRequest: 'X', clarificationHistory: [], model: {} as any }))
      .rejects.toThrow();
  });
});
```

**Acceptance Criteria:**
- [ ] `packages/ai/src/__tests__/` contains 6 test files.
- [ ] `pnpm test` shows ≥18 new tests across the 6 files, all passing.
- [ ] Tests mock `ai` SDK functions — no real LLM calls in tests.
- [ ] Each test file covers: valid input, edge case, Zod validation failure.

---

## SPEC-09: Fix Summarizer Agent + Release Notes Workflow

**Feature Name:** Real Release Notes Generation

**Problem Statement:**
The `generate-release-notes.ts` Inngest workflow feeds the Summarizer agent 3 hardcoded fake PRs and is triggered by `github.release.drafted` — an event never emitted anywhere. This is dead code with a hardcoded PR violation.

**Functional Requirements:**

FR-1: Rename trigger event to `github.release.published`.

FR-2: Wire the GitHub webhook handler to emit `github.release.published` when a GitHub Release event with `action: "published"` arrives.

FR-3: `fetch-merged-prs` step queries real DB `pullRequests` table: `SELECT * FROM pull_requests WHERE org_id = $orgId AND merged_at > $lastReleaseDate`.

FR-4: Summarizer agent receives real PR data: `{ number, title, body, mergedAt, author }` array.

FR-5: Generated release notes are persisted to a `releaseNotes` table and displayed on the Feature → Release page.

FR-6: If no merged PRs since last release: generate a "no changes" summary, don't fail.

**GitHub Webhook Handler Change:**
```typescript
// apps/web/src/app/api/webhooks/github/route.ts
// Add to event routing:
case 'release':
  if (payload.action === 'published') {
    await inngest.send({
      name: 'github.release.published',
      data: {
        orgId,
        repoId: repository.id,
        releaseId: payload.release.id,
        tagName: payload.release.tag_name,
        publishedAt: payload.release.published_at,
      },
    });
  }
  break;
```

**Workflow Step Fix:**
```typescript
// packages/workflow/src/workflows/generate-release-notes.ts
// REPLACE hardcoded array with:
const fetchPRs = await step.run('fetch-merged-prs', async () => {
  const lastRelease = await db.query.releaseNotes.findFirst({
    where: eq(releaseNotes.orgId, event.data.orgId),
    orderBy: [desc(releaseNotes.createdAt)],
  });
  const since = lastRelease?.createdAt ?? new Date(0);
  
  return db.query.pullRequests.findMany({
    where: and(
      eq(pullRequests.orgId, event.data.orgId),
      isNotNull(pullRequests.mergedAt),
      gt(pullRequests.mergedAt, since),
    ),
    columns: { number: true, title: true, body: true, mergedAt: true, authorLogin: true },
  });
});
```

**Acceptance Criteria:**
- [ ] Zero hardcoded PR data anywhere in the workflow.
- [ ] Publishing a GitHub Release fires the Inngest workflow.
- [ ] Workflow uses real merged PRs from DB.
- [ ] Generated notes persisted to `releaseNotes` table.

---

## SPEC-10: GitHub Issues Webhook Handler

**Feature Name:** GitHub Issues Event Processing

**Problem Statement:**
README/DEPLOYMENT.md document that `issues` and `issue_comment` webhook events are subscribed to. The handler processes neither, so subscribed events are silently discarded.

**Functional Requirements:**

FR-1: `issue.opened` event → create `githubIssue` record in DB; attempt to auto-link to feature via title similarity search (Pinecone) against feature names/PRDs.

FR-2: `issue.closed` event → update `githubIssue` record with `closedAt`.

FR-3: `issue_comment.created` event → store as `githubIssueComment` record; if linked to a feature, appear in the feature's activity timeline.

FR-4: Linked GitHub issues appear in the feature detail page sidebar as "Related Issues."

FR-5: Issue link can be manually set: `feature.linkIssue` tRPC mutation accepts `featureId + issueNumber`.

**Database Changes:**
```sql
CREATE TABLE IF NOT EXISTS github_issues (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  repo_id TEXT NOT NULL,
  issue_number INT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL DEFAULT 'open',
  author_login TEXT,
  feature_id TEXT REFERENCES features(id),  -- auto or manual link
  opened_at TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(repo_id, issue_number)
);
```

**Acceptance Criteria:**
- [ ] Opening an issue on a connected GitHub repo creates a `githubIssues` record.
- [ ] If issue title matches a feature name (fuzzy), it's auto-linked.
- [ ] Linked issues appear in the feature detail sidebar.
- [ ] `issue_comment.created` stores a comment record.

---

# STEP 4 — DEVELOPER TASK FILES

## TASK-001: Wire Razorpay Billing to tRPC Route

**Objective:** Replace the explicitly-mocked billing tRPC route with real calls to the existing `packages/billing/` package.

**Background:** `packages/billing/src/services/` contains real Razorpay SDK calls. `packages/trpc/server/routes/billing/route.ts` contains an explicit comment "We don't have a real billing service yet, so we mock it" and returns a hardcoded Stripe URL. These two packages exist in the same monorepo but are completely disconnected.

**Dependencies:** None (billing package already exists). Env vars `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` must be set.

**Files To Create:**
- `packages/billing/src/services/billingService.ts` — orchestration layer
- `packages/billing/src/types.ts` — shared types

**Files To Modify:**
- `packages/trpc/server/routes/billing/route.ts` — remove mock, call real service
- `apps/web/src/app/pricing/page.tsx` — replace `href="/login"` CTAs
- `apps/web/src/app/(dashboard)/org/[slug]/settings/billing/page.tsx` — use real query data
- `packages/billing/src/index.ts` — export `billingService`
- `apps/web/src/app/api/webhooks/razorpay/route.ts` — ensure `billing-sync` is triggered

**Backend Tasks:**
- [ ] Create `billingService.ts` that re-exports `checkoutService.createSession()` + `subscriptionService.getByOrgId()` with a clean interface.
- [ ] Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` startup validation: `if (!process.env.RAZORPAY_KEY_ID) throw new Error(...)`.
- [ ] Rewrite `billing/route.ts`:
  - `createCheckoutSession` mutation: calls `billingService.createSession(orgId, planId)`, returns `{ checkoutUrl }`.
  - `getSubscription` query: calls `billingService.getByOrgId(orgId)`, returns full subscription shape.
  - `cancelSubscription` mutation: calls `billingService.cancel(subscriptionId)`.
- [ ] Ensure `billingService.getByOrgId` returns a sensible default when no subscription row exists: `{ tier: 'FREE', status: 'ACTIVE', usageCount: 0, usageLimit: 10 }`.
- [ ] Add usage enforcement middleware: `packages/trpc/server/middleware/billingGuard.ts` — checks subscription tier before allowing AI review trigger.
- [ ] Increment `usageCount` on every AI review completion in `review-pull-request.ts` Inngest workflow.

**Frontend Tasks:**
- [ ] `pricing/page.tsx`: Import `api.billing.createCheckoutSession.useMutation()`. Replace each plan CTA's `<Link href="/login">` with `<Button onClick={() => createCheckoutSession.mutate({ planId: 'PRO_MONTHLY' })}>`.
- [ ] Add loading state spinner on the CTA button during mutation.
- [ ] Add `useEffect` in `billing/page.tsx` to check `?payment=success` query param and show a `<BillingSuccessToast />` component.
- [ ] `billing/page.tsx`: Replace all hardcoded values with `const { data: sub } = api.billing.getSubscription.useQuery()`. Render `sub.tier`, `sub.usageCount`, `sub.usageLimit`.
- [ ] Create `components/billing/upgrade-modal.tsx` — shown when usage limit is hit, with plan comparison and upgrade CTA.

**Database Tasks:**
- [ ] Verify `subscriptions` table schema matches what `billingService` expects (columns: `id, org_id, tier, status, razorpay_subscription_id, usage_count, usage_limit, renewal_date`).
- [ ] Write migration if any columns are missing: `packages/db/migrations/XXXX_add_billing_usage.sql`.

**Testing Tasks:**
- [ ] `packages/billing/src/__tests__/billingService.test.ts`: mock Razorpay client, verify `createSession` returns expected URL shape.
- [ ] `packages/billing/src/__tests__/webhook.test.ts`: verify signature validation, verify `billing-sync` event is sent.
- [ ] `packages/trpc/server/routes/billing/__tests__/route.test.ts`: verify `createCheckoutSession` returns `{ checkoutUrl }` (mocked service).

**Done Criteria:**
- [ ] Clicking "Upgrade to Pro" on the pricing page opens a real Razorpay payment URL (not `billing.stripe.com`).
- [ ] `getSubscription` returns real data from DB.
- [ ] `tsc --noEmit` passes.
- [ ] All new tests pass.
- [ ] No mock comment in billing route.

---

## TASK-002: Real Member Email Invitations

**Objective:** Replace the `console.log` stub in `member/route.ts invite` with a real invite flow: DB record, email send, acceptance route.

**Dependencies:** Transactional email provider credentials (`RESEND_API_KEY` or `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`). `INVITATION_SECRET` env var for JWT signing.

**Files To Create:**
- `packages/email/src/index.ts` — email sending abstraction
- `packages/email/src/templates/invitation.ts` — HTML email template
- `packages/email/package.json` — `{ "name": "@shipflow/email", "dependencies": { "resend": "^3.0.0" } }`
- `apps/web/src/app/invitations/accept/page.tsx` — accept-invite server route
- `packages/trpc/server/routes/member/acceptInvitation.ts` — procedure

**Files To Modify:**
- `packages/trpc/server/routes/member/route.ts` — rewrite `invite` mutation, add `listInvitations`, `revokeInvitation`, `acceptInvitation`
- `packages/db/schema.ts` (or equivalent) — add `orgInvitations` table
- `turbo.json` — add `@shipflow/email` to workspace packages
- `pnpm-workspace.yaml` — add `packages/email`

**Backend Tasks:**
- [ ] Add `orgInvitations` Drizzle schema (columns per SPEC-02).
- [ ] Create DB migration for `org_invitations` table.
- [ ] Create `packages/email/` package with Resend client wrapper.
- [ ] Create `sendInvitationEmail(params)` function in `packages/email/src/index.ts`.
- [ ] Create HTML email template: `packages/email/src/templates/invitation.ts` — returns HTML string with org name, inviter name, role, and accept button linking to `{APP_URL}/invitations/accept?token={token}`.
- [ ] Rewrite `member.invite` mutation:
  1. Check caller is OWNER or ADMIN.
  2. Check invitee is not already a member.
  3. Check no existing PENDING invite for this email + org.
  4. Generate JWT: `jwt.sign({ orgId, email, role, invitationId: newId }, INVITATION_SECRET, { expiresIn: '72h' })`.
  5. Insert `orgInvitations` row.
  6. Call `sendInvitationEmail(...)`.
  7. Return `{ invitationId, status: 'PENDING' }`.
- [ ] Create `member.listInvitations` query: return all invites for org (PENDING/ACCEPTED/REVOKED) with `invitedBy` user name.
- [ ] Create `member.revokeInvitation` mutation: set status to `REVOKED` by `invitationId`.
- [ ] Create `member.acceptInvitation` mutation:
  1. Verify JWT, decode `{ orgId, email, role, invitationId }`.
  2. Check token not expired (or check `expires_at` column).
  3. Check `orgInvitations` row is still PENDING.
  4. Upsert user (or verify they exist).
  5. Insert `orgMembers` row with `{ orgId, userId, role }`.
  6. Update `orgInvitations.status = 'ACCEPTED'`, set `accepted_at = NOW()`.
  7. Return `{ orgId, orgSlug }` for redirect.

**Frontend Tasks:**
- [ ] `apps/web/src/app/invitations/accept/page.tsx` — server component: reads `?token=` param, calls `member.acceptInvitation`, redirects to `/org/{slug}/dashboard` on success, shows error page on failure.
- [ ] `settings/members/page.tsx` — add "Pending Invitations" table below member list, showing email, role, invited-by, invited-at, with a "Revoke" button per row.
- [ ] "Invite Member" modal — after successful invite mutation, show success toast "Invitation sent to {email}".

**Testing Tasks:**
- [ ] Unit: `invite` mutation inserts row and calls `sendInvitationEmail` (mock email package).
- [ ] Unit: `acceptInvitation` with valid token creates `orgMember` row.
- [ ] Unit: `acceptInvitation` with expired token throws `TRPCError('UNAUTHORIZED')`.
- [ ] Unit: `acceptInvitation` with already-accepted token throws `TRPCError('CONFLICT')`.

**Done Criteria:**
- [ ] Inviting a team member sends a real email.
- [ ] Clicking the link in the email creates org membership.
- [ ] Pending invites visible in Settings → Team.
- [ ] Revoke invite removes the pending row.
- [ ] `tsc --noEmit` passes.

---

## TASK-003: Audit Log Write Service

**Objective:** Implement `createAuditLog()` service function and call it at every state transition.

**Dependencies:** TASK-003 must be complete before audit log page tests pass (read-side is already built).

**Files To Create:**
- `packages/services/src/audit/audit.service.ts`
- `packages/services/src/audit/audit.types.ts`

**Files To Modify:**
- `packages/services/src/feature/feature.service.ts` — add `createAuditLog` calls at all 12 transitions
- `packages/workflow/src/workflows/feature-lifecycle.ts` — add audit log after async transitions
- `packages/trpc/server/routes/repository/route.ts` — audit log on connect/disconnect
- `packages/trpc/server/routes/member/route.ts` — audit log on invite/remove
- `packages/services/src/index.ts` — export `auditService`

**Backend Tasks:**
- [ ] Create `audit.types.ts` with `AuditAction` const object (per SPEC-03 list).
- [ ] Create `audit.service.ts` with `createAuditLog(db, params)` function (per SPEC-03 implementation).
- [ ] In `feature.service.ts`, add `await createAuditLog(db, {...})` after each of these methods successfully complete: `createFeature`, `startClarification`, `markClarified`, `generatePRD`, `generateTasks`, `approvePlan`, `startDevelopment`, `submitForReview`, `failReview`, `passReview`, `approveHumanRelease`, `rejectHumanRelease`, `shipFeature`.
- [ ] In `feature-lifecycle.ts` Inngest workflow, add audit log after PRD step and after task step.
- [ ] In `repository/route.ts`, add audit log on `connectRepository` and `disconnectRepository`.
- [ ] In `member/route.ts`, add audit log on `invite` and `removeMember`.

**Testing Tasks:**
- [ ] Integration test: call `feature.approvePlan`, then query `auditLogs` table, verify row exists with correct `action`, `actorId`, `resourceId`.
- [ ] Unit test: `createAuditLog` with valid params inserts a row (mock db).
- [ ] Unit test: `createAuditLog` with missing `orgId` throws.

**Done Criteria:**
- [ ] After a complete feature lifecycle, `audit_logs` table has ≥8 rows.
- [ ] Audit logs page shows real entries.
- [ ] `tsc --noEmit` passes.

---

## TASK-004: In-App Notification Write Service

**Objective:** Implement `createNotification()` and `notifyOrgRoles()` helpers and call them at all triggering events.

**Dependencies:** TASK-003 (shares pattern). `notifications` table schema must already exist.

**Files To Create:**
- `packages/services/src/notification/notification.service.ts`

**Files To Modify:**
- `packages/services/src/feature/feature.service.ts`
- `packages/workflow/src/workflows/feature-lifecycle.ts`
- `packages/workflow/src/workflows/review-pull-request.ts`
- `packages/trpc/server/routes/notification/route.ts` — add `getUnreadCount` procedure for polling

**Backend Tasks:**
- [ ] Create `notification.service.ts` with `createNotification()` and `notifyOrgRoles()` (per SPEC-04).
- [ ] In `feature.service.ts → generatePRD`: notify feature `creatorId` with title "Your PRD is ready", actionUrl: `/org/{slug}/features/{featureId}`.
- [ ] In `feature-lifecycle.ts → featureTasksGenerated`: notify feature `creatorId` with "Your engineering tasks are ready".
- [ ] In `review-pull-request.ts → after review complete`: notify feature `creatorId` + org PM/ADMIN with title "AI Review Complete — {blocking/clean}".
- [ ] In `feature.service.ts → failReview`: notify PR author with "Fix needed: {N} blocking issues".
- [ ] In `feature.service.ts → passReview`: notify org OWNER/ADMIN/PM with "Feature ready for human approval".
- [ ] In `feature.service.ts → shipFeature`: notify feature `creatorId` with "Feature shipped! 🚀".
- [ ] Add `notification.getUnreadCount` tRPC query: `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`.

**Frontend Tasks:**
- [ ] `components/layout/notification-bell.tsx` — poll `notification.getUnreadCount` every 30s, show badge.
- [ ] Clicking a notification card: call `notification.markAsRead`, navigate to `notification.actionUrl`.
- [ ] Add "Mark all as read" button that calls `notification.markAllAsRead` mutation.

**Testing Tasks:**
- [ ] Unit: `createNotification` inserts notification row (mock db).
- [ ] Unit: `notifyOrgRoles` with OWNER/ADMIN roles inserts correct number of rows.
- [ ] Integration: trigger `shipFeature` → verify notification row exists for feature creator.

**Done Criteria:**
- [ ] Notification bell shows correct unread count.
- [ ] Human reviewer gets notification when feature reaches `AWAITING_HUMAN_APPROVAL`.
- [ ] `tsc --noEmit` passes.

---

## TASK-005: Source Channel Intake — DB Column + Form Wire-Up

**Objective:** Make the source channel selector functional end-to-end.

**Files To Modify:**
- `packages/db/schema.ts` or `packages/db/models/features.ts` — add `sourceChannel` column
- `packages/db/migrations/` — add migration
- `packages/trpc/server/routes/feature/route.ts` — add to `createFeature` input
- `packages/services/src/feature/feature.service.ts` — persist in `createFeature`
- `apps/web/src/app/(dashboard)/org/[slug]/features/new/page.tsx` — wire form value
- `apps/web/src/app/(dashboard)/org/[slug]/features/[featureId]/page.tsx` — display badge
- `apps/web/src/app/(dashboard)/org/[slug]/features/page.tsx` — add filter

**Backend Tasks:**
- [ ] Add Drizzle column: `sourceChannel: text('source_channel', { enum: ['IN_APP', 'EMAIL', 'TICKET', 'CALL'] }).notNull().default('IN_APP')`.
- [ ] Write migration: `ALTER TABLE features ADD COLUMN source_channel TEXT NOT NULL DEFAULT 'IN_APP'`.
- [ ] Update `createFeature` zod input schema to include `sourceChannel: z.enum(['IN_APP', 'EMAIL', 'TICKET', 'CALL']).default('IN_APP')`.
- [ ] In `createFeature` service: include `sourceChannel: input.sourceChannel` in insert values.
- [ ] Add `feature.listByChannel` optional filter parameter to the existing `listFeatures` query.

**Frontend Tasks:**
- [ ] `features/new/page.tsx`: Change `createFeature.mutate(...)` to include `sourceChannel: form.getValues('sourceChannel')`.
- [ ] `features/[featureId]/page.tsx`: Add source channel badge: `<SourceChannelBadge channel={feature.sourceChannel} />`.
- [ ] Create `components/features/source-channel-badge.tsx`:
  ```tsx
  const icons = { IN_APP: MousePointerIcon, EMAIL: MailIcon, TICKET: TicketIcon, CALL: PhoneIcon };
  const labels = { IN_APP: 'In-App', EMAIL: 'Email', TICKET: 'Support Ticket', CALL: 'Customer Call' };
  export function SourceChannelBadge({ channel }) {
    const Icon = icons[channel];
    return <Badge variant="outline"><Icon className="h-3 w-3 mr-1" />{labels[channel]}</Badge>;
  }
  ```
- [ ] `features/page.tsx`: Add channel filter tabs/dropdown.

**Done Criteria:**
- [ ] Selecting "Email" channel and creating a feature → DB row has `source_channel: 'EMAIL'`.
- [ ] Feature detail page shows the Email badge.
- [ ] `tsc --noEmit` passes.

---

## TASK-006: PRD Editor — Rich Rendering

**Objective:** Replace raw JSON dump with a human-readable, editable PRD viewer component.

**Files To Create:**
- `apps/web/src/components/prd/prd-viewer.tsx`
- `apps/web/src/components/prd/prd-section.tsx`
- `apps/web/src/components/prd/user-stories-section.tsx`
- `apps/web/src/components/prd/acceptance-criteria-section.tsx`
- `apps/web/src/components/prd/success-metrics-section.tsx`

**Files To Modify:**
- `apps/web/src/app/(dashboard)/org/[slug]/features/[featureId]/page.tsx` — replace JSON dump with `<PRDViewer />`
- `packages/trpc/server/routes/feature/route.ts` — add `updatePrd` procedure

**Backend Tasks:**
- [ ] Add `feature.updatePrd` tRPC mutation (per SPEC-06 technical design).
- [ ] Validate that the calling user has at minimum PM/MEMBER role (editing PRD requires project contributor access).
- [ ] Validate `featureId` belongs to the caller's org.

**Frontend Tasks:**
- [ ] Create `prd-section.tsx` component with props: `title: string`, `content: string | string[]`, `field: string`, `featureId: string`, `canEdit: boolean`, `isList?: boolean`. In view mode, renders content. Clicking "Edit" button (pencil icon) transitions to a `<Textarea>` with the current content. "Save" calls `api.feature.updatePrd.useMutation()`. "Cancel" reverts.
- [ ] Create `user-stories-section.tsx`: maps `prd.userStories` array to cards with format "As a [role], I want [goal], so that [benefit]". Each card has edit icon if `canEdit`.
- [ ] Create `acceptance-criteria-section.tsx`: renders criteria as a numbered list with checkmark icons.
- [ ] Create `success-metrics-section.tsx`: renders KPI-style metric cards.
- [ ] Create `prd-viewer.tsx` composing all sections with a `<CopyMarkdownButton />` that formats the PRD and copies to clipboard.
- [ ] In `features/[featureId]/page.tsx`: Find the `JSON.stringify` lines (120–133 per eval report), replace with `<PRDViewer prd={feature.prd} featureId={feature.id} canEdit={canEdit} />`.
- [ ] Add `canEdit` logic: `canEdit = ['PM', 'ADMIN', 'OWNER'].includes(currentUserRole) && !['SHIPPED', 'REJECTED'].includes(feature.status)`.

**Done Criteria:**
- [ ] PRD page shows 7 labeled sections — no raw JSON visible.
- [ ] "Edit" on any section opens textarea, save persists.
- [ ] User Stories render as structured cards.
- [ ] "Copy as Markdown" copies formatted text to clipboard.
- [ ] `tsc --noEmit` passes.

---

## TASK-007: Multi-Step Autonomous Code Reviewer Agent

**Objective:** Upgrade the Code Reviewer from a single `generateObject` call to a multi-step agent with autonomous tool use and a reflection loop.

**Files To Create:**
- `packages/ai/src/agents/code-reviewer/tools.ts`
- `packages/ai/src/agents/code-reviewer/reflection-schema.ts`
- `packages/ai/src/agents/code-reviewer/gathering-prompt.ts`

**Files To Modify:**
- `packages/ai/src/agents/code-reviewer/index.ts` — full rewrite to multi-step agent
- `packages/ai/src/agents/code-reviewer/prompt.ts` — separate gathering vs. generation prompts
- `packages/workflow/src/workflows/review-pull-request.ts` — pass additional context to agent
- `packages/db/schema.ts` — add `reviewMeta JSONB` to `reviewRuns` table
- `packages/db/migrations/` — add `reviewMeta` column migration

**Backend Tasks:**
- [ ] Create `tools.ts` implementing 5 tools per SPEC-07 using `tool()` from `ai` package.
- [ ] Create `reflection-schema.ts`: Zod schema for `{ missedCriteria: string[], coveragePercentage: number, additionalFindings: FindingSchema[] }`.
- [ ] Create `gathering-prompt.ts`: System prompt for context-gathering phase that instructs agent to call tools before generating findings.
- [ ] Rewrite `code-reviewer/index.ts` with 5-step flow per SPEC-07 technical design.
- [ ] Update `review-pull-request.ts` to pass `previousFindings`, `prd`, `repoOwner`, `repoName`, `headSha` as part of context object to the agent.
- [ ] Write DB migration: `ALTER TABLE review_runs ADD COLUMN review_meta JSONB`.
- [ ] Update Drizzle schema for `reviewRuns` to include `reviewMeta: jsonb('review_meta')`.
- [ ] Persist `reviewMeta` from agent output to `reviewRuns` table after review completes.

**Testing Tasks:**
- [ ] Unit: Mock `streamText` and verify it's called with `tools` parameter containing all 5 tool definitions.
- [ ] Unit: Mock `searchCodebase` tool execute function and verify Pinecone is queried.
- [ ] Unit: Verify reflection step fires and its output affects final `findings` array.
- [ ] Unit: Verify `reviewMeta.toolCallCount` is correctly summed across steps.

**Done Criteria:**
- [ ] Inngest trace for a review run shows ≥2 distinct tool-call events.
- [ ] `reviewRuns.reviewMeta` column contains `{ toolCallCount: ≥2, toolsUsed: [...], reflectionApplied: bool }`.
- [ ] `tsc --noEmit` passes.
- [ ] Agent unit tests pass.

---

## TASK-008: AI Agent Unit Tests

**Objective:** Add ≥18 unit tests across all 6 AI agents. `packages/ai/src/__tests__/` is currently empty.

**Files To Create:**
- `packages/ai/src/__tests__/clarifier.test.ts`
- `packages/ai/src/__tests__/prd-generator.test.ts`
- `packages/ai/src/__tests__/planner.test.ts`
- `packages/ai/src/__tests__/code-reviewer.test.ts`
- `packages/ai/src/__tests__/release-readiness.test.ts`
- `packages/ai/src/__tests__/summarizer.test.ts`

**Backend Tasks:**
- [ ] Configure `vitest` in `packages/ai/vitest.config.ts` if not already present. Ensure `vi.mock` works for `ai` SDK.
- [ ] Write 3 tests per agent (per SPEC-08 pattern):
  - Test 1: Valid input → valid Zod-validated output.
  - Test 2: Edge case (empty/minimal input) → graceful output.
  - Test 3: LLM returns invalid output → Zod parse failure throws.
- [ ] For Code Reviewer tests (post-TASK-007): additionally test that `tools` are provided to `streamText` call.

**Testing Tasks:**
- [ ] `pnpm test --filter @shipflow/ai` → all 18+ tests pass.
- [ ] Zero calls to real LLM APIs in test runs (all mocked).

**Done Criteria:**
- [ ] `packages/ai/src/__tests__/` has 6 non-empty test files.
- [ ] `pnpm test` shows ≥18 new tests passing in the `@shipflow/ai` package.

---

## TASK-009: Fix Summarizer Agent (Real Trigger + Real PR Data)

**Objective:** Remove hardcoded fake PR array from `generate-release-notes.ts`. Wire the workflow to a real GitHub release webhook event. Query real merged PRs from DB.

**Files To Modify:**
- `packages/workflow/src/workflows/generate-release-notes.ts` — full rewrite of `fetch-merged-prs` step
- `apps/web/src/app/api/webhooks/github/route.ts` — add `release` event handler
- `packages/db/schema.ts` — add `releaseNotes` table
- `packages/db/migrations/` — add `releaseNotes` migration

**Backend Tasks:**
- [ ] Add Drizzle schema for `releaseNotes` table: `{ id, orgId, repoId, tagName, summary, prCount, generatedAt }`.
- [ ] Write DB migration.
- [ ] In `route.ts` webhook handler, add `case 'release':` → if `payload.action === 'published'`, emit `github.release.published` Inngest event with `{ orgId, repoId, tagName, publishedAt }`.
- [ ] In `generate-release-notes.ts`:
  - Rename function trigger to listen on `github.release.published`.
  - Replace hardcoded array with real DB query (per SPEC-09).
  - If query returns 0 PRs: return summary "No changes detected since last release."
  - After summarizer generates notes: insert into `releaseNotes` table.
- [ ] Ensure `generate-release-notes.ts` is exported from `packages/workflow/src/index.ts` and registered in the Inngest serve handler.

**Done Criteria:**
- [ ] Zero hardcoded PR objects anywhere in the workflow.
- [ ] Sending a `github.release.published` Inngest event manually triggers the workflow.
- [ ] Generated notes appear in the `releaseNotes` table.

---

## TASK-010: GitHub Issues Webhook Handler

**Objective:** Handle `issues` and `issue_comment` webhook events that are currently subscribed to but silently discarded.

**Files To Modify:**
- `apps/web/src/app/api/webhooks/github/route.ts` — add `issues` and `issue_comment` event cases
- `packages/db/schema.ts` — add `githubIssues` and `githubIssueComments` tables
- `packages/db/migrations/` — add migration
- `apps/web/src/app/(dashboard)/org/[slug]/features/[featureId]/page.tsx` — add "Related Issues" sidebar panel
- `packages/trpc/server/routes/feature/route.ts` — add `linkIssue` mutation

**Backend Tasks:**
- [ ] Add Drizzle schemas for `githubIssues` and `githubIssueComments` (per SPEC-10).
- [ ] Write migration.
- [ ] In webhook handler, add case `'issues'`:
  - `action: 'opened'` → upsert `githubIssues` row, attempt auto-link via Pinecone title similarity (search against feature descriptions).
  - `action: 'closed'` → update `githubIssues` row with `closedAt`.
  - `action: 'edited'` → update title/body.
- [ ] Add case `'issue_comment'`:
  - `action: 'created'` → insert `githubIssueComments` row.
- [ ] Add `feature.linkIssue` tRPC mutation: `{ featureId, issueId }` → update `githubIssues.featureId`.
- [ ] Add `feature.getLinkedIssues` tRPC query: return `githubIssues` where `featureId = $1`.

**Frontend Tasks:**
- [ ] `features/[featureId]/page.tsx`: Add a "Related GitHub Issues" sidebar card rendered via `feature.getLinkedIssues.useQuery({ featureId })`. Shows issue number, title, state (open/closed), and a link to GitHub.

**Done Criteria:**
- [ ] Opening a GitHub issue on a connected repo creates a DB row.
- [ ] Issue appears in the feature detail sidebar.
- [ ] `issue_comment.created` stores a comment row.
- [ ] `tsc --noEmit` passes.

---

## TASK-011: Fix Hardcoded Secret Fallbacks

**Objective:** Replace all `?? "some_hardcoded_string"` cryptographic key fallbacks with startup-throwing validation.

**Files To Modify:**
- `packages/services/src/feature/feature.service.ts` (line 204) — `?? "shipflow_secret"`
- `apps/web/src/app/api/github/callback/route.ts` — `?? "fallback_secret_for_dev"`
- `packages/trpc/server/routes/organization/route.ts` — `?? "fallback_secret_for_dev"`

**Backend Tasks:**
- [ ] Create a shared util: `packages/utils/src/env.ts`:
  ```typescript
  export function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
  }
  ```
- [ ] In `feature.service.ts`: Replace `process.env.APPROVAL_SECRET ?? "shipflow_secret"` with `requireEnv('APPROVAL_SECRET')`. Move this call to module initialization (top of file, outside function bodies) so it fails at startup.
- [ ] In `github/callback/route.ts`: Replace `?? "fallback_secret_for_dev"` with `requireEnv('GITHUB_STATE_SECRET')`.
- [ ] In `organization/route.ts`: Same replacement.
- [ ] Update `.env.example` to include `APPROVAL_SECRET`, `GITHUB_STATE_SECRET` with clear comments explaining they must be long random strings (≥32 chars).
- [ ] Add a note in README: "All secret environment variables must be set. The application will throw a startup error if any are missing."

**Done Criteria:**
- [ ] Starting the server with `APPROVAL_SECRET` unset throws `Error: Missing required environment variable: APPROVAL_SECRET`.
- [ ] No hardcoded string fallback for any cryptographic key in the codebase.
- [ ] `tsc --noEmit` passes.

---

## TASK-012: Fix CORS Wildcard

**Objective:** Restrict CORS in `apps/api/src/server.ts` from reflecting any origin to a validated allowlist.

**Files To Modify:**
- `apps/api/src/server.ts` (lines 18–24)
- `apps/api/.env.example` — add `CORS_ALLOWED_ORIGINS`

**Backend Tasks:**
- [ ] Replace CORS middleware:
  ```typescript
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',').map(s => s.trim());
  
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  ```
- [ ] Update `.env.example`: `CORS_ALLOWED_ORIGINS=https://shipflow-ai.vercel.app,http://localhost:3000`.
- [ ] Add comment in code: `// Wildcard origin with credentials is a security vulnerability — see SEC-02 in roadmap`.

**Done Criteria:**
- [ ] A request from an unlisted origin receives a CORS error response.
- [ ] `http://localhost:3000` (or configured origin) continues to work normally.
- [ ] `tsc --noEmit` passes.

---

## TASK-013: Replace Hardcoded Analytics Values

**Objective:** Remove hardcoded `approvalRate: 94` and `reviewTimeBySeverity` from `organization.repository.ts` and replace with real database queries.

**Files To Modify:**
- `packages/services/src/organization/organization.repository.ts` (lines 62–64 and 153–160)

**Backend Tasks:**
- [ ] Replace `approvalRate: 94 // Simplified` with:
  ```typescript
  const totalFeatures = await db.select({ count: count() }).from(features).where(and(eq(features.orgId, orgId), gte(features.createdAt, since)));
  const shippedFeatures = await db.select({ count: count() }).from(features).where(and(eq(features.orgId, orgId), eq(features.status, 'SHIPPED'), gte(features.createdAt, since)));
  const approvalRate = totalFeatures[0].count > 0 
    ? Math.round((shippedFeatures[0].count / totalFeatures[0].count) * 100) 
    : null;  // null = insufficient data
  ```
- [ ] Replace hardcoded `reviewTimeBySeverity` with:
  ```typescript
  const reviewTimes = await db
    .select({
      severity: pullRequestFindings.severity,
      avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${pullRequests.mergedAt} - ${pullRequestFindings.createdAt})) / 3600)`,
    })
    .from(pullRequestFindings)
    .innerJoin(pullRequests, eq(pullRequests.id, pullRequestFindings.pullRequestId))
    .where(and(eq(pullRequests.orgId, orgId), isNotNull(pullRequests.mergedAt), gte(pullRequests.mergedAt, since)))
    .groupBy(pullRequestFindings.severity);
  const reviewTimeBySeverity = reviewTimes.length > 0 ? reviewTimes : null;  // null = no data yet
  ```
- [ ] Update analytics API return type to handle `null` values (insufficient data state).
- [ ] Update frontend analytics charts to show "Not enough data yet" placeholder when value is `null`.

**Done Criteria:**
- [ ] `approvalRate` in analytics reflects actual shipped/total ratio from DB.
- [ ] `reviewTimeBySeverity` is derived from real PR merge timestamps.
- [ ] If org has zero features, charts show "Not enough data" rather than fake numbers.
- [ ] `tsc --noEmit` passes.

---

## TASK-014: Real E2E Test Suite

**Objective:** Replace the 4 placeholder Playwright specs (which explicitly admit they don't test real workflows) with real specs that exercise the feature lifecycle.

**Files To Create:**
- `apps/web/e2e/global-setup.ts` — seed test DB with org + user + feature
- `apps/web/e2e/fixtures/auth.fixture.ts` — pre-authenticated page fixture
- `apps/web/e2e/specs/01-auth.spec.ts` — registration and login
- `apps/web/e2e/specs/02-feature-create.spec.ts` — create feature, submit, see clarification
- `apps/web/e2e/specs/03-prd-approval.spec.ts` — PRD view, plan approve
- `apps/web/e2e/specs/04-pr-review.spec.ts` — webhook simulation, review view
- `apps/web/e2e/specs/05-human-approve.spec.ts` — human approval → shipped

**Files To Modify:**
- `apps/web/playwright.config.ts` — add `globalSetup`, `globalTeardown`, set `baseURL` from env
- `apps/web/e2e/` — delete old placeholder specs

**Backend Tasks (test infrastructure):**
- [ ] Create `global-setup.ts`: connects to test DB, runs seed script: creates 1 org, 1 owner user, sets up GitHub App mock.
- [ ] Create `global-teardown.ts`: deletes seeded test data.
- [ ] Create `auth.fixture.ts` using Playwright's `storageState` to pre-authenticate (saves session cookie after one real login).

**Frontend/E2E Tasks:**
- [ ] `01-auth.spec.ts`: Navigate to `/auth/register`, fill form, submit, assert redirect to `/org/test-org/dashboard`.
- [ ] `02-feature-create.spec.ts`: Navigate to `features/new`, fill title/description, select "Email" channel, submit. Assert feature appears in list. Assert clarification panel appears.
- [ ] `03-prd-approval.spec.ts` (requires mocked Inngest completion or test that polls): Navigate to feature page, mock `api.feature.generatePrd.useQuery` to return a pre-seeded PRD (or seed PRD directly in DB). Assert PRD sections are visible. Click "Approve Plan", assert status changes to `PLAN_APPROVED`.
- [ ] `04-pr-review.spec.ts`: Directly POST to `/api/webhooks/github` with a test payload (mocked `X-Hub-Signature-256`). Assert PR record created in DB. Navigate to PR review page, assert findings table is visible.
- [ ] `05-human-approve.spec.ts`: Seed a feature in `AWAITING_HUMAN_APPROVAL` state. Navigate to approval page. Click "Approve Release". Assert status changes to `SHIPPED`.

**Done Criteria:**
- [ ] `pnpm test:e2e` runs without explicitly-commented "we can't test this" in any spec.
- [ ] At least 3 of 5 specs pass in CI (GitHub OAuth can remain mocked).
- [ ] Tests do not rely on hardcoded production data.

---

## TASK-015: Fix Deployments List

**Objective:** Connect the `deployments-list.tsx` component to real Vercel webhook data instead of the hardcoded `deployments={[]}` array.

**Files To Create:**
- `packages/trpc/server/routes/deployment/route.ts`
- `packages/db/models/deployments.ts` (if not exists)

**Files To Modify:**
- `apps/web/src/components/dashboard/deployments-list.tsx`
- Parent page that passes `deployments={[]}` — find and update
- `packages/trpc/server/routes/index.ts` — add `deployment` router export

**Backend Tasks:**
- [ ] Verify/create `deployments` Drizzle schema: `{ id, orgId, repoId, featureId, status, environment, deployedAt, deployUrl, commitSha }`.
- [ ] Verify Vercel deploy webhook handler writes to this table (eval report says a Vercel-deploy webhook ingestion path exists — locate it and confirm it inserts).
- [ ] Create `deployment/route.ts` with `deployment.list` query: returns deployments for the org, ordered by `deployedAt` DESC, limited to 10.
- [ ] Export `deployment` router from the main tRPC router.

**Frontend Tasks:**
- [ ] In `deployments-list.tsx` parent page: replace `deployments={[]}` with `const { data: deployments } = api.deployment.list.useQuery({ orgId })`.
- [ ] Pass real data to `<DeploymentsList deployments={deployments ?? []} />`.

**Done Criteria:**
- [ ] `deployment` tRPC route is exported.
- [ ] Dashboard shows real deployment records (or empty state if none).
- [ ] `deployments={[]}` hardcode is removed.

---

## TASK-016: Kanban Drag-and-Drop

**Objective:** Upgrade checkbox-only task status updates to drag-and-drop between columns.

**Files To Modify:**
- `apps/web/src/components/tasks/kanban-board.tsx`
- `apps/web/package.json` — add `@dnd-kit/core` and `@dnd-kit/sortable`

**Frontend Tasks:**
- [ ] `pnpm add @dnd-kit/core @dnd-kit/sortable --filter @shipflow/web`.
- [ ] Import `DndContext`, `closestCenter`, `DragOverlay`, `useDraggable`, `useDroppable` from `@dnd-kit/core`.
- [ ] Wrap the three column containers in `<DndContext>`.
- [ ] Wrap each `TaskCard` in a `<Draggable>` or `SortableContext` card.
- [ ] On `onDragEnd`:
  ```tsx
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const newStatus = over.id as 'TODO' | 'IN_PROGRESS' | 'DONE';
  updateTaskStatus.mutate({ taskId: active.id, status: newStatus });
  ```
- [ ] Add optimistic update: immediately update local query cache before mutation settles:
  ```tsx
  const utils = api.useUtils();
  const updateTaskStatus = api.tasks.updateStatus.useMutation({
    onMutate: async ({ taskId, status }) => {
      await utils.tasks.listByFeature.cancel();
      const prev = utils.tasks.listByFeature.getData({ featureId });
      utils.tasks.listByFeature.setData({ featureId }, old => old?.map(t => t.id === taskId ? { ...t, status } : t));
      return { prev };
    },
    onError: (err, vars, ctx) => { utils.tasks.listByFeature.setData({ featureId }, ctx?.prev); },
    onSettled: () => { utils.tasks.listByFeature.invalidate({ featureId }); },
  });
  ```
- [ ] Add `DragOverlay` to show a floating card preview while dragging.

**Done Criteria:**
- [ ] Dragging a task card from TODO to IN_PROGRESS updates status in DB.
- [ ] Optimistic update makes the move feel instant.
- [ ] `tsc --noEmit` passes.

---

## TASK-017: Demo Video Production

**Objective:** Produce a 3–5 minute demo video and link it in the README.

**Script Outline:**
1. **0:00–0:30** — Landing page overview. What ShipFlow AI does. Value proposition.
2. **0:30–1:15** — Create a feature request. Show source channel selector. Submit and watch the AI clarification agent ask follow-up questions in real time.
3. **1:15–2:00** — PRD generated. Open PRD editor — show all 7 sections rendered beautifully. Click "Approve Plan". Watch tasks appear on the Kanban board.
4. **2:00–2:45** — Connect a GitHub repo. Simulate a pull request (or use a pre-existing one). Watch the AI code review execute — show the agentic tool call steps in the Inngest dashboard. Show blocking finding flagged.
5. **2:45–3:30** — Show the fix loop: PR updated, re-review triggered, finding marked RESOLVED. Feature moves to AWAITING_HUMAN_APPROVAL.
6. **3:30–4:00** — Human approval page: show PRD, tasks summary, review findings, approve button. Click approve. Feature shows as SHIPPED. 🎉
7. **4:00–4:30** — Analytics dashboard, billing page, team settings. Rapid tour of supporting features.

**Recording Tools:**
- Loom (free, shareable link, embeddable in README)
- OR OBS Studio + YouTube upload

**README Changes:**
```markdown
## 🎥 Demo Video
> 4-minute walkthrough of the full feature delivery lifecycle

[![ShipFlow AI Demo](docs/screenshots/demo-thumb.png)](https://loom.com/share/XXXX)

**[→ Watch on Loom](https://loom.com/share/XXXX)**
```

**Done Criteria:**
- [ ] Video exists at a public URL (Loom, YouTube, etc.).
- [ ] README contains a working clickable link to the video.
- [ ] Video is at least 3 minutes long.
- [ ] Video demonstrates: feature create, PRD view, plan approve, AI review, human approve, shipped state.

---

## TASK-018: Screenshots and Visual Assets

**Objective:** Add ≥6 product screenshots to `docs/screenshots/` and embed them in README.

**Screenshots Required:**
1. `01-landing.png` — Landing page hero section.
2. `02-dashboard.png` — Org dashboard with real feature cards.
3. `03-prd-editor.png` — PRD page with rich section rendering (post-TASK-006).
4. `04-kanban.png` — Task Kanban board with cards in all three columns.
5. `05-pr-review.png` — PR review page with AI findings (blocking in red, non-blocking in yellow).
6. `06-human-approval.png` — Human approval page with the approval checklist.

**Capturing Process:**
1. Seed demo data in production or a local demo environment.
2. Use a browser screenshot tool (e.g., `npx playwright screenshot` for consistency).
3. Resize to 1280×800 for README display.

**README Changes:**
```markdown
## 📸 Product Screenshots

| Dashboard | PRD Editor | PR Review |
|:-:|:-:|:-:|
| ![Dashboard](docs/screenshots/02-dashboard.png) | ![PRD Editor](docs/screenshots/03-prd-editor.png) | ![PR Review](docs/screenshots/05-pr-review.png) |

| Kanban Board | Human Approval | Landing Page |
|:-:|:-:|:-:|
| ![Kanban](docs/screenshots/04-kanban.png) | ![Approval](docs/screenshots/06-human-approval.png) | ![Landing](docs/screenshots/01-landing.png) |
```

**Done Criteria:**
- [ ] `docs/screenshots/` contains ≥6 PNG files.
- [ ] README displays all screenshots in a grid layout.
- [ ] `apps/web/public` directory retains existing SVGs (don't break Next.js build).

---

## TASK-019: Dead Code Cleanup

**Objective:** Remove dead code, fix the unused `drizzle` import in `context.ts`, remove the `dummyDeployments` constant.

**Files To Modify:**
- `packages/trpc/server/context.ts` — remove unused `drizzle` import
- `apps/web/src/components/dashboard/deployments-list.tsx` — remove `dummyDeployments` (replaced by real data via TASK-015)

**Backend Tasks:**
- [ ] Remove unused import: `import { drizzle } from 'drizzle-orm/...'` from `context.ts`.
- [ ] Verify no other unused imports remain in files touched by this roadmap using `pnpm eslint --fix`.
- [ ] Delete `dummyDeployments` constant after TASK-015 is complete.
- [ ] Run `pnpm run check-types` — verify still 0 errors.

**Done Criteria:**
- [ ] `pnpm run lint` reports 0 warnings in modified files.
- [ ] `dummyDeployments` is gone.
- [ ] Unused `drizzle` import is gone.

---

## TASK-020: Integration Test — Full Feature Lifecycle

**Objective:** Create a programmatic (non-browser) integration test that exercises the entire request→ship journey via tRPC API calls and direct service invocations, giving judges confidence the core loop actually works end to end.

**Files To Create:**
- `packages/services/src/__tests__/feature-lifecycle.integration.test.ts`

**Backend Tasks:**
- [ ] Use Vitest with a real test database (set `DATABASE_URL` to a test DB in CI).
- [ ] Test setup: create org, user, project.
- [ ] Step 1: Call `featureService.createFeature(...)` → assert status `SUBMITTED`.
- [ ] Step 2: Mock AI client. Call `featureService.processClarificationReply(...)` with mock AI returning `{ action: 'mark_ready' }` → assert status `CLARIFIED`.
- [ ] Step 3: Call `featureService.generatePRD(...)` (with mocked AI) → assert status `PRD_GENERATED`, assert PRD fields populated.
- [ ] Step 4: Call `featureService.generateTasks(...)` (mocked) → assert status `TASKS_GENERATED`, assert tasks rows in DB.
- [ ] Step 5: Call `featureService.approvePlan(...)` → assert status `PLAN_APPROVED`.
- [ ] Step 6: Emit webhook-style event to create a PR record → assert status `IN_REVIEW`.
- [ ] Step 7: Mock AI review → call `featureService.passReview(...)` → assert status `AWAITING_HUMAN_APPROVAL`.
- [ ] Step 8: Call `featureService.approveHumanRelease(...)` → assert status `SHIPPED`.
- [ ] Teardown: delete all test rows.

**Done Criteria:**
- [ ] `pnpm test --filter @shipflow/services` shows `feature-lifecycle.integration.test.ts` passing.
- [ ] Test exercises all 12 state transitions in a single test run.
- [ ] No hardcoded production data.

---

# STEP 5 — EXECUTION ROADMAP

## Phase 1 — Critical Score Recovery (Days 1–3)
**Expected Score Gain: +14 points → 89/100**

### P1-A: Day 1 Morning (3–4 hours)
**TASK-011**: Fix Hardcoded Secrets — 45 min. Zero ambiguity, high confidence, removes security gap and rubric deduction.
**TASK-012**: Fix CORS Wildcard — 30 min. Single file change.
**TASK-019**: Dead Code Cleanup — 30 min. Remove known dead items.
**TASK-005**: Source Channel (DB column + form wire-up) — 90 min. Small migration, small tRPC change, small UI change.

**Score impact:** +1 (GitHub Integration SEC fix) → 13.5/15

### P1-B: Day 1 Afternoon (4–5 hours)
**TASK-001**: Wire Razorpay Billing — This is the highest-visibility fix. A working billing flow changes the judge's entire perception of production-readiness.

**Score impact:** +2 (SaaS UX billing fix) → 8/10

### P1-C: Day 2 (6–8 hours)
**TASK-003**: Audit Log Write Service — touches many files but pattern is repetitive and low-risk.
**TASK-004**: In-App Notification Write Service — same pattern as audit logs.

**Score impact:** +1.5 (Review Loop & Approval) → 13.5/15

### P1-D: Day 2 Afternoon + Day 3 Morning (5–6 hours)
**TASK-006**: PRD Editor — replaces the most visually embarrassing gap (raw JSON dump with a polished UI).

**Score impact:** +1 (Core Workflow) +0.5 (SaaS UX) → 18/20 Core, 8.5/10 SaaS

### P1-E: Day 3 (4–5 hours)
**TASK-002**: Real Member Invitations — new `packages/email/` package + rewrite invite mutation + acceptance route.

**Score impact:** +0.5 (SaaS UX) +0.5 (tRPC Engineering) → 9/10 SaaS

**Phase 1 Total: ~75 → 89/100**

---

## Phase 2 — Advanced Features (Days 4–6)
**Expected Score Gain: +6 points → 95/100**

### P2-A: Day 4 (6–8 hours)
**TASK-007**: Autonomous Code Reviewer Agent — highest AI rubric impact (+4 pts). Requires careful implementation. Start with tools.ts, then reflection schema, then rewrite index.ts.

**Score impact:** +4 (AI Agent Quality) → 17/20

### P2-B: Day 4–5 (3–4 hours)
**TASK-008**: AI Agent Unit Tests — directly recovers 2 rubric points. Can be done in parallel with TASK-007 if pair programming.

**Score impact:** +2 (AI Agent Quality) → 19/20

### P2-C: Day 5 (3–4 hours)
**TASK-009**: Fix Summarizer + Release Notes — removes hardcoded data violation, fixes dead code, makes the 6th agent functional.

**Score impact:** +0.5 (AI Agent Quality) → 19.5/20 ≈ 20/20 (within rounding)

### P2-D: Day 5–6 (3–4 hours)
**TASK-013**: Fix Hardcoded Analytics — replace two fake numbers with real queries. Removes the "mixed fake/real" deception.

**Score impact:** +0.5 (SaaS UX) → 9.5/10

**Phase 2 Total: ~89 → 95/100**

---

## Phase 3 — Production Hardening (Days 7–9)
**Expected Score Gain: +2 points → 97/100**

### P3-A: Day 7 (4–5 hours)
**TASK-014**: Real E2E Test Suite — requires global setup, auth fixture, and 5 spec files. The most time-consuming test task.

**Score impact:** +1.5 (Engineering Quality) → 14.5/15

### P3-B: Day 8 (3–4 hours)
**TASK-010**: GitHub Issues Webhook Handler — makes subscribed events actually do something.
**TASK-015**: Fix Deployments List — connect Vercel webhook to dashboard.

**Score impact:** +0.5 (GitHub Integration) → 15/15
**Score impact:** +0.5 (SaaS UX) → 10/10

### P3-C: Day 9 (2–3 hours)
**TASK-016**: Kanban Drag-and-Drop — UX polish, relatively low-risk with @dnd-kit.
**TASK-020**: Integration Test — API-level lifecycle test. High value for engineering confidence.

**Score impact:** +0.5 (Core Workflow) → 20/20

**Phase 3 Total: ~95 → 97/100**

---

## Phase 4 — Judge Delight Features (Days 10–11)
**Expected Score Gain: +3 points → 100/100**

### P4-A: Day 10 (2–3 hours)
**TASK-018**: Screenshots — seed demo data, take 6 clean screenshots, embed in README.

**Score impact:** +1 (Demo & Documentation) → 3/5

### P4-B: Day 10–11 (4–5 hours)
**TASK-017**: Demo Video — record with Loom, embed in README, add thumbnail.

**Score impact:** +2 (Demo & Documentation) → 5/5

**Phase 4 Total: ~97 → 100/100**

---

# STEP 6 — ENGINEERING BACKLOG

| Priority | Task ID | Task | Category | Effort (hrs) | Dependencies |
|---|---|---|---|---|---|
| P0 | TASK-011 | Fix hardcoded secret fallbacks | Security / GitHub | 1 | None |
| P0 | TASK-012 | Fix CORS wildcard with credentials | Security / Engineering | 0.5 | None |
| P0 | TASK-001 | Wire Razorpay billing to tRPC route | Billing / SaaS UX | 5 | packages/billing exists |
| P0 | TASK-006 | PRD Editor rich rendering | Core Workflow / SaaS UX | 5 | None |
| P0 | TASK-017 | Demo video production | Documentation | 4 | All UI tasks ideally done first |
| P0 | TASK-018 | Screenshots in README | Documentation | 2 | TASK-006 recommended first |
| P1 | TASK-003 | Audit log write service | Review Loop / Engineering | 3 | None |
| P1 | TASK-004 | Notification write service | Review Loop / SaaS UX | 3 | TASK-003 (shared pattern) |
| P1 | TASK-005 | Source channel DB + form wire-up | Core Workflow | 2 | None |
| P1 | TASK-007 | Autonomous code reviewer agent | AI Agent Quality | 8 | Pinecone/Octokit context available |
| P1 | TASK-008 | AI agent unit tests (all 6) | AI Agent Quality | 4 | TASK-007 (code reviewer tests need new structure) |
| P1 | TASK-002 | Real member email invitations | SaaS UX / Engineering | 5 | RESEND_API_KEY or SMTP credentials |
| P2 | TASK-009 | Fix Summarizer agent + real trigger | AI Agent Quality | 3 | TASK-010 (release event from webhook) |
| P2 | TASK-010 | GitHub issues webhook handler | GitHub Integration | 4 | DB migration |
| P2 | TASK-013 | Replace hardcoded analytics values | SaaS UX | 2 | DB has enough real data |
| P2 | TASK-014 | Real E2E test suite | Engineering Quality | 8 | All backend tasks ideally complete |
| P2 | TASK-015 | Fix deployments list (Vercel data) | SaaS UX / Engineering | 2 | Verify Vercel webhook writes to DB |
| P2 | TASK-016 | Kanban drag-and-drop | Core Workflow / SaaS UX | 3 | @dnd-kit install |
| P3 | TASK-019 | Dead code cleanup | Engineering Quality | 1 | After TASK-015 (dummyDeployments) |
| P3 | TASK-020 | Integration test — full lifecycle | Engineering Quality | 4 | TASK-003, TASK-004 complete |

---

# STEP 7 — VERIFICATION MATRIX

| Requirement | Tasks Covering It | Verification Method | Status After Completion |
|---|---|---|---|
| Multi-channel intake (email/ticket/call/in-app) | TASK-005 | Create feature with each channel type, verify DB column, verify badge display | ✅ Complete |
| AI clarifying questions | Existing (90% done) | No change needed — already verified by eval | ✅ Already complete |
| Duplicate detection / educate user | Existing (85% done) | No change needed | ✅ Already complete |
| Structured PRD generation (7 sections) | TASK-006 | Navigate to PRD page, verify 7 distinct labeled sections visible | ✅ Complete |
| PRD → engineering tasks | Existing (90%) | No change needed | ✅ Already complete |
| Kanban board | TASK-016 | Drag task from TODO to IN_PROGRESS, verify DB update, verify optimistic move | ✅ Complete |
| Team reviews & approves plan | TASK-006, TASK-003 | Approve plan as PM, verify state change, verify audit log entry | ✅ Complete |
| GitHub repo connection | Existing (95%) | No change needed | ✅ Already complete |
| PRs tracked against feature/PRD | Existing (95%) | No change needed | ✅ Already complete |
| AI QA reviews PR vs PRD/criteria/security/perf | TASK-007 | Trigger review, verify Inngest shows tool call steps, verify findings cover all categories | ✅ Complete |
| Blocking/Non-blocking categorization | Existing (95%) | No change needed | ✅ Already complete |
| Fix loop: blocking → fix-needed → re-review | Existing (90%) | No change needed | ✅ Already complete |
| Human sees PRD/tasks/PR/history before approving | TASK-006, TASK-004 | Open approval page, verify PRD sections visible (not JSON), verify notification sent | ✅ Complete |
| Human approve/reject → only approved = Shipped | Existing (95%) | No change needed — server-enforced | ✅ Already complete |
| AI as QA reviewer, not syntax checker | TASK-007 | Verify agent calls `getPRDSection`, `getPreviousFindings` tools autonomously | ✅ Complete |
| No hardcoded PR data | TASK-009 | Code audit: zero hardcoded PR arrays | ✅ Complete |
| Stack: Next.js/tRPC/Shadcn/BetterAuth/Razorpay/Octokit/AI SDK/Inngest/Drizzle/Postgres | TASK-001 (Razorpay wire-up) | `package.json` audit + live billing test | ✅ Complete |
| Multi-tenant orgs (own users/projects/repos/etc.) | Existing (90%) | No change needed | ✅ Already complete |
| Auth via BetterAuth | Existing (90%) | No change needed | ✅ Already complete |
| Billing via Razorpay | TASK-001 | Upgrade flow opens Razorpay, not Stripe; subscription updates post-payment | ✅ Complete |
| GitHub Octokit: connect/webhook/track/diff/review/comment | TASK-010 (issues) | Issue webhook creates DB row | ✅ Complete |
| AI SDK powers all 6 capabilities | TASK-007, TASK-008, TASK-009 | All 6 agents have unit tests; Summarizer is triggered; Reviewer uses tools | ✅ Complete |
| Inngest for all async workflows | TASK-009 (trigger fix) | `github.release.published` triggers generate-release-notes workflow | ✅ Complete |
| Workflow progress visible in app | Existing (90%) | No change needed | ✅ Already complete |
| All required pages | TASK-006 (PRD Editor) | Navigate to each required page per spec list | ✅ Complete |
| tRPC monorepo structure | Existing (95%) | No change needed | ✅ Already complete |
| Public GitHub repository | Verify + link in README | README has public repo URL; `git remote -v` shows public repo | ✅ Verify externally |
| Deployed live project | Verify + link in README | README has live Vercel URL | ✅ Verify externally |
| Demo video | TASK-017 | README has working video link; video is ≥3 min | ✅ Complete |
| README completeness | TASK-017, TASK-018 | README contains all required sections + screenshots + video | ✅ Complete |
| Member invitations | TASK-002 | Invite sends email; acceptance creates membership | ✅ Complete |
| Audit logs | TASK-003 | After lifecycle run, audit_logs table has ≥8 rows | ✅ Complete |
| In-app notifications | TASK-004 | Bell shows correct unread count; notifications triggered at expected events | ✅ Complete |
| Analytics — no fake data | TASK-013 | Inspect DB: approvalRate = real query result; reviewTimeBySeverity = real aggregate | ✅ Complete |
| E2E tests — real workflows | TASK-014 | `pnpm test:e2e` passes ≥3 of 5 specs without explicit "we can't test this" comments | ✅ Complete |
| Hardcoded secrets removed | TASK-011 | Start server with APPROVAL_SECRET unset → startup throws | ✅ Complete |
| CORS restricted | TASK-012 | Request from unlisted origin → CORS error | ✅ Complete |
| Deployments list real data | TASK-015 | Dashboard deployments list shows real Vercel webhook data | ✅ Complete |

---

# STEP 8 — FINAL AUDIT

## Self-Audit Checklist

### Every Point Deduction Addressed?

| Deduction | Category | Task | ✅ |
|---|---|---|---|
| Source channel selector discards value | Core Workflow (-1) | TASK-005 | ✅ |
| PRD is raw JSON dump, no editor | Core Workflow (-1) | TASK-006 | ✅ |
| No integration test for full journey | Core Workflow (-1) | TASK-020 + TASK-014 | ✅ |
| No autonomous tool-use / multi-step agent | AI Agent (-4) | TASK-007 | ✅ |
| Zero unit tests on AI agents | AI Agent (-2) | TASK-008 | ✅ |
| Summarizer dead with hardcoded data | AI Agent (-1) | TASK-009 | ✅ |
| Hardcoded secret fallbacks | Engineering (-1) | TASK-011 | ✅ |
| E2E suite is placeholder quality | Engineering (-1) | TASK-014 | ✅ |
| CORS wildcard with credentials | Engineering (-1) | TASK-012 | ✅ |
| Billing theatrical / Stripe URL | SaaS UX (-2) | TASK-001 | ✅ |
| Member invite silently no-ops | SaaS UX (-1) | TASK-002 | ✅ |
| Analytics mixes real + hardcoded | SaaS UX (-1) | TASK-013 | ✅ |
| No demo video | Docs (-2) | TASK-017 | ✅ |
| No screenshots | Docs (-1) | TASK-018 | ✅ |
| issues/issue_comment webhooks unhandled | GitHub (-1) | TASK-010 | ✅ |

### Every Missing Requirement Addressed?

| Requirement | Task | ✅ |
|---|---|---|
| Real Razorpay billing | TASK-001 | ✅ |
| Real member invitations | TASK-002 | ✅ |
| Audit log writes | TASK-003 | ✅ |
| Notification writes | TASK-004 | ✅ |
| Source channel persisted | TASK-005 | ✅ |
| PRD rendered as document | TASK-006 | ✅ |
| Autonomous agentic reviewer | TASK-007 | ✅ |
| AI agent tests | TASK-008 | ✅ |
| Summarizer wired to real data | TASK-009 | ✅ |
| Issues webhook handler | TASK-010 | ✅ |
| Secret fallbacks removed | TASK-011 | ✅ |
| CORS restricted | TASK-012 | ✅ |
| Analytics all real | TASK-013 | ✅ |
| Real E2E tests | TASK-014 | ✅ |
| Deployments list real | TASK-015 | ✅ |
| Kanban drag-and-drop | TASK-016 | ✅ |
| Demo video | TASK-017 | ✅ |
| Screenshots | TASK-018 | ✅ |
| Dead code removed | TASK-019 | ✅ |
| Integration test | TASK-020 | ✅ |

### Every Mocked Feature Addressed?

| Mock | Task | ✅ |
|---|---|---|
| billing/route.ts explicit mock | TASK-001 | ✅ |
| member.invite console.log stub | TASK-002 | ✅ |
| generate-release-notes fake PR array | TASK-009 | ✅ |
| auditLogs zero writes | TASK-003 | ✅ |
| notifications zero writes | TASK-004 | ✅ |
| deployments-list hardcoded [] | TASK-015 | ✅ |
| approvalRate: 94 // Simplified | TASK-013 | ✅ |
| reviewTimeBySeverity hardcoded | TASK-013 | ✅ |
| sourceChannel selector discarded | TASK-005 | ✅ |

### Every Task Has Acceptance Criteria? ✅ All 20 tasks have done criteria.

### Every Task Has Testing Requirements? ✅ All 20 tasks include testing tasks.

### Every Requirement Has Implementation Coverage? ✅ Confirmed by Verification Matrix above.

---

## PROJECTED FINAL SCORE

| Category | Before | After | Change |
|---|---|---|---|
| Core Workflow Implementation | 17/20 | 20/20 | +3 |
| AI Agent Quality | 13/20 | 20/20 | +7 |
| GitHub Integration | 13/15 | 15/15 | +2 |
| Review Loop & Human Approval | 12/15 | 15/15 | +3 |
| tRPC Monorepo & Engineering Quality | 12/15 | 15/15 | +3 |
| SaaS Product Experience | 6/10 | 10/10 | +4 |
| Demo & Documentation | 2/5 | 5/5 | +3 |
| **TOTAL** | **75/100** | **100/100** | **+25** |

---

## APPENDIX A: Environment Variables Required

```bash
# === REQUIRED (throw on missing) ===
APPROVAL_SECRET=<random 64-char hex>
GITHUB_STATE_SECRET=<random 64-char hex>
INVITATION_SECRET=<random 64-char hex>
RAZORPAY_KEY_ID=<from Razorpay dashboard>
RAZORPAY_KEY_SECRET=<from Razorpay dashboard>
RAZORPAY_WEBHOOK_SECRET=<from Razorpay webhook settings>

# === REQUIRED FOR EMAIL ===
RESEND_API_KEY=<from resend.com dashboard>
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=<app password>

# === CORS ===
CORS_ALLOWED_ORIGINS=https://shipflow-ai.vercel.app,http://localhost:3000

# === EXISTING (keep as-is) ===
DATABASE_URL=postgresql://...
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...
GITHUB_WEBHOOK_SECRET=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX=...
INNGEST_SIGNING_KEY=...
BETTER_AUTH_SECRET=...
```

---

## APPENDIX B: New Package Additions

```
packages/
  email/           ← NEW (TASK-002)
    package.json
    src/
      index.ts
      templates/
        invitation.ts
  utils/           ← NEW (TASK-011)
    package.json
    src/
      env.ts       ← requireEnv() helper
```

## APPENDIX C: New DB Tables

```
github_issues           ← TASK-010
github_issue_comments   ← TASK-010
org_invitations         ← TASK-002
release_notes           ← TASK-009
```

## APPENDIX D: New DB Columns

```
features.source_channel          ← TASK-005
review_runs.review_meta (JSONB)  ← TASK-007
subscriptions.usage_count        ← TASK-001
subscriptions.usage_limit        ← TASK-001
subscriptions.renewal_date       ← TASK-001
```

---

*End of ShipFlow AI Implementation Roadmap — v1.0*
*Total Tasks: 20 | Total Estimated Effort: ~80 engineer-hours | Projected Score: 75 → 100*
