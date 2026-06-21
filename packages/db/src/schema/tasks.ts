import { pgTable, text, timestamp, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { workspaces, workspaceMembers } from "./workspaces";
import { projects } from "./projects";
import { prds } from "./prds";
import { taskStatusEnum, taskDependencyTypeEnum } from "./enums";

export const epics = pgTable("epics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
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
    .references(() => workspaces.id, { onDelete: "cascade" }),
  epicId: text("epic_id")
    .notNull()
    .references(() => epics.id, { onDelete: "cascade" }),
  assigneeId: text("assignee_id").references(() => workspaceMembers.id),
  title: text("title").notNull(),
  technicalImplementationDetails: text("technical_implementation_details").notNull(),
  status: taskStatusEnum("status").default("BACKLOG").notNull(),
  estimationPoints: integer("estimation_points"),
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
