import { pgTable, text, timestamp, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { projectStatusEnum } from "./enums";

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    orgId: text("org_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
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

export const repositories = pgTable("repositories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  githubRepoId: text("github_repo_id").notNull().unique(),
  fullName: text("full_name").notNull(), // e.g., "acme/backend"
  defaultBranch: text("default_branch").default("main").notNull(),
  isPrivate: boolean("is_private").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectRepositories = pgTable(
  "project_repositories",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: uniqueIndex("project_repo_pk").on(table.projectId, table.repositoryId),
    };
  },
);
