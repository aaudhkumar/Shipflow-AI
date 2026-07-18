"use client";

import { Copy, GitBranch, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LinkPRInstructions({ featureId }: { featureId: string }) {
  const branchName = `feature/${featureId}`;
  const prTitle = `[${featureId}] Add your title here`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="rounded-xl border border-primary/10 bg-primary/[0.02] backdrop-blur-sm shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Github className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-medium text-sm">Link GitHub PR</h3>
      </div>
      
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        To automatically link a Pull Request to this feature, simply include the Feature ID in your branch name or PR title.
      </p>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
              Branch Name
            </label>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 border border-border/50 rounded-md p-1 pl-3">
            <code className="text-xs text-muted-foreground flex-1 truncate">{branchName}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => handleCopy(branchName, "Branch name")}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-muted-foreground" />
              PR Title
            </label>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 border border-border/50 rounded-md p-1 pl-3">
            <code className="text-xs text-muted-foreground flex-1 truncate">{prTitle}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => handleCopy(prTitle, "PR title")}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
