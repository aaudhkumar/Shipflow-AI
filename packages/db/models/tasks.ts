import { pgTable, text, timestamp, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations, members } from "./organizations";
import { projects } from "./projects";
import { prds } from "./prds";
import { taskStatusEnum, taskDependencyTypeEnum, taskExecutionStatusEnum } from "./enums";

export const epics = pgTable("epics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  prdId: text("prd_id")
    .notNull()
    .references(() => prds.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: taskStatusEnum("status").default("TODO").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  epicId: text("epic_id")
    .notNull()
    .references(() => epics.id, { onDelete: "cascade" }),
  assigneeId: text("assignee_id").references(() => members.id),
  title: text("title").notNull(),
  technicalImplementationDetails: text("technical_implementation_details").notNull(),
  status: taskStatusEnum("status").default("BACKLOG").notNull(),
  estimationPoints: integer("estimation_points"),
  executionStatus: taskExecutionStatusEnum("execution_status").default("not_started").notNull(),
  claimedByRunId: text("claimed_by_run_id"),
  claimedAt: timestamp("claimed_at"),
  attemptCount: integer("attempt_count").default(0).notNull(),
  lastError: text("last_error"),
  branchName: text("branch_name"),
  commitSha: text("commit_sha"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subtasks = pgTable("subtasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
});

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    dependentTaskId: text("dependent_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    dependsOnTaskId: text("depends_on_task_id")
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
