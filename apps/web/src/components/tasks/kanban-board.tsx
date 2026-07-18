"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { useParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Github, Sparkles, Circle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DndContext, DragEndEvent, closestCenter, useDraggable, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BackgroundJobTracker } from "@/components/ui/background-job-tracker";

function DraggableTaskCard({ task, members, assignTask, orgSlug }: any) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const isAiWorking = task.executionStatus === 'claimed' || task.executionStatus === 'in_progress';
  const isAiDone = task.executionStatus === 'done';
  const isAiFailed = task.executionStatus === 'failed';

  let currentStepIndex = 0;
  if (task.executionStatus === 'claimed') currentStepIndex = 1;
  else if (task.executionStatus === 'in_progress') currentStepIndex = 2;
  else if (isAiDone) currentStepIndex = 4;
  else if (isAiFailed) currentStepIndex = 2;

  // For IN_REVIEW tasks, they might need coloring. We can mock it or check feature review state if we had it.
  // We'll leave it neutral unless we have that prop.
  let cardBorderColor = "border-border/50 hover:border-primary/50";
  let cardBgColor = "bg-card";

  const latestPR = task.pullRequests && task.pullRequests.length > 0 
    ? task.pullRequests[task.pullRequests.length - 1] 
    : null;

  if (isAiDone) {
    cardBgColor = "bg-emerald-500/10 dark:bg-emerald-500/5";
    cardBorderColor = "border-emerald-500/30 hover:border-emerald-500/50";
  } else if (isAiFailed) {
    cardBgColor = "bg-red-500/10 dark:bg-red-500/5";
    cardBorderColor = "border-red-500/30 hover:border-red-500/50";
  } else {
    let prState = 'PENDING';
    if (latestPR) {
      if (latestPR.reviews && latestPR.reviews.length > 0) {
        const latestReview = latestPR.reviews[latestPR.reviews.length - 1];
        prState = latestReview.state;
      }
    }

    if (task.status === 'IN_REVIEW' || task.status === 'DONE') {
      if (prState === 'APPROVED' || prState === 'COMMENTED') {
        cardBgColor = "bg-emerald-500/10 dark:bg-emerald-500/5";
        cardBorderColor = "border-emerald-500/30 hover:border-emerald-500/50";
      } else {
        cardBgColor = "bg-rose-500/10 dark:bg-rose-500/5";
        cardBorderColor = "border-rose-500/30 hover:border-rose-500/50";
      }
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div
          ref={setNodeRef}
          style={style}
          onClick={() => setIsDialogOpen(true)}
          className={`${cardBgColor} p-4 rounded-xl shadow-sm border ${cardBorderColor} flex flex-col gap-3 relative cursor-grab active:cursor-grabbing transition-colors ${isDragging ? 'z-50 ring-2 ring-primary' : ''}`}
        >
          <div 
            {...attributes} 
            {...listeners} 
            className="absolute inset-0 z-0 rounded-xl touch-none" 
          />
          <div className="z-10 w-full pointer-events-none">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium leading-tight">{task.title}</p>
              
              <div className="flex flex-wrap gap-2">
                {isAiWorking && (
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 whitespace-nowrap animate-pulse">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    AI Working
                  </Badge>
                )}
                {isAiDone && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    AI Done
                  </Badge>
                )}
                {isAiFailed && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 whitespace-nowrap">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    AI Failed
                  </Badge>
                )}
              </div>
            </div>
            
            {task.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{task.description}</p>
            )}

            <div className="mt-4 pointer-events-auto" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <Select
                value={task.assigneeId || "unassigned"}
                onValueChange={(val) => {
                  const assigneeId = val === "unassigned" ? null : val;
                  assignTask(task.id, assigneeId);
                }}
              >
                <SelectTrigger className="h-8 text-xs w-full bg-background/50 backdrop-blur-sm border-border/50">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground">?</span>
                      </div>
                      <span>Unassigned</span>
                    </div>
                  </SelectItem>
                  {members?.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={member.user?.image} />
                          <AvatarFallback className="text-[10px]">{member.user?.name?.[0] || member.user?.email?.[0]}</AvatarFallback>
                        </Avatar>
                        <span>{member.user?.name || member.user?.email?.split('@')[0]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>Task Details</DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-2">Technical Implementation Details</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border border-border/50">
              {task.technicalImplementationDetails || "No technical details provided."}
            </div>
          </div>

          {(isAiWorking || isAiDone || isAiFailed || task.executionStatus === 'ready') && (
            <div>
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                AI Implementation Progress
              </h4>
              <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                <BackgroundJobTracker
                  steps={[
                    "Claiming task from queue",
                    "Setting up workspace & context",
                    "Writing code & implementing logic",
                    "Pushing branch & saving result"
                  ]}
                  currentStepIndex={currentStepIndex}
                  status={isAiFailed ? "error" : isAiDone ? "success" : isAiWorking ? "running" : "idle"}
                />

                {isAiFailed && task.lastError && (
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Implementation Error
                      </h5>
                      <p className="text-xs text-red-500/90 whitespace-pre-wrap font-mono">
                        {task.lastError}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(task.status === 'DONE' || task.status === 'IN_REVIEW') && (
            <div className="pt-4 flex justify-end border-t border-border/50">
              {latestPR ? (
                <Link 
                  href={`/org/${orgSlug}/pr/${latestPR.githubPrNumber}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="text-indigo-600 border-indigo-600/30 hover:bg-indigo-50">
                    <Github className="w-4 h-4 mr-2" />
                    View PR Details
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="text-indigo-600 border-indigo-600/30 hover:bg-indigo-50 opacity-50 cursor-not-allowed" disabled>
                  <Github className="w-4 h-4 mr-2" />
                  No PR Linked
                </Button>
              )}
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Acceptance Criteria</h4>
              <ul className="space-y-2">
                {task.subtasks.map((st: any) => (
                  <li key={st.id} className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/20 p-2 rounded-md border border-border/30">
                    <div className="mt-0.5">
                      {st.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <span>{st.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


function DroppableColumn({ id, title, count, children }: any) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`bg-muted/20 rounded-xl border border-border/50 p-4 min-h-[300px] transition-colors ${isOver ? 'bg-muted/40 border-primary/50' : ''}`}
    >
      <h4 className="font-medium text-sm mb-4 text-muted-foreground flex items-center justify-between">
        {title}
        <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{count}</span>
      </h4>
      <div className="space-y-3">
        {children}
        {count === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-border/50 rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ featureId, orgId }: { featureId: string, orgId: string }) {
  const params = useParams();
  const orgSlug = params.slug as string;
  const utils = trpc.useUtils();
  const { data: board, isLoading } = trpc.task.getKanban.useQuery({ featureId, orgId }, {
    refetchInterval: (query: any) => {
      // Handle both v4 (query is data) and v5 (query.state.data) signatures
      const data = query?.state?.data ?? query;
      if (!data) return false;
      
      const allTasks = [...(data.TODO || []), ...(data.IN_PROGRESS || []), ...(data.DONE || [])];
      const hasActiveTasks = allTasks.some(t => ['ready', 'claimed', 'in_progress'].includes(t.executionStatus));
      return hasActiveTasks ? 5000 : false;
    }
  });
  const { data: members } = trpc.organization.getMembers.useQuery({ orgId });
  const [activeTask, setActiveTask] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const assignTask = trpc.task.assignTask.useMutation({
    onSuccess: () => {
      utils.task.getKanban.invalidate({ featureId, orgId });
      toast.success("Assignee updated");
    },
    onError: (err) => toast.error(`Failed to assign: ${err.message}`)
  });

  const updateTaskStatus = trpc.task.updateStatus.useMutation({
    onMutate: async ({ taskId: _taskId, status: _status }) => {
      await utils.task.getKanban.cancel({ featureId, orgId });
      const prev = utils.task.getKanban.getData({ featureId, orgId });
      return { prev };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prev) {
        utils.task.getKanban.setData({ featureId, orgId }, ctx.prev);
      }
      toast.error(`Failed to move task: ${err.message}`);
    },
    onSettled: () => {
      utils.task.getKanban.invalidate({ featureId, orgId });
    }
  });



  const handleDragStart = (event: any) => {
    setActiveTask(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    
    if (!over) return;
    
    const newStatus = over.id as 'TODO' | 'IN_PROGRESS' | 'DONE';
    const activeData = active.data.current as any;
    
    if (activeData && activeData.status !== newStatus) {
      // Synchronous optimistic update so dnd-kit DragOverlay animates to the new box
      const prev = utils.task.getKanban.getData({ featureId, orgId });
      if (prev) {
        utils.task.getKanban.setData({ featureId, orgId }, (old: any) => {
          if (!old) return old;
          let movedTask = null;
          const newBoard = { ...old };
          for (const key of ['TODO', 'IN_PROGRESS', 'DONE']) {
            const idx = newBoard[key].findIndex((t: any) => t.id === active.id);
            if (idx > -1) {
              movedTask = { ...newBoard[key][idx], status: newStatus };
              newBoard[key] = newBoard[key].filter((t: any) => t.id !== active.id);
              break;
            }
          }
          if (movedTask) {
            newBoard[newStatus] = [...newBoard[newStatus], movedTask];
          }
          return newBoard;
        });
      }

      updateTaskStatus.mutate({ taskId: active.id as string, status: newStatus, orgId });
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!board) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mt-8 mb-4">
        <h3 className="text-lg font-semibold">Tasks</h3>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['TODO', 'IN_PROGRESS', 'DONE'].map(status => {
            const tasks = board[status as keyof typeof board] || [];
            return (
              <DroppableColumn 
                key={status} 
                id={status} 
                title={status.replace('_', ' ')} 
                count={Array.isArray(tasks) ? tasks.length : 0}
              >
                {Array.isArray(tasks) && tasks.map(task => (
                  <DraggableTaskCard 
                    key={task.id}
                    task={task}
                    members={members}
                    orgSlug={orgSlug}
                    assignTask={(taskId: string, assigneeId: string | null) => assignTask.mutate({ taskId, assigneeId, orgId })}
                  />
                ))}
              </DroppableColumn>
            );
          })}
        </div>
        
        <DragOverlay>
          {activeTask ? (
            <div className="bg-card p-4 rounded-lg shadow-xl border border-primary flex items-start gap-3 opacity-90 cursor-grabbing transform scale-105">
              <div>
                <p className="text-sm font-medium leading-tight">{activeTask.title}</p>
                {activeTask.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activeTask.description}</p>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
