You need to refactor the entire implementation plan, architecture, and task breakdown to follow the exact monorepo structure below.

Do NOT create an alternative architecture.
Do NOT keep the old architecture.
Do NOT generate a second option.

Replace the current architecture, package responsibilities, task ownership, dependency graph, and implementation plan with this structure.

The project is built on:
https://github.com/piyushgarg-dev/trpc-monorepo

==================================================
MONOREPO STRUCTURE (SOURCE OF TRUTH)
==================================================

apps/
└── web/

packages/
├── db/
├── services/
├── trpc/
├── shared/
├── ai/
├── github/
├── workflow/
├── auth/
├── billing/
└── ui/

==================================================
PACKAGE RESPONSIBILITIES
==================================================

### packages/db

Contains ONLY:

- drizzle schema
- Database client
- Repository layer
- Database transactions
- Query helpers

Examples:

- user.repository.ts
- workspace.repository.ts
- project.repository.ts
- feature-request.repository.ts
- prd.repository.ts
- task.repository.ts
- review.repository.ts
- release.repository.ts

Must NOT contain:

- Business logic
- AI logic
- GitHub logic
- API logic
- UI logic

==================================================

### packages/services

Business logic layer.

Contains:

- Application services
- Domain orchestration
- Validation
- Repository coordination
- Workflow triggering

Examples:

- create-feature-request.service.ts
- generate-prd.service.ts
- generate-task-plan.service.ts
- review-pr.service.ts
- approve-release.service.ts

Must NOT contain:

- React code
- API routes
- tRPC procedures
- Database schema definitions
- AI prompts

==================================================

### packages/trpc

Contains:

- tRPC context
- Procedures
- Routers
- Authorization middleware

Examples:

routers/

- workspace.router.ts
- project.router.ts
- feature-request.router.ts
- prd.router.ts
- task.router.ts
- github.router.ts
- review.router.ts
- billing.router.ts

Routers must be thin.

Router
→ Service
→ Repository

No business logic inside routers.

==================================================

### packages/shared

Contains:

- Zod schemas
- Shared types
- DTOs
- Enums
- Constants

Single source of truth for validation.

Used by:

- web
- services
- trpc
- workflows
- ai

==================================================

### packages/ai

Contains AI agents only.

Examples:

agents/

- clarification.agent.ts
- repository-analysis.agent.ts
- prd.agent.ts
- task-planning.agent.ts
- review.agent.ts
- release-readiness.agent.ts

All prompts live here.

Services call agents.

Prompts must NOT be embedded inside services.

==================================================

### packages/github

Contains:

- Octokit setup
- GitHub integration
- Repository sync
- PR analysis
- Webhook utilities

Examples:

- octokit.ts
- webhook.ts
- repository.service.ts
- pull-request.service.ts
- review-comment.service.ts

GitHub logic must remain isolated.

==================================================

### packages/workflow

Contains:

- Inngest setup
- Events
- Async workflows

Examples:

- process-feature-request.workflow.ts
- generate-prd.workflow.ts
- generate-task-plan.workflow.ts
- review-pr.workflow.ts
- rereview-pr.workflow.ts
- release-readiness.workflow.ts

All long-running operations belong here.

==================================================

### packages/auth

Contains:

- BetterAuth configuration
- Auth helpers
- Session management
- Permission utilities

==================================================

### packages/billing

Contains:

- Razorpay integration
- Subscription management
- AI credit management
- Usage tracking
- Limit enforcement

==================================================

### packages/ui

Contains:

- Shared UI components
- Design system
- Shadcn wrappers
- Reusable primitives

==================================================

### apps/web

Contains:

- Pages
- Layouts
- Feature modules
- Components
- Hooks

Recommended structure:

features/
├── workspace/
├── project/
├── feature-request/
├── prd/
├── task-board/
├── github/
├── review/
├── release/
├── billing/
└── settings/

==================================================
FRONTEND RULES
==================================================

Components must NEVER directly call tRPC procedures.

Create dedicated hooks.

Examples:

hooks/

- use-create-feature-request.ts
- use-generate-prd.ts
- use-task-board.ts
- use-reviews.ts
- use-release.ts

Flow:

Component
↓
Custom Hook
↓
tRPC Router
↓
Service
↓
Repository
↓
Database

==================================================
ASYNC FLOW
==================================================

Feature Request
↓
Service
↓
Inngest Event
↓
Workflow
↓
AI Agent
↓
Database

==================================================
GITHUB FLOW
==================================================

GitHub Webhook
↓
packages/github
↓
Workflow
↓
AI Review Agent
↓
Review Records
↓
UI

==================================================
TASK REFACTOR REQUIREMENTS
==================================================

Refactor ALL implementation tasks to match this architecture.

For every task include:

1. Task Name
2. Package Ownership
3. Dependencies
4. Deliverables
5. Acceptance Criteria

Example:

Task: Feature Request Creation

Package Ownership:

- shared
- db
- services
- trpc
- web

Deliverables:

- FeatureRequest schema
- Repository
- Service
- Router
- Hook
- UI
