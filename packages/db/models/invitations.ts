import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const orgInvitations = pgTable("org_invitations", {
  id: text("id").primaryKey(), // We use crypto.randomUUID() for inserts
  orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("MEMBER"),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("PENDING"), // PENDING | ACCEPTED | REVOKED | EXPIRED
  invitedByUserId: text("invited_by_user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  acceptedAt: timestamp("accepted_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
