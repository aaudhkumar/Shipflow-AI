ALTER TABLE "review_findings" ADD COLUMN "is_blocking" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "review_findings" ADD COLUMN "severity" text DEFAULT 'SUGGESTION' NOT NULL;--> statement-breakpoint
CREATE INDEX "feature_requests_org_idx" ON "feature_requests" USING btree ("org_id");