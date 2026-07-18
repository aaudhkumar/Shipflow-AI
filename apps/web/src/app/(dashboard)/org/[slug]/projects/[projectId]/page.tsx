"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import Link from "next/link";
import { FeatureStatusBadge } from "@/components/features/feature-status-badge";
import { SourceChannelBadge } from "@/components/features/source-channel-badge";
import { Button } from "@/components/ui/button";
import { Plus, Inbox, ArrowLeft, FolderGit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { ManageProjectMembersDialog } from "@/components/projects/manage-members-dialog";
import { ProjectDocumentDialog } from "@/components/projects/project-document-dialog";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const projectId = params.projectId as string;

  const { data: org } = trpc.organization.getBySlug.useQuery({ slug });
  
  const { data: project, isLoading: isProjectLoading } = trpc.project.getById.useQuery(
    { orgId: org?.id!, projectId }, 
    { 
      enabled: !!org?.id && !!projectId,
      refetchInterval: (query) => (query.state.data?.contextDocument ? false : 3000),
    }
  );

  const { data: features, isLoading: isFeaturesLoading } = trpc.feature.list.useQuery(
    { orgId: org?.id!, projectId },
    { enabled: !!org?.id && !!projectId }
  );

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      router.push(`/org/${slug}/projects`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete project");
    }
  });

  const [channelFilter, setChannelFilter] = useState("ALL");

  const filteredFeatures = features?.filter((feature: any) => {
    if (channelFilter === "ALL") return true;
    return feature.sourceChannel === channelFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href={`/org/${slug}/projects`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Link>
        </Button>
      </div>

      {isProjectLoading ? (
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      ) : project ? (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <FolderGit2 className="w-8 h-8 text-primary flex-shrink-0" />
              <h1 className="text-3xl font-bold tracking-tight line-clamp-2" title={project.name}>{project.name}</h1>
              <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 max-w-3xl whitespace-pre-wrap max-h-[10rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {project.description || "No description provided."}
            </p>
          </div>
          {org && (
            <div className="flex items-center gap-3">
              <ProjectDocumentDialog 
                projectName={project.name} 
                contextDocument={project.contextDocument}
                projectId={project.id}
                orgId={org.id}
              />
              <ManageProjectMembersDialog 
                orgId={org.id} 
                projectId={project.id} 
                projectName={project.name}
                currentMemberIds={project.members?.map((m: any) => m.memberId) || []}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={deleteProject.isPending}
                className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Delete Project"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this project? This will also delete all associated feature requests and tasks.")) {
                    deleteProject.mutate({ orgId: org!.id, projectId: project.id });
                  }
                }}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-red-500">Project not found.</div>
      )}

      <div className="pt-6 border-t border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Project Features</h2>
            <p className="text-muted-foreground mt-1">
              Features grouped under this project.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="ALL">All Channels</option>
              <option value="IN_APP">In-App</option>
              <option value="EMAIL">Email</option>
              <option value="TICKET">Ticket</option>
              <option value="CALL">Call</option>
            </select>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all">
              <Link href={`/org/${slug}/features/new?projectId=${projectId}`}>
                <Plus className="w-4 h-4 mr-2" /> New Feature
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Title</th>
                  <th scope="col" className="px-6 py-4 font-medium">Channel</th>
                  <th scope="col" className="px-6 py-4 font-medium">Status</th>
                  <th scope="col" className="px-6 py-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isFeaturesLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Loading features...
                      </div>
                    </td>
                  </tr>
                ) : filteredFeatures?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                          <Inbox className="w-6 h-6 opacity-50" />
                        </div>
                        <p>No features found in this project. Create one to get started!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFeatures?.map((feature: any) => (
                    <tr 
                      key={feature.id} 
                      onClick={() => router.push(`/org/${slug}/features/${feature.id}`)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </td>
                      <td className="px-6 py-4">
                        <SourceChannelBadge channel={feature.sourceChannel as any} />
                      </td>
                      <td className="px-6 py-4">
                        <FeatureStatusBadge status={feature.status} hasIssue={feature.githubIssues && feature.githubIssues.length > 0} />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(feature.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
