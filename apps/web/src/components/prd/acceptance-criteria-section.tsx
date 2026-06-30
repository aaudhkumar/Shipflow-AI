"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Check, X, CheckSquare } from "lucide-react";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AcceptanceCriteriaSectionProps {
  criteria: string[];
  featureId: string;
  orgId: string;
  canEdit: boolean;
}

export function AcceptanceCriteriaSection({ criteria, featureId, orgId, canEdit }: AcceptanceCriteriaSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(criteria.join("\n"));

  const utils = trpc.useUtils();

  const updateMutation = trpc.feature.updatePrd.useMutation({
    onSuccess: () => {
      toast.success("Acceptance criteria updated");
      setIsEditing(false);
      utils.feature.getById.invalidate({ featureId, orgId });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update criteria");
    },
  });

  const handleSave = () => {
    const value = draft.split("\n").map(s => s.trim()).filter(s => s.length > 0);
    updateMutation.mutate({ featureId, orgId, field: "acceptanceCriteria", value });
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 shadow-sm overflow-hidden group">
      <div className="border-b border-border/50 bg-muted/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckSquare className="w-4 h-4" />
          <h3 className="font-medium text-sm text-foreground">Acceptance Criteria</h3>
        </div>
        {canEdit && !isEditing && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Edit
          </Button>
        )}
      </div>
      <div className="p-5 text-sm">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              className="min-h-[120px] text-sm resize-y bg-background"
              value={draft}
              onChange={(e: any) => setDraft(e.target.value)}
              placeholder="Enter criteria, one per line..."
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDraft(criteria.join("\n"));
                  setIsEditing(false);
                }}
                disabled={updateMutation.isPending}
              >
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={updateMutation.isPending}
                className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {updateMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {criteria.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400">
                  {i + 1}
                </div>
                <div className="text-slate-700 dark:text-slate-300 leading-snug pt-0.5">
                  {item}
                </div>
              </div>
            ))}
            {criteria.length === 0 && (
              <div className="text-sm text-muted-foreground italic">No acceptance criteria defined.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
