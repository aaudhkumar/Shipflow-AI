import { pgTable, text, timestamp, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations, members } from "./organizations";
import { featureRequests } from "./features";

export const prds = pgTable("prds", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  featureRequestId: text("feature_request_id")
    .notNull()
    .references(() => featureRequests.id, { onDelete: "cascade" }),
  status: text("status").default("DRAFT").notNull(),
  currentVersionId: text("current_version_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prdVersions = pgTable(
  "prd_versions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    prdId: text("prd_id")
      .notNull()
      .references(() => prds.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => members.id),
    versionNumber: integer("version_number").notNull(),
    content: jsonb("content").notNull(),
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      versionUnique: uniqueIndex("prd_version_unique").on(table.prdId, table.versionNumber),
    };
  },
);
