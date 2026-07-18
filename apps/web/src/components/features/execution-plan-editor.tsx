"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "~/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil, Check, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ExpandableContent } from "@/components/ui/expandable-content";
import { CheckCircle2 } from "lucide-react";

interface ExecutionPlanEditorProps {
  featureId: string;
  orgId: string;
  initialPlan: string | null;
  canEdit: boolean;
}

export function ExecutionPlanEditor({ featureId, orgId, initialPlan, canEdit }: ExecutionPlanEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialPlan || "");
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!isEditing && initialPlan !== null) {
      setContent(initialPlan);
    }
  }, [initialPlan, isEditing]);

  const updatePlan = trpc.feature.updateExecutionPlan.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.feature.getById.invalidate({ featureId, orgId });
      toast.success("Execution plan updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update execution plan: ${error.message}`);
    }
  });

  const generateExecutionPlan = trpc.feature.generateExecutionPlan.useMutation({
    onSuccess: () => {
      toast.success("Regenerating execution plan...");
      utils.feature.getById.invalidate({ featureId, orgId });
    }
  });

  if (!initialPlan && !isEditing) return null;

  return (
    <div className="w-full print:hidden mb-4">
      <ExpandableContent
        title="Execution Plan"
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        contentToCopy={content}
        copyLabel="Copy Plan"
        copiedLabel="Copied Plan"
        maxHeight="400px"
        extraActions={
          canEdit && !isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="text-xs">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateExecutionPlan.mutate({ featureId, orgId })}
                className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-xs">Regenerate</span>
              </Button>
            </>
          ) : null
        }
      >
        {isEditing ? (
          <div className="space-y-4 mt-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Write your execution plan here..."
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setContent(initialPlan || "");
                  setIsEditing(false);
                }}
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => updatePlan.mutate({ featureId, orgId, executionPlan: content })}
                disabled={updatePlan.isPending || content === initialPlan}
              >
                <Check className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </ExpandableContent>
    </div>
  );
}
