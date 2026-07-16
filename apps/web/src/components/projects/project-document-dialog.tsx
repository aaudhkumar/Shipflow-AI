"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { FileText, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";

export function ProjectDocumentDialog({
  contextDocument,
  projectName,
  projectId,
  orgId,
}: {
  contextDocument: string | null;
  projectName: string;
  projectId: string;
  orgId: string;
}) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  
  const regenerateMutation = trpc.project.regenerateContext.useMutation({
    onSuccess: () => {
      toast.success("Document regeneration started");
      utils.project.getById.invalidate({ projectId, orgId });
      // We don't close the dialog. Because the backend set contextDocument to null,
      // it will automatically show the loading state and start polling!
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start regeneration");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          Project Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
          <DialogTitle className="truncate min-w-0 flex-1 text-left" title={`${projectName} - Context Document`}>
            {projectName} <span className="text-muted-foreground font-normal">- Context Document</span>
          </DialogTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 flex-shrink-0"
            disabled={regenerateMutation.isPending}
            onClick={() => regenerateMutation.mutate({ projectId, orgId })}
          >
            {regenerateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerate Document
          </Button>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4 mt-4">
          {!contextDocument ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-lg">Generating Context Document...</p>
              <p className="text-sm">This is running in the background because this project was just created.</p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none pb-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{contextDocument}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
