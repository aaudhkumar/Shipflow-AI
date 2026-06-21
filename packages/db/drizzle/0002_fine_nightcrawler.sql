ALTER TYPE "public"."finding_type" ADD VALUE 'CODE_QUALITY';--> statement-breakpoint
ALTER TYPE "public"."finding_type" ADD VALUE 'EDGE_CASE';--> statement-breakpoint
ALTER TYPE "public"."finding_type" ADD VALUE 'TEST_COVERAGE';--> statement-breakpoint
ALTER TYPE "public"."member_role" ADD VALUE 'REVIEWER' BEFORE 'VIEWER';--> statement-breakpoint
ALTER TABLE "feature_requests" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "feature_requests" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::text;--> statement-breakpoint
DROP TYPE "public"."fr_status";--> statement-breakpoint
CREATE TYPE "public"."fr_status" AS ENUM('SUBMITTED', 'CLARIFYING', 'CLARIFIED', 'PRD_GENERATED', 'TASKS_GENERATED', 'PLAN_APPROVED', 'IN_DEVELOPMENT', 'IN_REVIEW', 'FIX_NEEDED', 'AWAITING_HUMAN_APPROVAL', 'SHIPPED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "feature_requests" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::"public"."fr_status";--> statement-breakpoint
ALTER TABLE "feature_requests" ALTER COLUMN "status" SET DATA TYPE "public"."fr_status" USING "status"::"public"."fr_status";--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "feature_request_id" text;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_feature_request_id_feature_requests_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_requests"("id") ON DELETE cascade ON UPDATE no action;