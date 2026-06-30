CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "github_issue_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"issue_id" text NOT NULL,
	"github_comment_id" integer NOT NULL,
	"body" text,
	"author_login" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"repository_id" text NOT NULL,
	"issue_number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"state" text DEFAULT 'open' NOT NULL,
	"author_login" text,
	"feature_request_id" text,
	"opened_at" timestamp NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_issue_comments" ADD CONSTRAINT "github_issue_comments_issue_id_github_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."github_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_issues" ADD CONSTRAINT "github_issues_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_issues" ADD CONSTRAINT "github_issues_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_issues" ADD CONSTRAINT "github_issues_feature_request_id_feature_requests_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_issue_comments_issue_comment_unique" ON "github_issue_comments" USING btree ("issue_id","github_comment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_issues_repo_issue_unique" ON "github_issues" USING btree ("repository_id","issue_number");