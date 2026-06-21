## SECTION 4 — DATABASE DESIGN & DRIZZLE SCHEMA PLANNING

The database layer of ShipFlow AI is constructed on PostgreSQL, utilizing Drizzle ORM for extreme type-safety, rapid inference, and edge-compatibility. The schema design heavily emphasizes **Multi-Tenant Isolation**, **Data Immutability (Auditability)**, and **Referential Integrity**.

### 4.1 Schema Guiding Principles

1. **Tenant Isolation (RLS vs Application-Level):** Because ShipFlow AI utilizes connection pooling (e.g., PgBouncer) in a serverless Next.js environment, native PostgreSQL Row-Level Security (RLS) via `set_config` per transaction introduces high latency and connection state leakage risks. Therefore, ShipFlow relies on **Application-Level Tenant Isolation**. Every table containing tenant data _must_ have an `org_id` column. The `packages/services` layer enforces `.where(eq(table.orgId, ctx.orgId))` on _every_ single query.
2. **Soft Deletes:** Critical business entities (Projects, Epics, PRDs) are never hard-deleted. They use a `deleted_at` timestamp. This prevents cascading destruction of historical metrics and audit logs.
3. **UUIDs for Primary Keys:** All primary keys use `uuid` (specifically `uuidv4`) rather than auto-incrementing integers. This prevents enumeration attacks (e.g., guessing `/prds/5` -> `/prds/6`) and allows for decentralized ID generation before insertion.
4. **Timestamps:** Every table includes `created_at` and `updated_at`. The `updated_at` field is managed automatically by PostgreSQL triggers.

### 4.2 Drizzle Schema Definitions

Below is the literal `schema.ts` file structure defining the database.

