ALTER TABLE "pull_requests" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "author_login" text;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "merged_at" timestamp;