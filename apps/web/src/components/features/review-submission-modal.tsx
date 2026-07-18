"use client";


import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "~/trpc/client";
import { CheckCircle2, AlertCircle, Circle, ArrowLeftRight, FileCode, CheckCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ReviewSubmissionModalProps {
  featureId: string;
  orgId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function ReviewSubmissionModal({ featureId, orgId, isOpen, onOpenChange, onComplete }: ReviewSubmissionModalProps) {
  const utils = trpc.useUtils();
  const { data: kanbanData, isLoading: isLoadingTasks } = trpc.task.getKanban.useQuery(
    { featureId, orgId },
    { enabled: isOpen }
  );

  const { data: findings, isLoading: isLoadingFindings } = trpc.feature.getReviewFindings.useQuery(
    { featureId, orgId },
    { enabled: isOpen }
  );

  const submitForReview = trpc.feature.submitForReview.useMutation({
    onSuccess: () => {
      toast.success("Submitted for review successfully");
      utils.task.getKanban.invalidate({ featureId, orgId });
      utils.feature.getById.invalidate({ id: featureId, orgId });
      onOpenChange(false);
      onComplete();
    },
    onError: (error) => {
      toast.error(`Failed to submit: ${error.message}`);
    }
  });

  const redoExecutionPlan = trpc.feature.redoExecutionPlan.useMutation({
    onSuccess: () => {
      toast.success("Execution plan reset. Tasks are ready for AI.");
      utils.task.getKanban.invalidate({ featureId, orgId });
      utils.feature.getById.invalidate({ id: featureId, orgId });
      onOpenChange(false);
      onComplete();
    },
    onError: (error) => {
      toast.error(`Failed to redo plan: ${error.message}`);
    }
  });

  if (isLoadingTasks || isLoadingFindings) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Submission Readiness</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const tasks = {
    todo: kanbanData?.TODO || [],
    inProgress: kanbanData?.IN_PROGRESS || [],
    done: kanbanData?.DONE || []
  };

  const unimplementedTasks = [...tasks.todo, ...tasks.inProgress];
  const approvedTasks = tasks.done;

  // Find findings that are blocking and still OPEN (if findings support statuses, else just map them)
  const openFindings = (findings || []).filter(f => f.status !== 'RESOLVED');
  const blockingFindings = openFindings.filter(f => f.isBlocking || f.severity === 'BLOCKER');

  const hasIssues = unimplementedTasks.length > 0 || blockingFindings.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-500" />
            Review Submission Readiness
          </DialogTitle>
          <DialogDescription>
            Check the status of tasks and previous PR review findings before submitting this feature for final review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          
          {/* PR Findings Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileCode className="w-4 h-4 text-orange-500" /> 
              PR Review Findings
              <Badge variant="outline" className="ml-2">{openFindings.length}</Badge>
            </h3>
            
            {openFindings.length === 0 ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                No pending PR review findings.
              </div>
            ) : (
              <div className="space-y-2">
                {openFindings.map((finding) => (
                  <div key={finding.id} className="p-3 bg-card border border-border/50 rounded-lg text-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-2">
                        {finding.isBlocking || finding.severity === 'BLOCKER' ? (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{finding.filePath} {finding.lineNumber && `(Line ${finding.lineNumber})`}</p>
                          <p className="text-muted-foreground mt-1">{finding.description}</p>
                        </div>
                      </div>
                      {(finding.isBlocking || finding.severity === 'BLOCKER') && <Badge variant="destructive">Blocking</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> 
                Not Implemented Tasks
                <Badge variant="outline" className="ml-2">{unimplementedTasks.length}</Badge>
              </h3>
              {unimplementedTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border border-border/50 rounded-lg bg-card/50">
                  All tasks are marked as DONE.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {unimplementedTasks.map((t: any) => (
                    <div key={t.id} className="p-3 bg-card border border-border/50 rounded-lg text-sm">
                      <p className="font-medium truncate">{t.title}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">{t.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                Approved Tasks (DONE)
                <Badge variant="outline" className="ml-2">{approvedTasks.length}</Badge>
              </h3>
              {approvedTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border border-border/50 rounded-lg bg-card/50">
                  No tasks have been completed yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {approvedTasks.map((t: any) => (
                    <div key={t.id} className="p-3 bg-card border border-border/50 rounded-lg text-sm opacity-70">
                      <p className="font-medium truncate">{t.title}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500">{t.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border/50 mt-6">
          <Button 
            variant="outline"
            onClick={() => redoExecutionPlan.mutate({ featureId, orgId })}
            disabled={redoExecutionPlan.isPending || submitForReview.isPending}
            className="text-amber-600 border-amber-600/30 hover:bg-amber-600/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {redoExecutionPlan.isPending ? "Resetting..." : "Redo Execution Plan"}
          </Button>

          <Button 
            onClick={() => submitForReview.mutate({ featureId, orgId })}
            disabled={submitForReview.isPending || redoExecutionPlan.isPending}
            className={hasIssues ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
          >
            {submitForReview.isPending ? (
              "Submitting..."
            ) : hasIssues ? (
              <>Submit with Warnings <ArrowLeftRight className="w-4 h-4 ml-2" /></>
            ) : (
              <>Submit for Final Review <CheckCircle2 className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
