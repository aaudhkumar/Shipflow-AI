import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { tasks } from "./tasks";

export const taskToolCalls = pgTable("task_tool_calls", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  inputRedacted: jsonb("input_redacted").notNull(),
  outputSummary: text("output_summary").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
