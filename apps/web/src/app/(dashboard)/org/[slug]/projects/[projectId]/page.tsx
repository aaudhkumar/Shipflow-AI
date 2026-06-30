"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import Link from "next/link";
import { FeatureStatusBadge } from "@/components/features/feature-status-badge";
import { SourceChannelBadge } from "@/components/features/source-channel-badge";
import { Button } from "@/components/ui/button";
import { Plus, Inbox, ArrowLeft, FolderGit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const projectId = params.projectId as string;

  const { data: org } = trpc.organization.getBySlug.useQuery({ slug });
  
  const { data: project, isLoading: isProjectLoading } = trpc.project.getById.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: features, isLoading: isFeaturesLoading } = trpc.feature.list.useQuery(
    { orgId: org?.id!, projectId },
    { enabled: !!org?.id && !!projectId }
  );

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"} className="ml-2">
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              {project.description || "No description provided."}
            </p>
          </div>
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
                        <FeatureStatusBadge status={feature.status} />
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
