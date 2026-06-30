"use client";

import { useParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { FolderGit2, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: org } = trpc.organization.getBySlug.useQuery({ slug });
  const { data: projects, isLoading, refetch } = trpc.project.list.useQuery(
    { orgId: org?.id! },
    { enabled: !!org?.id }
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Group your feature requests and manage connected repositories and contributors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {org && <CreateProjectDialog orgId={org.id} orgSlug={slug} onSuccess={() => refetch()} />}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderGit2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight mb-2">No projects found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Create your first project to start grouping features, linking repositories, and collaborating with your team.
          </p>
          {org && <CreateProjectDialog orgId={org.id} orgSlug={slug} onSuccess={() => refetch()} />}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project: any) => (
            <Link key={project.id} href={`/org/${slug}/projects/${project.id}`}>
              <Card className="group overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-1">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {project.name}
                  </CardTitle>
                  <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                    {project.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {project.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {/* Note: In a full app, we would include repo count in the project.list query result. 
                      Since our list query includes members, we can show that. */}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{project.members?.length || 0} Contributors</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
