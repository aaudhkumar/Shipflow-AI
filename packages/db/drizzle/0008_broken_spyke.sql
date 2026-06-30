CREATE TABLE "release_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"repository_id" text NOT NULL,
	"github_release_id" integer,
	"tag_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "release_notes" ADD CONSTRAINT "release_notes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_notes" ADD CONSTRAINT "release_notes_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;