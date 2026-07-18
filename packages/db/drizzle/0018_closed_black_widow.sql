ALTER TABLE "epics" DROP CONSTRAINT "epics_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "releases" DROP CONSTRAINT "releases_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;