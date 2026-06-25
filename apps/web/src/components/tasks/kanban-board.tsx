"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function KanbanBoard({ featureId, orgId }: { featureId: string, orgId: string }) {
  const { data: board, refetch, isLoading } = trpc.task.getKanban.useQuery({ featureId, orgId });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const batchUpdate = trpc.task.batchUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success("Tasks updated successfully");
      setSelectedTasks([]);
      refetch();
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

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!board) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tasks</h3>
        {selectedTasks.length > 0 && (
          <Button onClick={markSelectedAsDone} disabled={batchUpdate.isPending} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark {selectedTasks.length} as DONE
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['TODO', 'IN_PROGRESS', 'DONE'].map(status => {
          const tasks = board[status as keyof typeof board] || [];
          return (
            <div key={status} className="bg-muted/20 rounded-xl border border-border/50 p-4 min-h-[300px]">
              <h4 className="font-medium text-sm mb-4 text-muted-foreground flex items-center justify-between">
                {status.replace('_', ' ')}
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>
              </h4>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="bg-card p-4 rounded-lg shadow-sm border border-border/50 flex items-start gap-3">
                    <Checkbox 
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium leading-tight">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-border/50 rounded-lg">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
