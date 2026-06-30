"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Check, X, FileText } from "lucide-react";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PRDSectionProps {
  title: string;
  content: string | string[];
  field: "problemStatement" | "goals" | "nonGoals" | "edgeCases" | "successMetrics";
  featureId: string;
  orgId: string;
  canEdit: boolean;
  isList?: boolean;
}

export function PRDSection({ title, content, field, featureId, orgId, canEdit, isList = false }: PRDSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(
    isList 
      ? (content as any[]).map(c => typeof c === 'object' ? JSON.stringify(c) : c).join("\n") 
      : (content as string)
  );

  const utils = trpc.useUtils();

  const updateMutation = trpc.feature.updatePrd.useMutation({
    onSuccess: () => {
      toast.success("Section updated successfully");
      setIsEditing(false);
      utils.feature.getById.invalidate({ featureId, orgId });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update section");
    },
  });

  const handleSave = () => {
    let value: string | string[] = draft;
    if (isList) {
      value = draft.split("\n").map(s => s.trim()).filter(s => s.length > 0);
    }
    updateMutation.mutate({ featureId, orgId, field, value });
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 shadow-sm overflow-hidden group">
      <div className="border-b border-border/50 bg-muted/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="w-4 h-4" />
          <h3 className="font-medium text-sm text-foreground">{title}</h3>
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
              className="min-h-[100px] text-sm resize-y bg-background"
              value={draft}
              onChange={(e: any) => setDraft(e.target.value)}
              placeholder={isList ? "Enter items, one per line..." : "Enter text here..."}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDraft(isList ? (content as any[]).map(c => typeof c === 'object' ? JSON.stringify(c) : c).join("\n") : (content as string));
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
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
            {isList ? (
              <ul className="list-disc pl-4 space-y-1 marker:text-slate-400">
                {(content as any[]).map((item, i) => {
                  if (typeof item === 'object' && item !== null) {
                    if (item.metric) {
                      return <li key={i}><strong>{item.metric}</strong>: {item.target} <span className="text-muted-foreground">({item.measurement})</span></li>;
                    }
                    return <li key={i}>{JSON.stringify(item)}</li>;
                  }
                  return <li key={i}>{item}</li>;
                })}
              </ul>
            ) : (
              <p className="whitespace-pre-wrap">{content as string}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
