# ShipFlow AI: Strict Path to Full Score

This document is a strict, code-aware upgrade plan for the current ShipFlow AI repository. It is written to close the exact gaps between the current implementation and the product spec in `docs/init.md`.

The goal is not to make the project look complete. The goal is to make each rubric area defensible under a strict review.

## Current Reality

The repository already has a believable monorepo shape, a working Next.js app, an AI package, GitHub App helpers, Inngest workflows, and a tRPC layer. However, several critical flows are still partially simulated, partially hardcoded, or not enforced end to end.

Main issues that keep the score from being full:
- workflow states are not yet enforced as a complete product lifecycle
- AI agents are structured, but not consistently grounded in PRD, tasks, and release criteria
- GitHub integration exists, but the repo-to-workspace and review publishing paths still need hardening
- the review loop is not yet a strict fix-needed -> re-review -> human approval gate
- tRPC and service boundaries are present, but tenant isolation and permission checks need to be centralized
- product pages still contain demo-style placeholders in places that should be live workflow surfaces
- README and demo documentation are not yet project-specific enough

## Scoring Targets

To score full in every area, the implementation must satisfy the following:
- every major workflow step must persist state
- every AI output must be structured and grounded in real product context
- every GitHub action must be installation-scoped and idempotent
- every review cycle must have a deterministic rerun path
- every workspace request must be isolated and permission-checked
- the UI must expose real workflow state, not static mocks
- the repo must include serious setup and demo documentation

## 1. Core Workflow Implementation: 20/20

### What is missing now
- clarification flow is not implemented as a first-class stateful loop
- duplicate detection is not a persisted business step
- PRD generation is not tightly tied to one authoritative PRD model and status progression
- task generation is not clearly linked to approved PRDs and Kanban persistence
- review, fix-needed, re-review, approval, and shipped are not enforced as a complete state machine
- some service methods only emit Inngest events and return `PROCESSING` without proving downstream persistence

### What must exist for full score
- one canonical feature lifecycle state machine
- persisted states for each stage: submitted, clarifying, clarified, duplicate resolved, PRD ready, plan approved, in development, in review, fix needed, awaiting human approval, shipped
- a workflow run record for every durable step
- a canonical PRD record, task record, review record, and release record linked together
- explicit state guards so invalid transitions fail immediately
- workspace-scoped workflow progress visible in the UI

### What to build
- make feature intake create a real feature request record with workspace, project, and source metadata
- add clarification and duplicate detection as actual workflow stages, not just agent functions
- persist PRD drafts and versions
- generate epics, tasks, and subtasks from the approved PRD
- link tasks back to PRD acceptance criteria
- store review cycles and approval records
- create a release record only after human approval

### Acceptance criteria
- a feature request can be traced from intake to shipped with one database-backed lifecycle
- invalid state transitions are rejected by service logic, not just by UI convention
- the dashboard can show real progress and not only placeholder activity cards

## 2. AI Agent Quality: 20/20

### What is missing now
- agents are structured, but they are still too generic
- review output is not consistently grounded in acceptance criteria and task requirements
- release readiness is not a real AI gate yet
- duplicate detection and clarification are not clearly using project memory or prior feature history
- there is no visible evaluation harness proving review quality over time

### What must exist for full score
- structured outputs for clarification, duplicate detection, PRD generation, task generation, review, and release readiness
- every review issue must reference a requirement, task, or acceptance criterion
- every blocking finding must include why the implementation fails the spec
- every AI call must be documented with input context and usage metadata
- an internal prompt/test harness that proves schema stability and grounded output

### What to build
- tighten the PR review prompt so it must compare diff against PRD, tasks, acceptance criteria, security, performance, and edge cases
- add a release-readiness agent that evaluates unresolved issues and prior review history
- add a clarification agent that decides whether more context is needed before PRD generation
- add a duplicate detection agent that can distinguish new requests from existing capabilities
- store AI usage and prompt metadata for observability and cost tracking

### Acceptance criteria
- review output is not accepted unless every issue is mapped to a concrete requirement or code location
- AI can explain why an issue matters for shipping, not just that the code looks imperfect
- structured output schema failures are treated as hard failures, not silently coerced text

## 3. GitHub Integration: 15/15

### What is missing now
- the repo connection flow needs tighter installation-scoped ownership checks
- webhook handling must be hardened around repo mapping, deduplication, and PR lifecycle events
- review publishing must be proven against live diffs and commit SHAs
- stale reviews must be superseded or dismissed on synchronize events
- hardcoded or demo-like PR assumptions must be removed from all review paths

### What must exist for full score
- GitHub App installation auth for every repository-specific call
- verified webhook signatures before parsing or acting on payloads
- delivery-id idempotency on every webhook event
- live diff fetch from GitHub for each review cycle
- review comment posting that uses actual file paths, commit SHA, and line positions
- repository records that map unambiguously to workspace and installation context

### What to build
- ensure connected repositories are looked up by installation and repository metadata, not only by a display slug
- normalize PR ingestion so opened, reopened, and synchronize events are handled with the same lifecycle rules
- add a dedicated review publisher that converts AI findings into GitHub review payloads
- add stale-review handling for synchronize events
- make repository sync and review fetches installation-scoped and tenant-safe

### Acceptance criteria
- a PR from a connected repo can be reviewed without any manual database patching
- duplicate webhook deliveries do not create duplicate reviews
- a changed head SHA produces a new review cycle, not stale output

## 4. Review Loop & Human Approval: 15/15

### What is missing now
- the review loop is not yet closed tightly enough around fix-needed states
- human approval is present conceptually, but the gate needs to be strict and persisted
- outstanding review issues are not clearly tied to the approval screen
- there is no fully enforced transition from blocked review to approval to shipped

