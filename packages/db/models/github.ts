import { pgTable, text, timestamp, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations, members } from "./organizations";
import { repositories } from "./projects";
import { featureRequests } from "./features";
import { tasks } from "./tasks";
import { prStateEnum, reviewStateEnum, findingTypeEnum } from "./enums";

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id),
    featureRequestId: text("feature_request_id")
      .references(() => featureRequests.id, { onDelete: "cascade" }),
    taskId: text("task_id")
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pullRequestId: text("pull_request_id")
    .notNull()
    .references(() => pullRequests.id, { onDelete: "cascade" }),
  reviewerId: text("reviewer_id").references(() => members.id), // Null if AI
  isAiReview: boolean("is_ai_review").default(false).notNull(),
  state: reviewStateEnum("state").notNull(),
  commitSha: text("commit_sha").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewFindings = pgTable("review_findings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  reviewId: text("review_id")
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
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pullRequestId: text("pull_request_id")
    .notNull()
    .references(() => pullRequests.id, { onDelete: "cascade" }),
  approverId: text("approver_id")
    .notNull()
    .references(() => members.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  signature: text("signature").notNull(),
});
