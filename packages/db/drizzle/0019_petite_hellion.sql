ALTER TABLE "pull_requests" DROP CONSTRAINT "pull_requests_repository_id_repositories_id_fk";
--> statement-breakpoint
ALTER TABLE "pull_requests" DROP CONSTRAINT "pull_requests_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;