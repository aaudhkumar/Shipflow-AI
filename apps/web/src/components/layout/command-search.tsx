"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, FileText, GitPullRequest, CircleDot, MessageSquare, ExternalLink, Loader2 } from "lucide-react";
import { trpc } from "~/trpc/client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
}

export function CommandSearch({ open, onOpenChange, orgSlug }: CommandSearchProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = React.useState("");
  const [debouncedValue, setDebouncedValue] = React.useState("");
  
  const { data: org } = trpc.organization.getBySlug.useQuery({ slug: orgSlug });

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  React.useEffect(() => {
    if (!open) {
      setInputValue("");
      setDebouncedValue("");
    }
  }, [open]);

  const { data: results, isLoading } = trpc.search.global.useQuery(
    { orgId: org?.id as string, query: debouncedValue },
    { enabled: !!org?.id && debouncedValue.length > 0 }
  );

  const handleSelect = (url: string, external: boolean = false) => {
    if (external) {
      window.open(url, "_blank");
    } else {
      router.push(url);
    }
    onOpenChange(false);
  };

  const hasResults = results && (
    results.features.length > 0 ||
    results.pullRequests.length > 0 ||
    results.issues.length > 0 ||
    results.reviews.length > 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="p-0 overflow-hidden shadow-2xl max-w-2xl bg-background/95 backdrop-blur-xl border-border/40">
        <Command 
          shouldFilter={false}
          className="flex h-full w-full flex-col overflow-hidden rounded-md bg-transparent"
        >
          <div className="flex items-center border-b border-border/40 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Search features, PRs, issues..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={inputValue}
              onValueChange={setInputValue}
            />
            {isLoading && <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          </div>
          
          <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2">
            {!isLoading && debouncedValue.length > 0 && !hasResults && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
            )}

            {results?.features && results.features.length > 0 && (
              <Command.Group heading="Features" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                {results.features.map((feature) => (
                  <Command.Item
                    key={feature.id}
                    value={`feature-${feature.id}`}
                    onSelect={() => handleSelect(`/org/${orgSlug}/features/${feature.id}`)}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                  >
                    <FileText className="mr-3 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="truncate font-medium">{feature.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-primary/10 text-primary">{feature.status.replace(/_/g, " ")}</Badge>
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results?.pullRequests && results.pullRequests.length > 0 && (
              <Command.Group heading="Pull Requests" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground mt-2">
                {results.pullRequests.map((pr) => (
                  <Command.Item
                    key={pr.id}
                    value={`pr-${pr.id}`}
                    onSelect={() => handleSelect(`/org/${orgSlug}/pr/${pr.githubPrNumber}`)}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                  >
                    <GitPullRequest className="mr-3 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="truncate font-medium">{pr.title}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">#{pr.githubPrNumber}</Badge>
                        {pr.repoName && <span>{pr.repoName}</span>}
                        <span className="text-[10px] uppercase text-primary">{pr.state.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results?.issues && results.issues.length > 0 && (
              <Command.Group heading="Issues" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground mt-2">
                {results.issues.map((issue) => (
                  <Command.Item
                    key={issue.id}
                    value={`issue-${issue.id}`}
                    onSelect={() => handleSelect(`https://github.com/${issue.repoFullName}/issues/${issue.issueNumber}`, true)}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                  >
                    <CircleDot className="mr-3 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col gap-1 overflow-hidden flex-1">
                      <span className="truncate font-medium">{issue.title}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">#{issue.issueNumber}</Badge>
                        <span>{issue.repoFullName}</span>
                        {issue.authorLogin && <span>opened by {issue.authorLogin}</span>}
                      </div>
                    </div>
                    <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground opacity-50 shrink-0" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results?.reviews && results.reviews.length > 0 && (
              <Command.Group heading="Reviews" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground mt-2">
                {results.reviews.map((review) => (
                  <Command.Item
                    key={review.id}
                    value={`review-${review.id}`}
                    onSelect={() => handleSelect(`/org/${orgSlug}/pr/${review.githubPrNumber}`)}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                  >
                    <MessageSquare className="mr-3 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="truncate font-medium">Review on: {review.prTitle}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">#{review.githubPrNumber}</Badge>
                        <span>{review.findingCount} findings</span>
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
