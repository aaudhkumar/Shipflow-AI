import { pgTable, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { organizations, members } from "./organizations";
import { projects, repositories } from "./projects";

export const releases = pgTable("releases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  version: text("version").notNull(),
  releaseNotes: text("release_notes"),
  deployedAt: timestamp("deployed_at"),
});

export const releaseNotes = pgTable("release_notes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  repositoryId: text("repository_id")
    .notNull()
    .references(() => repositories.id, { onDelete: "cascade" }),
  githubReleaseId: integer("github_release_id"),
  tagName: text("tag_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  actorId: text("actor_id")
    .references(() => members.id),
  action: text("action").notNull(),
  targetEntity: text("target_entity").notNull(), // e.g., 'PRD', 'TASK'
  targetEntityId: text("target_entity_id").notNull(),
  metadata: jsonb("metadata").default({}),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
