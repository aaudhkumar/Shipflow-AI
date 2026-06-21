## SECTION 3 — DOMAIN MODEL

The ShipFlow AI domain model is an exhaustive representation of the software engineering lifecycle, designed specifically to capture the nuances of human-AI collaboration. The model is deeply relational, highly structured, and designed for multi-tenant SaaS delivery. Below is the comprehensive definition of every core entity in the system.

### 3.1 Identity and Access Management Entities

#### 3.1.1 `Organization`

- **Purpose:** Represents a single tenant, typically a company or a distinct business unit using ShipFlow AI. It is the absolute root of all data isolation. Every operational record in the database must cascade from an Organization.
- **Relationships:** One-to-Many with `Member`, `Project`, `Repository`, `APIKey`, `WebhookSubscription`, `AuditLog`.
- **Lifecycle:** Created upon initial user signup or enterprise provisioning. Transitions states through active, suspended (billing failure), and deleted (soft delete).
- **Important Fields:** `id` (UUID), `name`, `slug` (unique across system), `billingPlan` (Enum: Free, Pro, Enterprise), `stripeCustomerId`, `createdAt`, `updatedAt`, `deletedAt`.
- **Indexes:** Unique index on `slug`. Index on `stripeCustomerId`.
- **Constraints:** `name` cannot be null. Deleting an organization must be a highly restricted operation, usually implemented as a soft delete to prevent catastrophic data loss.

#### 3.1.2 `Member`

- **Purpose:** Represents a user's association with a specific `Organization`. ShipFlow uses a model where a user (managed by BetterAuth) can belong to multiple Organizations, but their context is scoped by their `Member` record.
- **Relationships:** Many-to-One with `Organization`. Many-to-One with `User` (the global identity). One-to-Many with `FeatureRequest` (as author), `Task` (as assignee), `PullRequestReview` (as reviewer).
- **Lifecycle:** Created via invitation or automatic association upon Org creation. Can be active, invited, or deactivated.
- **Important Fields:** `id`, `orgId` (FK), `userId` (FK), `role` (Enum: Owner, Admin, PM, Engineer, Viewer), `status`, `joinedAt`.
- **Indexes:** Composite unique index on `(orgId, userId)` to prevent duplicate memberships.
- **Constraints:** A member must have exactly one role. 'Owner' role must have at least one active member in the organization.

### 3.2 Product and Planning Entities

#### 3.2.1 `Project`

- **Purpose:** Represents a specific product, service, or logical grouping of work within an Organization. E.g., "Mobile App v2", "Core Billing API".
- **Relationships:** Many-to-One with `Organization`. One-to-Many with `FeatureRequest`, `Epic`, `Release`. Many-to-Many with `Repository` (a project might span multiple repos).
- **Lifecycle:** Created by PMs/Admins. Moves from active to archived.
- **Important Fields:** `id`, `orgId` (FK), `name`, `description`, `status` (Active, Archived).
- **Indexes:** Index on `orgId`.
- **Constraints:** Cannot be hard-deleted if it contains associated Epics or PRDs.

#### 3.2.2 `Repository`

- **Purpose:** Represents a connected GitHub repository. ShipFlow AI uses this to track Pull Requests and map code changes to Tasks.
- **Relationships:** Many-to-One with `Organization`. Many-to-Many with `Project`. One-to-Many with `PullRequest`.
- **Lifecycle:** Created when an Admin authorizes the ShipFlow GitHub App for a specific repository.
- **Important Fields:** `id`, `orgId` (FK), `githubRepoId` (External ID), `fullName` (e.g., "acme-corp/api-server"), `defaultBranch`, `isPrivate`.
- **Indexes:** Unique index on `githubRepoId`.
- **Constraints:** Must map to a valid, accessible GitHub repository.

#### 3.2.3 `FeatureRequest`

- **Purpose:** The entry point of the entire ShipFlow workflow. Represents a raw, potentially ambiguous request from a user, PM, or stakeholder.
- **Relationships:** Many-to-One with `Organization`, `Project`, `Member` (Author). One-to-One with `ClarificationThread`. One-to-Many with `PRD`.
- **Lifecycle:** Submitted -> Clarification Pending -> Clarified -> Rejected -> PRD Generated -> Shipped.
- **Important Fields:** `id`, `orgId`, `projectId`, `authorId`, `title`, `rawDescription`, `status`, `businessValueScore`.
- **Indexes:** Index on `(orgId, projectId)`. Index on `status`.
- **Constraints:** `rawDescription` must be stored immutably to preserve original intent.

#### 3.2.4 `ClarificationThread`

