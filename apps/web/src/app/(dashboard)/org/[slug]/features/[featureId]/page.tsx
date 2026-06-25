"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { FeatureStatusBadge } from "@/components/features/feature-status-badge";
import { WorkflowStatus } from "@/components/features/workflow-status";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, CheckCircle2, Sparkles, LayoutList } from "lucide-react";
import Link from "next/link";

export default function FeatureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const featureId = params.featureId as string;

  const { data: org } = trpc.organization.getBySlug.useQuery({ slug });
  const { data: feature, isLoading, refetch } = trpc.feature.getById.useQuery(
    { featureId, orgId: org?.id! },
    { enabled: !!org?.id && !!featureId }
  );

  const generatePRD = trpc.feature.generatePRD.useMutation({
    onSuccess: () => refetch()
  });

  const generateTasks = trpc.feature.generateTasks.useMutation({
    onSuccess: () => refetch()
  });

  const approvePlan = trpc.feature.approvePlan.useMutation({
    onSuccess: () => refetch()
  });

  if (isLoading) return (
    <div className="flex items-center justify-center p-12">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  
  if (!feature) return (
    <div className="p-12 text-center text-muted-foreground">Feature not found</div>
  );

  const prd = feature.prds?.[0]?.currentVersion;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href={`/org/${slug}/features`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Features
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{feature.title}</h1>
            <FeatureStatusBadge status={feature.status} />
          </div>
          <p className="text-muted-foreground mt-2 text-sm flex items-center gap-2">
            <span>Created {new Date(feature.createdAt).toLocaleDateString()}</span>
            <span className="opacity-50">•</span>
            <span>Last updated {new Date(feature.updatedAt).toLocaleDateString()}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {(feature.status === "SUBMITTED" || feature.status === "CLARIFYING" || feature.status === "CLARIFIED") && (
            <Button
              onClick={() => generatePRD.mutate({ featureId, orgId: org!.id })}
              disabled={generatePRD.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatePRD.isPending ? "Generating..." : "Generate AI PRD"}
            </Button>
          )}

          {feature.status === "PRD_GENERATED" && (
            <Button
              onClick={() => generateTasks.mutate({ featureId, orgId: org!.id })}
              disabled={generateTasks.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            >
              <LayoutList className="w-4 h-4 mr-2" />
              {generateTasks.isPending ? "Generating..." : "Generate Tasks"}
            </Button>
          )}

          {feature.status === "TASKS_GENERATED" && (
            <Button
              onClick={() => approvePlan.mutate({ featureId, orgId: org!.id })}
              disabled={approvePlan.isPending}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {approvePlan.isPending ? "Approving..." : "Approve Plan"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="border-b border-border/50 bg-muted/20 px-4 py-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Description</h3>
            </div>
            <div className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {feature.rawDescription}
              </div>
            </div>
          </div>

          {prd && (
            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="border-b border-border/50 bg-muted/20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-medium text-sm">Generated PRD</h3>
                </div>
                <div className="text-xs text-muted-foreground">Version {prd.versionNumber}</div>
              </div>
              <div className="p-6">
                <pre className="text-xs font-mono bg-muted/30 p-4 rounded-lg overflow-auto border border-border/50">
                  {JSON.stringify(prd.content, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm p-6">
            <h3 className="font-medium text-sm mb-4">Workflow Timeline</h3>
            <WorkflowStatus featureId={feature.id} />
          </div>
        </div>
      </div>
      <div className="mt-8">
        <KanbanBoard featureId={feature.id} orgId={org!.id} />
      </div>
    </div>
  );
}
