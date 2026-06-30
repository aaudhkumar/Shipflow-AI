"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  label: string;
  completed: boolean;
  isError?: boolean;
}

export function WorkflowStatus({ featureId }: { featureId: string }) {
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/workflow-status/${featureId}`);
        const data = await res.json();
        if (data.timeline) {
          setTimeline(data.timeline);
        }
      } catch (error) {
        console.error("Failed to fetch workflow status", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Poll every 3 seconds to update the workflow status
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [featureId]);

  if (loading && timeline.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div >
      {timeline.map((step, index) => {
        const isCurrent = step.completed && (index < timeline.length - 1 && !timeline[index + 1]?.completed);
        const isPast = step.completed && !isCurrent;
        
        return (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center mt-0.5">
              {step.isError ? (
                <XCircle className="w-5 h-5 text-destructive" />
              ) : isPast ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/30" />
              )}
              {index < timeline.length - 1 && (
                <div className={cn(
                  "w-0.5 h-6 my-1 rounded-full",
                  step.completed && !step.isError ? "bg-emerald-500/50" : "bg-muted-foreground/20"
                )} />
              )}
            </div>
            <div className={cn(
              "text-sm font-medium",
              isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.label}
              {step.isError && <p className="text-xs text-destructive font-normal mt-0.5">Blocked: Fixes required</p>}
            </div>
          </div>
        );
      })}

      {/* Release Notes section */}
      <ReleaseNotes featureId={featureId} />
    </div>
  );
}

import { trpc } from "~/trpc/client";

function ReleaseNotes({ featureId }: { featureId: string }) {
  const params = useParams();
  const orgId = params.orgId as string || params.slug as string; // Quick hack to get orgId/slug since we only pass featureId

  const { data: org } = trpc.organization.getBySlug.useQuery({ slug: orgId }, { enabled: !!orgId });
  
  const { data: readiness } = trpc.feature.getReleaseReadiness.useQuery(
    { featureId, orgId: org?.id! },
    { enabled: !!org?.id && !!featureId }
  );

  if (!readiness?.releaseNotes) return null;

  return (
    <div className="mt-6 pt-6 border-t border-border/50">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
        <CheckCircle2 className="w-4 h-4" />
        Release Notes Generated
      </h4>
      <div className="text-xs prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-4 rounded-lg border border-border/50">
        {readiness.releaseNotes}
      </div>
    </div>
  );
}