- **Purpose:** Stores the conversation history between the PM and the ShipFlow AI. Used to gather context, resolve ambiguity, and force requirement specificity before PRD generation.
- **Relationships:** One-to-One with `FeatureRequest`.
- **Lifecycle:** Opened upon FeatureRequest creation. Closed when AI determines sufficient context exists or user manually bypasses.
- **Important Fields:** `id`, `featureRequestId` (FK), `isResolved`, `metadata` (JSONB - stores the extracted contextual facts).
- **Indexes:** Unique index on `featureRequestId`.
- **Constraints:** Only one thread per Feature Request.

#### 3.2.5 `ClarificationMessage` (Implicit Sub-entity)

- **Purpose:** Individual messages within the `ClarificationThread`.
- **Relationships:** Many-to-One with `ClarificationThread`.
- **Important Fields:** `id`, `threadId`, `sender` (Enum: USER, AI, SYSTEM), `content`, `createdAt`.

#### 3.2.6 `PRD` (Product Requirements Document)

- **Purpose:** The definitive source of truth for a feature. Auto-generated by the AI based on the `FeatureRequest` and `ClarificationThread`.
- **Relationships:** Many-to-One with `Organization`, `FeatureRequest`. One-to-Many with `PRDVersion`, `Epic`.
- **Lifecycle:** Draft -> Review -> Approved -> Obsolete.
- **Important Fields:** `id`, `orgId`, `featureRequestId`, `status`, `currentVersionId` (FK).
- **Indexes:** Index on `featureRequestId`.
- **Constraints:** Must be tied to a FeatureRequest.

#### 3.2.7 `PRDVersion`

- **Purpose:** Implements version control for PRDs. PMs or AI can revise the PRD; maintaining history is critical for auditability and resolving disputes over scope changes.
- **Relationships:** Many-to-One with `PRD`, `Member` (Author/Modifier).
- **Lifecycle:** Created when PRD is updated. Immutable once a newer version is created.
- **Important Fields:** `id`, `prdId`, `versionNumber` (Integer), `content` (Markdown/JSON), `changeSummary`, `createdAt`.
- **Indexes:** Composite unique index on `(prdId, versionNumber)`.
- **Constraints:** `content` is an immutable snapshot.

### 3.3 Execution and Engineering Entities

#### 3.3.1 `Epic`

- **Purpose:** A massive chunk of work derived directly from a PRD. An Epic represents the high-level implementation strategy for a PRD.
- **Relationships:** Many-to-One with `Organization`, `Project`, `PRD`. One-to-Many with `Task`.
- **Lifecycle:** Planning -> In Progress -> Completed.
- **Important Fields:** `id`, `orgId`, `projectId`, `prdId`, `title`, `description`, `status`, `targetReleaseId`.
- **Indexes:** Index on `prdId`. Index on `status`.
- **Constraints:** An Epic cannot be Completed if any child Task is not Done.

#### 3.3.2 `Task`

- **Purpose:** The fundamental unit of engineering work. Generated by the AI by decomposing an `Epic`. Maps 1:1 or 1:N to Pull Requests.
- **Relationships:** Many-to-One with `Organization`, `Epic`, `Member` (Assignee). One-to-Many with `Subtask`, `PullRequest`. Many-to-Many with `TaskDependency`.
- **Lifecycle:** Backlog -> Todo -> In Progress -> In Review -> Done.
- **Important Fields:** `id`, `orgId`, `epicId`, `assigneeId`, `title`, `technicalImplementationDetails` (Detailed AI instructions), `status`, `estimationPoints`.
- **Indexes:** Index on `assigneeId`. Index on `status`.
- **Constraints:** Must belong to an Epic.

#### 3.3.3 `Subtask`

- **Purpose:** Granular checklist items within a `Task`. E.g., "Create migration", "Write unit tests", "Update Drizzle schema".
- **Relationships:** Many-to-One with `Task`.
- **Lifecycle:** Pending -> Done.
- **Important Fields:** `id`, `taskId`, `description`, `isCompleted`.
- **Indexes:** Index on `taskId`.

#### 3.3.4 `TaskDependency`

- **Purpose:** Models Directed Acyclic Graphs (DAGs) of tasks. Ensures engineers know blockages (e.g., Task B cannot start until Task A is Done).
- **Relationships:** Many-to-One with `Task` (dependsOnId), Many-to-One with `Task` (dependentTaskId).
- **Lifecycle:** Active until `dependsOnId` task is Completed.
- **Important Fields:** `id`, `dependsOnTaskId` (FK), `dependentTaskId` (FK), `type` (Enum: Blocks, RelatesTo).
- **Indexes:** Composite index on `(dependentTaskId, dependsOnTaskId)`.
- **Constraints:** Cannot create circular dependencies (must be enforced at the application service layer).

### 3.4 Integration and Code Quality Entities

#### 3.4.1 `PullRequest`