### What must exist for full score
- review cycles with explicit cycle numbers and history
- unresolved blocking issues prevent approval
- human approval requires the user to inspect PRD, tasks, review history, and remaining issues
- approval creates a release record and final shipped state
- re-review is triggered by new commits while preserving previous context

### What to build
- make fix-needed a real state with visible issues and retry controls
- create a review history page showing the sequence of AI reviews and human decisions
- add a release readiness step before human approval unlocks
- prevent shipping unless the current review cycle is ready and blocking issues are resolved

### Acceptance criteria
- a reviewer cannot approve a feature with unresolved blocking issues
- re-review uses the prior review as context instead of starting from scratch
- the shipped state is only reachable through the approval gate

## 5. tRPC Monorepo & Engineering Quality: 15/15

### What is missing now
- the tRPC layer proves auth, but not strict tenant isolation
- permission checks are not yet centralized enough for a multi-tenant SaaS
- some routes still depend on `orgId` coming from the caller instead of deriving workspace scope from session and slug context
- service and UI boundaries need to be cleaner and more consistent

### What must exist for full score
- one shared middleware for membership enforcement
- one shared middleware for permission enforcement
- workspace slug resolution from server context, not trusted client input
- strict input validation for every mutation and query
- service layer methods that operate on tenant-scoped records only

### What to build
- add `requireWorkspaceMembership` and `requirePermission` as central tRPC middleware
- derive active workspace from route context and verify membership server-side
- keep direct database calls out of UI pages where tRPC should own the mutation path
- create shared schema and permission helpers in a common package
- add tests for authorization and tenant boundaries

### Acceptance criteria
- a user cannot access another workspace by guessing IDs or slugs
- route inputs fail fast when required scope is missing
- authorization rules are enforced in exactly one place and reused everywhere

## 6. SaaS Product Experience: 10/10

### What is missing now
- several pages still feel like polished marketing shell around placeholder data
- the core workflow screens are not yet rich enough to support real product use
- the app needs clearer surfaces for PRD editing, task planning, review history, billing, and approvals
- some UI elements are present but still behave like demo triggers rather than workflow actions

### What must exist for full score
- landing page, auth, dashboard, workspace management, project view, feature requests, PRD editor, task board, GitHub integration, PR reviews, review history, billing, and final approval screens
- live data and actions on each workflow surface
- empty states that guide action, not decorative placeholder cards
- no fake buttons that imply functionality without wired state

### What to build
- replace placeholder dashboard panels with real workflow data
- add a PRD editor with versioning and approval controls
- add a task board with status transitions and dependencies
- add review history and approval timeline views
- add billing and usage surfaces that reflect actual plan status and credit consumption

### Acceptance criteria
- every primary page helps the user move the feature forward in the workflow
- empty workspaces still show a clear next action
- the product feels like a real SaaS tool, not a demo dashboard

## 7. Demo & Documentation: 5/5

### What is missing now
- the README is still generic starter material and does not explain ShipFlow clearly enough
- the setup path for GitHub App, webhook secret, AI keys, database, and Inngest is not documented at the level needed for a reviewer
- there is no obvious demo narrative in the repo docs
- the required live demo and video artifacts are not surfaced in the repository documentation

### What must exist for full score
- a ShipFlow-specific README
- setup instructions for the exact current project layout
- environment variables for database, auth, GitHub, AI, billing, Inngest, and deployment
- architecture explanation of the monorepo and workflow boundaries
- demo instructions that show the intended workflow in the right order

### What to build
- rewrite the README for ShipFlow instead of the Turborepo starter
- add a short architecture section that explains apps and packages
- document GitHub App registration and webhook setup
- document Inngest routes and local dev flow
- document AI provider selection and required keys

### Acceptance criteria
- a new reviewer can set up the project without guessing hidden steps
- the README reflects the actual current repo, not the starter template

## Suggested Execution Order

1. Harden workflow state transitions and persistence
2. Upgrade AI agents to ground every output in PRD and task context
3. Finish GitHub installation, webhook, and review publishing flow
4. Enforce the review loop and human approval gate
5. Centralize tRPC tenant and permission middleware
6. Replace placeholder UI with live workflow surfaces
7. Rewrite the README and add demo instructions

## Definition of Done for Full Score

The project should be considered full score only when all of the following are true:
- a feature request can be created, clarified, de-duplicated, planned, implemented, reviewed, fixed, re-reviewed, approved, and shipped without manual state patching
- GitHub webhook events are verified, deduplicated, and routed into installation-scoped workflows
- AI output is structured, grounded, and actionable
- human approval is the final gate before shipping
- workspace isolation is enforced at the API boundary
- the UI exposes the true workflow state of the product
- the README documents the project accurately and completely

## Files That Should End Up Stronger

- `README.md`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/(dashboard)/org/[slug]/page.tsx`
- `apps/web/src/app/(dashboard)/org/[slug]/pr/page.tsx`
- `apps/web/src/app/(dashboard)/org/[slug]/settings/integrations/page.tsx`
- `apps/web/src/components/github/connect-card.tsx`
- `packages/ai/src/agents/code-reviewer/*`
- `packages/ai/src/agents/planner/*`
- `packages/github/src/*`
- `packages/trpc/server/*`
- `packages/workflow/src/workflows/*`
- `packages/services/src/*`
- `packages/db/schema.ts`

## Final Note

If the project is reviewed strictly against `docs/init.md`, the fastest way to increase the score is not visual polish. It is to make the workflow real, persistent, tenant-safe, and reviewable from end to end.