```typescript
// packages/db/src/schema.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  pgEnum,
  uniqueIndex,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// --- ENUMS ---
export const billingPlanEnum = pgEnum("billing_plan", ["FREE", "PRO", "ENTERPRISE"]);
export const memberRoleEnum = pgEnum("member_role", ["OWNER", "ADMIN", "PM", "ENGINEER", "REVIEWER", "VIEWER"]);
export const projectStatusEnum = pgEnum("project_status", ["ACTIVE", "ARCHIVED"]);
export const featureRequestStatusEnum = pgEnum("fr_status", [
  "SUBMITTED",
  "CLARIFYING",
  "CLARIFIED",
  "REJECTED",
  "PRD_GENERATED",
  "SHIPPED",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
]);
export const taskDependencyTypeEnum = pgEnum("task_dependency_type", ["BLOCKS", "RELATES_TO"]);
export const prStateEnum = pgEnum("pr_state", [
  "OPEN",
  "DRAFT",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "MERGED",
  "CLOSED",
]);
export const reviewStateEnum = pgEnum("review_state", [
  "APPROVED",
  "CHANGES_REQUESTED",
  "COMMENTED",
]);
export const findingTypeEnum = pgEnum("finding_type", [
  "SECURITY",
  "PERFORMANCE",
  "ARCHITECTURE",
  "PRD_DEVIATION",
]);

// --- 1. ORGANIZATIONS ---
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    billingPlan: billingPlanEnum("billing_plan").default("FREE").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => {
    return {
      slugIdx: uniqueIndex("org_slug_idx").on(table.slug),
      stripeIdx: index("org_stripe_idx").on(table.stripeCustomerId),
    };
  },
);

// --- 2. USERS & MEMBERS (Integration with BetterAuth) ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("VIEWER").notNull(),
    status: text("status").default("ACTIVE").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      orgUserUnique: uniqueIndex("member_org_user_idx").on(table.orgId, table.userId),
    };
  },
);

// --- 3. PROJECTS ---
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: projectStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      orgIdx: index("project_org_idx").on(table.orgId),
    };
  },
);

// --- 4. REPOSITORIES ---
export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  githubRepoId: text("github_repo_id").notNull().unique(),
  fullName: text("full_name").notNull(), // e.g., "acme/backend"
  defaultBranch: text("default_branch").default("main").notNull(),
  isPrivate: boolean("is_private").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectRepositories = pgTable(
  "project_repositories",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: uniqueIndex("project_repo_pk").on(table.projectId, table.repositoryId),
    };
  },
);

// --- 5. FEATURE REQUESTS ---
export const featureRequests = pgTable("feature_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => members.id),
  title: text("title").notNull(),
  rawDescription: text("raw_description").notNull(), // Immutable initial prompt
  status: featureRequestStatusEnum("status").default("SUBMITTED").notNull(),
  businessValueScore: integer("business_value_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- 6. CLARIFICATION THREADS (AI Interaction) ---
export const clarificationThreads = pgTable("clarification_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  featureRequestId: uuid("feature_request_id")
    .notNull()
    .references(() => featureRequests.id, { onDelete: "cascade" }),
  isResolved: boolean("is_resolved").default(false).notNull(),
  metadata: jsonb("metadata"), // Extracted facts by AI
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clarificationMessages = pgTable("clarification_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => clarificationThreads.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(), // 'USER' | 'AI' | 'SYSTEM'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- 7. PRDs (Product Requirements Documents) ---
export const prds = pgTable("prds", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  featureRequestId: uuid("feature_request_id")
    .notNull()
    .references(() => featureRequests.id),
  status: text("status").default("DRAFT").notNull(), // DRAFT, REVIEW, APPROVED
  currentVersionId: uuid("current_version_id"), // Self-referential FK added later
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prdVersions = pgTable(
  "prd_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prdId: uuid("prd_id")
      .notNull()
      .references(() => prds.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => members.id), // Can be System AI User
    versionNumber: integer("version_number").notNull(),
    content: jsonb("content").notNull(), // Structured PRD blocks
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      versionUnique: uniqueIndex("prd_version_unique").on(table.prdId, table.versionNumber),
    };
  },
);

// --- 8. EPICS & TASKS ---
export const epics = pgTable("epics", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  prdId: uuid("prd_id")
    .notNull()
    .references(() => prds.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: taskStatusEnum("status").default("TODO").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  epicId: uuid("epic_id")
    .notNull()
    .references(() => epics.id, { onDelete: "cascade" }),
  assigneeId: uuid("assignee_id").references(() => members.id),
  title: text("title").notNull(),
  technicalImplementationDetails: text("technical_implementation_details").notNull(), // AI Generated
  status: taskStatusEnum("status").default("BACKLOG").notNull(),
  estimationPoints: integer("estimation_points"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subtasks = pgTable("subtasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
});

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dependentTaskId: uuid("dependent_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    dependsOnTaskId: uuid("depends_on_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    type: taskDependencyTypeEnum("type").default("BLOCKS").notNull(),
  },
  (table) => {
    return {
      uniqueDep: uniqueIndex("task_dep_unique").on(table.dependentTaskId, table.dependsOnTaskId),
    };
  },
);

// --- 9. PULL REQUESTS & AI REVIEWS ---
export const pullRequests = pgTable(
  "pull_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    githubPrNumber: integer("github_pr_number").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    state: prStateEnum("state").notNull(),
    headSha: text("head_sha").notNull(),
    baseBranch: text("base_branch").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      repoPrUnique: uniqueIndex("pr_repo_number_unique").on(
        table.repositoryId,
        table.githubPrNumber,
      ),
    };
  },
);

export const pullRequestReviews = pgTable("pull_request_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  pullRequestId: uuid("pull_request_id")
    .notNull()
    .references(() => pullRequests.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").references(() => members.id), // Null if AI
  isAiReview: boolean("is_ai_review").default(false).notNull(),
  state: reviewStateEnum("state").notNull(),
  commitSha: text("commit_sha").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewFindings = pgTable("review_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => pullRequestReviews.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
  lineNumber: integer("line_number"),
  findingType: findingTypeEnum("finding_type").notNull(),
  description: text("description").notNull(),
  suggestion: text("suggestion"), // Suggested code block
  status: text("status").default("OPEN").notNull(), // OPEN, ADDRESSED, IGNORED
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  pullRequestId: uuid("pull_request_id")
    .notNull()
    .references(() => pullRequests.id, { onDelete: "cascade" }),
  approverId: uuid("approver_id")
    .notNull()
    .references(() => members.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  signature: text("signature").notNull(),
});

// --- 10. OPERATIONS & AUDIT ---
export const releases = pgTable("releases", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  version: text("version").notNull(),
  releaseNotes: text("release_notes"),
  deployedAt: timestamp("deployed_at"),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => members.id),
  action: text("action").notNull(),
  targetEntity: text("target_entity").notNull(), // e.g., 'PRD', 'TASK'
  targetEntityId: uuid("target_entity_id").notNull(),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
```