- **Purpose:** Represents a GitHub Pull Request. This table acts as a mirror of the external VCS state, enriched with ShipFlow-specific context.
- **Relationships:** Many-to-One with `Organization`, `Repository`, `Task`. One-to-Many with `PullRequestReview`.
- **Lifecycle:** Open -> Draft -> In Review -> Changes Requested -> Approved -> Merged -> Closed (unmerged).
- **Important Fields:** `id`, `orgId`, `repositoryId`, `taskId`, `githubPrNumber`, `title`, `url`, `state`, `headSha`, `baseBranch`.
- **Indexes:** Unique index on `(repositoryId, githubPrNumber)`. Index on `taskId`.
- **Constraints:** Must map to a valid GitHub PR.

#### 3.4.2 `PullRequestReview`

- **Purpose:** Represents a review pass on a `PullRequest`. Can be performed by a human `Member` or the `ShipFlow AI`.
- **Relationships:** Many-to-One with `PullRequest`, `Member` (Reviewer). One-to-Many with `ReviewFinding`.
- **Lifecycle:** Pending -> Completed -> Dismissed.
- **Important Fields:** `id`, `pullRequestId`, `reviewerId` (Nullable, null if AI), `isAiReview` (Boolean), `state` (Approved, Changes_Requested, Commented), `commitSha` (The specific commit reviewed).
- **Indexes:** Index on `pullRequestId`.

#### 3.4.3 `ReviewFinding`

- **Purpose:** A specific, actionable comment or issue identified during a `PullRequestReview`, primarily by the AI.
- **Relationships:** Many-to-One with `PullRequestReview`.
- **Lifecycle:** Open -> Addressed -> Ignored (by human override).
- **Important Fields:** `id`, `reviewId`, `filePath`, `lineNumber`, `findingType` (Security, Performance, Architecture, PRD_Deviation), `description`, `suggestion` (Code snippet), `status`.
- **Indexes:** Index on `reviewId`.

#### 3.4.4 `Approval`

- **Purpose:** The final human gate before a release. Even if the AI approves a PR, an organization policy might require a human `Approval` record.
- **Relationships:** Many-to-One with `PullRequest`, `Member`.
- **Lifecycle:** Requested -> Granted -> Revoked.
- **Important Fields:** `id`, `pullRequestId`, `approverId`, `timestamp`, `signature` (Cryptographic or simple hash of commit SHA).
- **Indexes:** Index on `pullRequestId`.

### 3.5 Delivery and Operations Entities

#### 3.5.1 `Release`

- **Purpose:** Aggregates completed Epics and Tasks into a deployable unit. Maps to Git tags or deployment versions.
- **Relationships:** Many-to-One with `Organization`, `Project`.
- **Lifecycle:** Planned -> Building -> Deployed -> Failed -> Rolled Back.
- **Important Fields:** `id`, `orgId`, `projectId`, `version` (e.g., "v1.4.2"), `releaseNotes` (AI generated), `deployedAt`.
- **Indexes:** Index on `(projectId, version)`.

#### 3.5.2 `APIKey`

- **Purpose:** Allows external systems (CI/CD pipelines, external issue trackers) to interact programmatically with the ShipFlow API.
- **Relationships:** Many-to-One with `Organization`.
- **Lifecycle:** Active -> Revoked.
- **Important Fields:** `id`, `orgId`, `keyHash` (Never store plain text), `name`, `lastUsedAt`, `expiresAt`.
- **Indexes:** Unique index on `keyHash`.

#### 3.5.3 `WebhookSubscription`

- **Purpose:** Allows ShipFlow to push real-time events (e.g., "Task Completed", "Release Deployed") to customer-defined HTTP endpoints.
- **Relationships:** Many-to-One with `Organization`.
- **Lifecycle:** Active -> Disabled (due to consecutive failures).
- **Important Fields:** `id`, `orgId`, `url`, `secret`, `events` (Array of event types).

#### 3.5.4 `WorkflowRun`

- **Purpose:** Internal telemetry tracking for asynchronous Inngest jobs (e.g., the PRD Generation job). Crucial for debugging stalled AI processes.
- **Relationships:** Many-to-One with `Organization`.
- **Important Fields:** `id`, `orgId`, `jobName`, `status` (Running, Success, Failed), `payload` (JSONB), `errorLog`, `startedAt`, `completedAt`.

#### 3.5.5 `AuditLog`

- **Purpose:** Immutable ledger of every significant action taken within an Organization for compliance (SOC2, HIPAA).
- **Relationships:** Many-to-One with `Organization`, `Member` (Actor).
- **Lifecycle:** Append-only.
- **Important Fields:** `id`, `orgId`, `actorId`, `action` (e.g., "PRD_APPROVED", "MEMBER_REMOVED"), `targetEntity`, `targetEntityId`, `ipAddress`, `timestamp`.
- **Indexes:** Index on `(orgId, timestamp)`.

---
