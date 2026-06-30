"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { Loader2, ExternalLink } from "lucide-react";
import { DndContext, DragEndEvent, closestCenter, useDraggable, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

function DraggableTaskCard({ task, orgSlug }: { task: any, orgSlug: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const feature = task.epic?.prd?.featureRequest;
  const project = task.epic?.project;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card p-4 rounded-lg shadow-sm border border-border/50 flex flex-col gap-2 relative cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute inset-0 z-0 touch-none" 
      />
      <div className="z-10 pointer-events-none w-full flex justify-between items-start">
        <p className="text-sm font-medium leading-tight">{task.title}</p>
        {feature && (
          <Link href={`/org/${orgSlug}/features/${feature.id}`} className="pointer-events-auto text-muted-foreground hover:text-primary transition-colors z-20" onPointerDown={(e) => e.stopPropagation()}>
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="z-10 pointer-events-none flex flex-wrap gap-1 mt-2">
        {project && <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-500 max-w-[100px] truncate">{project.name}</Badge>}
        {feature && <Badge variant="secondary" className="text-[10px] max-w-[150px] truncate">{feature.title}</Badge>}
      </div>
    </div>
  );
}

function DroppableColumn({ id, title, count, children }: any) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`bg-muted/20 rounded-xl border border-border/50 p-4 min-h-[400px] transition-colors ${isOver ? 'bg-muted/40 border-primary/50' : ''}`}
    >
      <h4 className="font-medium text-sm mb-4 text-muted-foreground flex items-center justify-between">
        {title}
        <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{count}</span>
      </h4>
      <div className="space-y-3">
        {children}
        {count === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-border/50 rounded-lg">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

export function MyTasksKanban({ orgId, slug }: { orgId: string, slug: string }) {
  const utils = trpc.useUtils();
  const { data: board, isLoading } = trpc.task.getMyTasks.useQuery({ orgId });
  const [activeTask, setActiveTask] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const updateTaskStatus = trpc.task.updateStatus.useMutation({
    onMutate: async ({ _taskId, _status }) => {
      await utils.task.getMyTasks.cancel({ orgId });
      const prev = utils.task.getMyTasks.getData({ orgId });
      return { prev };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prev) {
        utils.task.getMyTasks.setData({ orgId }, ctx.prev);
      }
    },
    onSettled: () => {
      utils.task.getMyTasks.invalidate({ orgId });
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
      const prev = utils.task.getMyTasks.getData({ orgId });
      if (prev) {
        utils.task.getMyTasks.setData({ orgId }, (old: any) => {
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

  if (isLoading) return <div className="h-[400px] flex items-center justify-center border border-border/50 rounded-xl bg-card/40"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!board) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mt-2 mb-4">
        <h2 className="text-xl font-bold tracking-tight">My Tasks</h2>
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
                    orgSlug={slug}
                  />
                ))}
              </DroppableColumn>
            );
          })}
        </div>
        
        <DragOverlay>
          {activeTask ? (
             <div className="bg-card p-4 rounded-lg shadow-xl border border-primary flex flex-col gap-2 opacity-90 cursor-grabbing transform scale-105">
               <div className="w-full flex justify-between items-start">
                 <p className="text-sm font-medium leading-tight">{activeTask.title}</p>
                 {activeTask.epic?.prd?.featureRequest && (
                   <ExternalLink className="w-4 h-4 text-muted-foreground" />
                 )}
               </div>
               <div className="flex flex-wrap gap-1 mt-2">
                 {activeTask.epic?.project && <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-500 max-w-[100px] truncate">{activeTask.epic.project.name}</Badge>}
                 {activeTask.epic?.prd?.featureRequest && <Badge variant="secondary" className="text-[10px] max-w-[150px] truncate">{activeTask.epic.prd.featureRequest.title}</Badge>}
               </div>
             </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
