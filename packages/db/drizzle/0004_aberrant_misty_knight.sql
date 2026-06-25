CREATE TABLE "release_readiness" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_request_id" text NOT NULL,
	"is_ready" boolean NOT NULL,
	"overall_score" integer NOT NULL,
	"blockers" jsonb,
	"warnings" jsonb,
	"recommendation" text,
	"release_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "release_readiness" ADD CONSTRAINT "release_readiness_feature_request_id_feature_requests_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;