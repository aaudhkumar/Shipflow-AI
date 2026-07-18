"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { FeatureStatusBadge } from "@/components/features/feature-status-badge";
import { SourceChannelBadge } from "@/components/features/source-channel-badge";
import { WorkflowStatus } from "@/components/features/workflow-status";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { PRDViewer } from "@/components/prd/prd-viewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, CheckCircle2, Sparkles, LayoutList, Printer, Trash2, Code2, RotateCcw, BookOpen } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RelatedIssuesPanel } from "@/components/features/related-issues-panel";
import { LinkPRInstructions } from "@/components/features/link-pr-instructions";
import { ClarificationModal } from "@/components/features/clarification-modal";
import { ReviewSubmissionModal } from "@/components/features/review-submission-modal";
import { BackgroundJobTracker } from "@/components/ui/background-job-tracker";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpandableContent } from "@/components/ui/expandable-content";
import { ExecutionPlanEditor } from "@/components/features/execution-plan-editor";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from "@/components/ui/badge";
import { ShieldCheck, RefreshCw } from "lucide-react";

function ReleaseReadinessViewer({ featureId, orgId }: { featureId: string, orgId: string }) {
  const [isPolling, setIsPolling] = useState(false);
  const [lastReadinessId, setLastReadinessId] = useState<string | null>(null);
  
  const utils = trpc.useUtils();
  const { data: readiness, isLoading, isFetching } = trpc.feature.getReleaseReadiness.useQuery(
    { featureId, orgId },
    { refetchInterval: isPolling ? 3000 : false }
  );

  React.useEffect(() => {
    if (isPolling && readiness && lastReadinessId && readiness.id !== lastReadinessId) {
      setIsPolling(false);
      toast.success("Release readiness check completed!");
    }
  }, [isPolling, readiness, lastReadinessId]);

  const refreshMutation = trpc.feature.refreshReleaseReadiness.useMutation({
    onSuccess: () => {
      toast.info("Triggered release readiness check. This may take a minute.");
      if (readiness) setLastReadinessId(readiness.id);
      setIsPolling(true);
    },
    onError: (err) => {
      toast.error(`Failed to trigger: ${err.message}`);
      setIsPolling(false);
    }
  });
  
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!readiness) return null;
  
  return (
    <div className="w-full print:hidden mb-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> 
              Release Readiness Verdict
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refreshMutation.mutate({ featureId, orgId })}
              disabled={refreshMutation.isPending || isPolling}
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(refreshMutation.isPending || isPolling) ? "animate-spin" : ""}`} />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
          <Badge variant={readiness.isReady ? "default" : "destructive"}>
            Score: {readiness.overallScore}/100
          </Badge>
        </div>
        <p className="text-sm font-medium">{readiness.recommendation}</p>
        
        <div className="flex flex-col space-y-4 mt-4">
          {readiness.blockers && readiness.blockers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-destructive">Blockers</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {readiness.blockers.map((b: string, i: number) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}
          {readiness.warnings && readiness.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-500">Warnings</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {readiness.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {readiness.releaseNotes && (
        <ExpandableContent
          title="Release Notes"
          icon={<BookOpen className="w-4 h-4 text-purple-500" />}
          contentToCopy={readiness.releaseNotes}
          copyLabel="Copy Notes"
          copiedLabel="Copied Notes"
          maxHeight="400px"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {readiness.releaseNotes}
            </ReactMarkdown>
          </div>
        </ExpandableContent>
      )}
    </div>
  );
}

// Old ExecutionPlanViewer removed since we use ExecutionPlanEditor directly now.

export default function FeatureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();
  const slug = params.slug as string;
  const featureId = params.featureId as string;

  const { data: org } = trpc.organization.getBySlug.useQuery({ slug });
  const [isGeneratingPRD, setIsGeneratingPRD] = useState(false);
  const [isGeneratingExecutionPlan, setIsGeneratingExecutionPlan] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isStartingClarification, setIsStartingClarification] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: feature, isLoading, refetch } = trpc.feature.getById.useQuery(
    { featureId, orgId: org?.id! },
    { 
      enabled: !!org?.id && !!featureId,
      // Poll every 3 seconds if we're waiting for a background job to complete
      refetchInterval: (isGeneratingPRD || isGeneratingExecutionPlan || isGeneratingTasks || isStartingClarification) ? 3000 : false
    }
  );
  
  const { data: currentMember } = trpc.member.me.useQuery(
    { orgId: org?.id! },
    { enabled: !!org?.id }
  );

  // Clear or set tracking state based on feature status
  React.useEffect(() => {
    if (!feature) return;
    
    // Check if clarifier is running (in CLARIFYING state and waiting for AI)
    const messages = feature.clarificationThreads?.[0]?.messages;
    const isClarifying = feature.status === 'CLARIFYING' && 
      (!messages?.length || messages[messages.length - 1]?.sender !== 'AI_QUESTIONS');
       
    if (isClarifying && !isStartingClarification) {
      setIsStartingClarification(true);
    } else if (!isClarifying && isStartingClarification) {
      setIsStartingClarification(false);
    }

    if (feature.status === 'PRD_GENERATED' && isGeneratingPRD) setIsGeneratingPRD(false);
    if (feature.status === 'EXECUTION_PLAN_GENERATED' && isGeneratingExecutionPlan) setIsGeneratingExecutionPlan(false);
    if (feature.status === 'TASKS_GENERATED' && isGeneratingTasks) {
      setIsGeneratingTasks(false);
      utils.task.getKanban.invalidate({ featureId, orgId: org!.id });
    }
  }, [feature?.status, feature?.clarificationThreads, isStartingClarification, isGeneratingPRD, isGeneratingExecutionPlan, isGeneratingTasks]);

  const generatePRD = trpc.feature.generatePRD.useMutation({
    onMutate: () => setIsGeneratingPRD(true),
    onSuccess: () => refetch()
  });

  const startClarification = trpc.feature.startClarification.useMutation({
    onMutate: () => setIsStartingClarification(true),
    onSuccess: () => refetch(),
    onError: (error) => {
      setIsStartingClarification(false);
      toast.error(`Failed to start AI Clarifier: ${error.message}`);
    }
  });

  const generateExecutionPlan = trpc.feature.generateExecutionPlan.useMutation({
    onMutate: () => setIsGeneratingExecutionPlan(true),
    onSuccess: () => refetch()
  });

  const generateTasks = trpc.feature.generateTasks.useMutation({
    onMutate: () => setIsGeneratingTasks(true),
    onSuccess: () => refetch()
  });

  const approvePlan = trpc.feature.approvePlan.useMutation({
    onSuccess: () => refetch()
  });



  const approveForDev = trpc.taskExecution.approveForDevelopment.useMutation({
    onSuccess: () => {
      toast.success("Tasks approved for AI implementation");
      refetch();
      utils.task.getKanban.invalidate({ featureId, orgId: org!.id });
    },
    onError: (error) => {
      toast.error(`Failed to approve tasks: ${error.message}`);
    }
  });

  const approveRelease = trpc.feature.approveHumanRelease.useMutation({
    onSuccess: () => {
      toast.success("Release approved successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve release: ${error.message}`);
    }
  });

  const deleteFeature = trpc.feature.delete.useMutation({
    onSuccess: async () => {
      await utils.feature.list.invalidate();
      router.refresh();
      router.push(`/org/${slug}/features`);
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center p-12">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  
  if (!feature) return (
    <div className="p-12 text-center text-muted-foreground">Feature not found</div>
  );

  const activePrdRecord = feature.prds?.find(p => p.currentVersion);
  const prd = activePrdRecord?.currentVersion;

  return (
    <div className="max-w-[90rem] w-full mx-auto space-y-6 px-4">
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href={`/org/${slug}/features`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Features
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{feature.title}</h1>
            <FeatureStatusBadge status={feature.status} hasIssue={feature.githubIssues && feature.githubIssues.length > 0} />
            <SourceChannelBadge channel={feature.sourceChannel as any} />
            {startClarification.isPending && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 animate-pulse">
                <Sparkles className="w-4 h-4" />
                AI Analyzing Feature...
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-sm flex items-center gap-2">
            <span>Created {new Date(feature.createdAt).toLocaleDateString()}</span>
            <span className="opacity-50">•</span>
            <span>Last updated {new Date(feature.updatedAt).toLocaleDateString()}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {feature.status === "SUBMITTED" && (
            <Button
              onClick={() => startClarification.mutate({ featureId, orgId: org!.id })}
              disabled={startClarification.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {startClarification.isPending ? "Starting..." : "Run AI Clarifier"}
            </Button>
          )}

          {(feature.status === "CLARIFYING" || feature.status === "CLARIFIED") && (
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
              onClick={() => generateExecutionPlan.mutate({ featureId, orgId: org!.id })}
              disabled={generateExecutionPlan.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            >
              <LayoutList className="w-4 h-4 mr-2" />
              {generateExecutionPlan.isPending ? "Generating..." : "Generate Execution Plan"}
            </Button>
          )}

          {feature.status === "EXECUTION_PLAN_GENERATED" && (
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

          {feature.status === "PLAN_APPROVED" && activePrdRecord?.id && (
            <Button
              onClick={() => approveForDev.mutate({ orgId: org!.id, prdId: activePrdRecord.id })}
              disabled={approveForDev.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
            >
              <Code2 className="w-4 h-4 mr-2" />
              {approveForDev.isPending ? "Assigning to Agent..." : "Implement with Agent"}
            </Button>
          )}

          {feature.status === "IN_DEVELOPMENT" && (
            <Button
              onClick={() => setIsReviewModalOpen(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-500/20"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Submit for Review
            </Button>
          )}

          {feature.status === "FIX_NEEDED" && (
            <Button
              onClick={() => setIsReviewModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Submit Fixes for Review
            </Button>
          )}

          {feature.status === "AWAITING_HUMAN_APPROVAL" && (
            <Button
              onClick={() => approveRelease.mutate({ featureId: feature.id, orgId: org!.id })}
              disabled={approveRelease.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {approveRelease.isPending ? "Approving..." : "Approve Release"}
            </Button>
          )}

          {currentMember && ["OWNER", "ADMIN", "PM"].includes(currentMember.role) && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this feature? This action cannot be undone.")) {
                  deleteFeature.mutate({ featureId, orgId: org!.id });
                }
              }}
              disabled={deleteFeature.isPending}
              className="shadow-lg shadow-red-500/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteFeature.isPending ? "Deleting..." : "Delete Feature"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-8 items-start print:block">
        <div className="flex flex-col gap-6 print:block">
          {(() => {


            const renderKanban = () => {
              const showKanban = ['TASKS_GENERATED', 'PLAN_APPROVED', 'IN_DEVELOPMENT', 'FIX_NEEDED', 'IN_REVIEW', 'AWAITING_HUMAN_APPROVAL', 'DONE'].includes(feature.status);
              if (!showKanban) return null;
              return (
                <div key="kanban" className="w-full print:hidden">
                  <KanbanBoard featureId={feature.id} orgId={org!.id} />
                </div>
              );
            };

            const renderPRD = () => {
              const isGenerating = feature.status === 'CLARIFIED' && generatePRD.isPending; // Simple heuristic for now
              
              if (isGenerating) {
                return (
                  <div key="prd-generating" className="w-full">
                    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <h3 className="font-medium">Drafting Product Requirements...</h3>
                      </div>
                      <BackgroundJobTracker
                        steps={[
                          "Gathering feature context...",
                          "Drafting Product Requirements Document (PRD)...",
                          "Saving version..."
                        ]}
                        currentStepIndex={1}
                        status="running"
                      />
                      <div className="space-y-3 mt-6">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-32 w-full mt-4" />
                      </div>
                    </div>
                  </div>
                );
              }

              if (!prd || !prd.content) return null;
              
              let content: any = prd.content;
              if (typeof content === 'string') {
                try {
                  content = JSON.parse(content);
                } catch (e) {
                  console.error("Failed to parse PRD content", e);
                }
              }
              
              let md = `# Product Requirements Document\n\n`;
              md += `## Problem Statement\n${content.problemStatement || "N/A"}\n\n`;
              md += `## Goals\n`;
              (content.goals || []).forEach((g: string) => md += `- ${g}\n`);
              md += `\n`;
              md += `## Non-Goals\n`;
              (content.nonGoals || []).forEach((g: string) => md += `- ${g}\n`);
              md += `\n`;
              md += `## User Stories\n`;
              (content.userStories || []).forEach((s: any) => {
                md += `- **As a** ${s.role}, **I want** ${s.goal}, **So that** ${s.benefit}\n`;
              });
              md += `\n`;
              md += `## Acceptance Criteria\n`;
              (content.acceptanceCriteria || []).forEach((c: string, i: number) => {
                md += `${i + 1}. ${c}\n`;
              });
              md += `\n`;
              md += `## Edge Cases\n`;
              (content.edgeCases || []).forEach((e: string) => md += `- ${e}\n`);
              md += `\n`;
              md += `## Success Metrics\n`;
              (content.successMetrics || []).forEach((m: any) => {
                if (typeof m === 'object' && m !== null) {
                  if (m.metric) {
                    md += `- **${m.metric}**: ${m.target} (Measurement: ${m.measurement})\n`;
                  } else {
                    md += `- ${JSON.stringify(m)}\n`;
                  }
                } else {
                  md += `- ${m}\n`;
                }
              });

              return (
                <div key="prd" className="w-full print:block">
                  <ExpandableContent 
                    title="Product Requirements" 
                    icon={<Sparkles className="w-4 h-4 text-slate-500" />}
                    contentToCopy={md}
                    copyLabel="Copy Markdown"
                    copiedLabel="Copied Markdown"
                    maxHeight="400px"
                    extraActions={
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="text-xs">Print PDF</span>
                      </Button>
                    }
                  >
                    <div className="print:hidden">
                      <PRDViewer 
                        prd={content} 
                        featureId={feature.id} 
                        orgId={org!.id}
                        canEdit={feature.status === 'CLARIFYING' || feature.status === 'SUBMITTED' || feature.status === 'PRD_GENERATED' || feature.status === 'TASKS_GENERATED'}
                      />
                    </div>
                    <div className="hidden print:block prose prose-sm dark:prose-invert max-w-none text-black">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {md}
                      </ReactMarkdown>
                    </div>
                  </ExpandableContent>
                </div>
              );
            };

            const renderDescription = () => (
              <div key="desc" className="w-full print:hidden">
                <ExpandableContent 
                  title="Description" 
                  icon={<FileText className="w-4 h-4 text-muted-foreground" />}
                  contentToCopy={feature.rawDescription}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {feature.rawDescription}
                    </ReactMarkdown>
                  </div>
                </ExpandableContent>
              </div>
            );
            
            const isGeneratingTasks = feature.status === 'EXECUTION_PLAN_GENERATED' && generateTasks.isPending;
            const renderTasksPlaceholder = () => {
              if (isGeneratingTasks) {
                return (
                  <div key="tasks-generating" className="w-full">
                    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <h3 className="font-medium text-lg">AI is breaking down your PRD into tasks...</h3>
                      </div>
                      <BackgroundJobTracker
                        steps={[
                          "Analyzing PRD...",
                          "Planning Epics...",
                          "Generating subtasks and acceptance criteria..."
                        ]}
                        currentStepIndex={1}
                        status="running"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <Skeleton className="h-40 w-full rounded-lg" />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            };

            const isRunningClarifier = feature.status === 'CLARIFYING' && (!feature.clarificationThreads?.[0]?.messages?.length || feature.clarificationThreads?.[0]?.messages?.[feature.clarificationThreads[0].messages.length - 1]?.sender !== 'AI_QUESTIONS');
            const renderClarifierTracker = () => {
              if (isRunningClarifier) {
                return (
                  <div key="clarifier-running" className="w-full">
                    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                        <h3 className="font-medium text-lg">AI is analyzing your feature...</h3>
                      </div>
                      <BackgroundJobTracker
                        steps={[
                          "Analyzing feature description...",
                          "Cross-referencing existing features...",
                          "Generating clarification questions..."
                        ]}
                        currentStepIndex={1}
                        status="running"
                      />
                      <div className="space-y-3 mt-6">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            };

            const renderExecutionPlanPlaceholder = () => {
              if (feature.status === 'PRD_GENERATED' && generateExecutionPlan.isPending) {
                return (
                  <div key="exec-plan-generating" className="w-full">
                    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <h3 className="font-medium text-lg">AI is generating an Execution Plan...</h3>
                      </div>
                      <BackgroundJobTracker
                        steps={[
                          "Analyzing PRD...",
                          "Architecting solution...",
                          "Drafting engineering execution plan..."
                        ]}
                        currentStepIndex={1}
                        status="running"
                      />
                      <div className="space-y-3 mt-6">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-32 w-full mt-4" />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            };

            return [
              renderKanban(), 
              renderClarifierTracker(),
              renderExecutionPlanPlaceholder(),
              renderTasksPlaceholder(),
              <ReleaseReadinessViewer key="release-notes" featureId={feature.id} orgId={org!.id} />,
              <ExecutionPlanEditor key="execution-plan" featureId={feature.id} orgId={org!.id} initialPlan={feature.executionPlan as string | null} canEdit={feature.status === 'EXECUTION_PLAN_GENERATED'} />,
              renderPRD(), 
              renderDescription()
            ].filter(Boolean);
          })()}
        </div>

        <div className="space-y-6 print:hidden">
          <div className="rounded-xl border border-primary/10 bg-primary/[0.02] backdrop-blur-sm shadow-sm p-6">
            <h3 className="font-medium text-sm mb-4">Workflow Timeline</h3>
            <WorkflowStatus featureId={feature.id} />
          </div>
          <LinkPRInstructions featureId={feature.id} />
          <RelatedIssuesPanel featureId={feature.id} orgId={org!.id} />
        </div>
      </div>

      <ClarificationModal 
        featureId={feature.id}
        orgId={org!.id}
        isOpen={feature.status === 'SUBMITTED' || feature.status === 'CLARIFYING'}
        messages={feature.clarificationThreads?.[0]?.messages || []}
        onComplete={() => refetch()}
      />

      <ReviewSubmissionModal
        featureId={feature.id}
        orgId={org!.id}
        isOpen={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        onComplete={() => refetch()}
      />

    </div>
  );
}