### 4.3 Drizzle Relations (Relational Queries)

To enable Drizzle's powerful nested query API (`db.query.organizations.findMany({ with: { projects: true } })`), we define relation mappings:

```typescript
// packages/db/src/relations.ts
import { relations } from "drizzle-orm";
import * as schema from "./schema";

export const organizationRelations = relations(schema.organizations, ({ many }) => ({
  members: many(schema.members),
  projects: many(schema.projects),
  featureRequests: many(schema.featureRequests),
  auditLogs: many(schema.auditLogs),
}));

export const taskRelations = relations(schema.tasks, ({ one, many }) => ({
  epic: one(schema.epics, { fields: [schema.tasks.epicId], references: [schema.epics.id] }),
  assignee: one(schema.members, {
    fields: [schema.tasks.assigneeId],
    references: [schema.members.id],
  }),
  subtasks: many(schema.subtasks),
  pullRequests: many(schema.pullRequests),
  dependencies: many(schema.taskDependencies, { relationName: "task_to_dependencies" }),
}));

export const pullRequestRelations = relations(schema.pullRequests, ({ one, many }) => ({
  task: one(schema.tasks, { fields: [schema.pullRequests.taskId], references: [schema.tasks.id] }),
  repository: one(schema.repositories, {
    fields: [schema.pullRequests.repositoryId],
    references: [schema.repositories.id],
  }),
  reviews: many(schema.pullRequestReviews),
}));

export const reviewRelations = relations(schema.pullRequestReviews, ({ one, many }) => ({
  pullRequest: one(schema.pullRequests, {
    fields: [schema.pullRequestReviews.pullRequestId],
    references: [schema.pullRequests.id],
  }),
  findings: many(schema.reviewFindings),
}));
```

### 4.4 Repository Pattern and Data Access Strategies

ShipFlow AI enforces the **Repository Pattern** within `packages/services`. The tRPC routers or background jobs never invoke Drizzle directly.

**Example Repository Interface:**

```typescript
// packages/services/src/repositories/TaskRepository.ts
import { db } from "@shipflow/db";
import { tasks, eq, and } from "@shipflow/db/schema";

export class TaskRepository {
  static async getTasksForEpic(orgId: string, epicId: string) {
    // 1. ALWAYS enforce orgId for tenant isolation
    return await db.query.tasks.findMany({
      where: and(eq(tasks.orgId, orgId), eq(tasks.epicId, epicId)),
      with: {
        subtasks: true,
        assignee: {
          with: { user: true },
        },
      },
    });
  }

  static async createTask(data: typeof tasks.$inferInsert, tx?: typeof db) {
    const client = tx || db;
    return await client.insert(tasks).values(data).returning();
  }
}
```

**Migration Strategy:**
ShipFlow AI uses Drizzle Kit to generate SQL migrations (`pnpm drizzle-kit generate:pg`). Migrations are strictly applied during the CI/CD pipeline deployment phase using a dedicated GitHub Actions step (`drizzle-kit push` or `migrate`), preventing application servers from colliding during schema updates. The database user utilized by the Next.js application _does not_ have `ALTER TABLE` privileges; only the migration CI runner possesses DDL capabilities.
