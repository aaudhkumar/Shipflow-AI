"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, GitBranch, Github, Sparkles, Circle } from "lucide-react";
import { toast } from "sonner";
import { DndContext, DragEndEvent, closestCenter, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { ExpandableContent } from "@/components/ui/expandable-content";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { BackgroundJobTracker } from "@/components/ui/background-job-tracker";

function DraggableTaskCard({ task, isSelected, toggleTask, members, assignTask }: any) {
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
  else if (isAiFailed) currentStepIndex = 2; // Assuming it failed during coding

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={`bg-card p-4 rounded-lg shadow-sm border border-border/50 flex items-start gap-3 relative cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${isDragging ? 'z-50' : ''}`}
        >
          <div 
            {...attributes} 
            {...listeners} 
            className="absolute inset-0 z-0" 
          />
          <div className="z-10" onPointerDown={(e) => e.stopPropagation()}>
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => toggleTask(task.id)}
              className="mt-1"
            />
          </div>
          <div className="z-10 w-full pointer-events-none">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight">{task.title}</p>
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
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
            <div className="flex items-center gap-1 mt-2 mb-1 pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground bg-muted/30"
                onClick={() => {
                  navigator.clipboard.writeText(`feature/${task.id}`);
                  toast.success("Branch name copied");
                }}
              >
                <GitBranch className="w-3 h-3 mr-1" />
                Branch
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground bg-muted/30"
                onClick={() => {
                  navigator.clipboard.writeText(`[${task.id}] ${task.title}`);
                  toast.success("PR title copied");
                }}
              >
                <Github className="w-3 h-3 mr-1" />
                PR Title
              </Button>
            </div>
            <div className="mt-3 pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
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
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task.title}</SheetTitle>
          <SheetDescription>Task Details</SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-2">Technical Implementation Details</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
              {task.technicalImplementationDetails || "No technical details provided."}
            </div>
          </div>

          {(isAiWorking || isAiDone || isAiFailed || task.executionStatus === 'ready') && (
            <div>
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                AI Implementation Status
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
              </div>
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Acceptance Criteria</h4>
              <ul className="space-y-2">
                {task.subtasks.map((st: any) => (
                  <li key={st.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="mt-0.5"><Circle className="w-3 h-3" /></div>
                    <span>{st.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
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
  const utils = trpc.useUtils();
  const { data: board, isLoading } = trpc.task.getKanban.useQuery({ featureId, orgId });
  const { data: members } = trpc.organization.getMembers.useQuery({ orgId });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [activeTask, setActiveTask] = useState<any>(null);

  const assignTask = trpc.task.assignTask.useMutation({
    onSuccess: () => {
      utils.task.getKanban.invalidate({ featureId, orgId });
      toast.success("Assignee updated");
    },
    onError: (err) => toast.error(`Failed to assign: ${err.message}`)
  });

  const updateTaskStatus = trpc.task.updateStatus.useMutation({
    onMutate: async ({ taskId, status }) => {
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

  const batchUpdate = trpc.task.batchUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success("Tasks updated successfully");
      setSelectedTasks([]);
      utils.task.getKanban.invalidate({ featureId, orgId });
    },
    onError: (err) => {
      toast.error(`Failed to update tasks: ${err.message}`);
    }
  });

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const markSelectedAsDone = () => {
    if (selectedTasks.length === 0) return;
    batchUpdate.mutate({ taskIds: selectedTasks, status: "DONE", orgId });
  };

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
        {selectedTasks.length > 0 && (
          <Button onClick={markSelectedAsDone} disabled={batchUpdate.isPending} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark {selectedTasks.length} as DONE
          </Button>
        )}
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
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
                    isSelected={selectedTasks.includes(task.id)}
                    toggleTask={toggleTask}
                    members={members}
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
              <Checkbox checked={selectedTasks.includes(activeTask.id)} className="mt-1" />
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
