ALTER TYPE "public"."fr_status" ADD VALUE 'EXECUTION_PLAN_GENERATED' BEFORE 'TASKS_GENERATED';--> statement-breakpoint
ALTER TABLE "prds" DROP CONSTRAINT "prds_feature_request_id_feature_requests_id_fk";
--> statement-breakpoint
ALTER TABLE "epics" DROP CONSTRAINT "epics_prd_id_prds_id_fk";
--> statement-breakpoint
ALTER TABLE "feature_requests" ADD COLUMN "execution_plan" text;--> statement-breakpoint
ALTER TABLE "prds" ADD CONSTRAINT "prds_feature_request_id_feature_requests_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_prd_id_prds_id_fk" FOREIGN KEY ("prd_id") REFERENCES "public"."prds"("id") ON DELETE cascade ON UPDATE no action;