CREATE TYPE "public"."task_execution_status" AS ENUM('not_started', 'ready', 'claimed', 'in_progress', 'done', 'failed', 'blocked');--> statement-breakpoint
CREATE TABLE "task_tool_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"input_redacted" jsonb NOT NULL,
	"output_summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "execution_status" "task_execution_status" DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "claimed_by_run_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "claimed_at" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "branch_name" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "commit_sha" text;--> statement-breakpoint
ALTER TABLE "task_tool_calls" ADD CONSTRAINT "task_tool_calls_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;