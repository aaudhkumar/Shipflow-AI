"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { trpc } from "~/trpc/client"
import { toast } from "sonner"
import { Loader2, GitMerge } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ActivityFeed({ activities = [], orgId }: { activities?: any[], orgId: string }) {
  const [mergePr, setMergePr] = useState<any>(null);
  const utils = trpc.useUtils();

  const mergeMutation = trpc.pullRequest.merge.useMutation({
    onSuccess: () => {
      toast.success("Pull Request successfully merged!");
      setMergePr(null);
      utils.organization.getRecentActivity.invalidate({ orgId });
    },
    onError: (err) => {
      toast.error(`Merge failed: ${err.message}`);
      setMergePr(null);
    }
  });

  // The confirmMerge function is no longer used, as it's directly inside the JSX now

  return (
    <Card className="h-full bg-card/40 backdrop-blur-md border-border/50 shadow-sm flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Recent AI Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[320px] px-6">
          <div className="space-y-4 pb-4">
            {activities.length === 0 && (
              <div className="text-sm text-muted-foreground pt-4">No recent activity.</div>
            )}
            {activities.map((item) => (
              <div key={item.reviewId} className="flex flex-col gap-2 relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-[-1rem] before:w-px before:bg-border/50 last:before:hidden">
                <div className="absolute left-[-4px] top-[6px] w-2 h-2 rounded-full bg-border" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{item.repoName}</span>
                    <span className="text-xs text-muted-foreground/50">•</span>
                    <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium leading-none mb-2">{item.prTitle}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">#{item.githubPrNumber}</Badge>
                    {item.state === "APPROVED" && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Approved</Badge>
                    )}
                    {item.state === "CHANGES_REQUESTED" && (
                      <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Needs Work</Badge>
                    )}
                    {item.state === "PENDING" && (
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Analyzing...</Badge>
                    )}
                    {item.state === "DISMISSED" && (
                      <Badge variant="secondary" className="text-[10px] bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">Dismissed</Badge>
                    )}
                    {item.isAiReview && item.reviewMeta && typeof item.reviewMeta === 'object' && (item.reviewMeta as any).shouldMerge && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-6 px-2 text-[10px] bg-indigo-600 hover:bg-indigo-700 ml-auto"
                        onClick={() => setMergePr(item)}
                      >
                        <GitMerge className="w-3 h-3 mr-1" />
                        Merge PR
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={!!mergePr} onOpenChange={(open) => !open && setMergePr(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Merge</DialogTitle>
            <DialogDescription>
              Are you sure you want to merge PR #{mergePr?.githubPrNumber} ({mergePr?.prTitle}) into the repository?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergePr(null)} disabled={mergeMutation.isPending}>
              Cancel
            </Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={() => {
                if (!mergePr) return;
                mergeMutation.mutate({
                  orgId,
                  pullRequestId: mergePr.pullRequestId,
                  repoOwner: mergePr.repoOwner,
                  repoName: mergePr.repoName,
                  githubPrNumber: mergePr.githubPrNumber,
                  installationId: mergePr.installationId
                });
              }}
              disabled={mergeMutation.isPending}
            >
              {mergeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yes, Merge PR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
