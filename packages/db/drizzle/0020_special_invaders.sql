ALTER TABLE "review_findings" ALTER COLUMN "finding_type" SET DATA TYPE text;--> statement-breakpoint
UPDATE "review_findings" SET "finding_type" = 'TASK_DEVIATION' WHERE "finding_type" = 'PRD_DEVIATION';--> statement-breakpoint
DROP TYPE "public"."finding_type";--> statement-breakpoint
CREATE TYPE "public"."finding_type" AS ENUM('SECURITY', 'PERFORMANCE', 'ARCHITECTURE', 'TASK_DEVIATION', 'CODE_QUALITY', 'EDGE_CASE', 'TEST_COVERAGE');--> statement-breakpoint
ALTER TABLE "review_findings" ALTER COLUMN "finding_type" SET DATA TYPE "public"."finding_type" USING "finding_type"::"public"."finding_type";