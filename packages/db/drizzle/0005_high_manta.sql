CREATE TABLE "org_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "usage_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "usage_limit" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "renewal_date" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "resource_type" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "resource_id" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_url" text;--> statement-breakpoint
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;