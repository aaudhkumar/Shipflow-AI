import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { repositories } from "./projects";
import { deploymentStatusEnum } from "./enums";

export const deployments = pgTable(
  "deployments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    environment: text("environment").notNull(), // e.g., "production", "preview"
    commitSha: text("commit_sha").notNull(),
    status: deploymentStatusEnum("status").default("PENDING").notNull(),
    deploymentUrl: text("deployment_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      repoIdx: index("deployment_repo_idx").on(table.repositoryId),
      envIdx: index("deployment_env_idx").on(table.environment),
    };
  }
);
