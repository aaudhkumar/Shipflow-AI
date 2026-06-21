import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizations, members } from "./organizations";
import { projects } from "./projects";

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

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  actorId: text("actor_id")
    .notNull()
    .references(() => members.id),
  action: text("action").notNull(),
  targetEntity: text("target_entity").notNull(), // e.g., 'PRD', 'TASK'
  targetEntityId: text("target_entity_id").notNull(),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
