ALTER TABLE "organizations" ADD COLUMN "is_autopilot_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "fixes_prompt" text;