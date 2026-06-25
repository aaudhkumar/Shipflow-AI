import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GitPullRequest, GitCommit, Clock } from "lucide-react";

export interface ReviewSummary {
  id: string;
  commitSha: string;
  createdAt: Date;
  pullRequest: {
    id: string;
    title: string;
    githubPrNumber: number;
  };
  repository: {
    fullName: string;
  };
  findingCounts: {
    total: number;
    blocking: number;
    nonBlocking: number;
  };
}

export function ReviewSummaryCard({ review, orgSlug }: { review: ReviewSummary; orgSlug: string }) {
  const shortSha = review.commitSha.substring(0, 7);

  return (
    <Link href={`/org/${orgSlug}/pr/${review.pullRequest.githubPrNumber}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer mb-4">
        <CardHeader className="py-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-muted-foreground" />
                {review.pullRequest.title}
                <span className="text-muted-foreground font-normal">#{review.pullRequest.githubPrNumber}</span>
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-4">
                <span>{review.repository.fullName}</span>
                <span className="flex items-center gap-1">
                  <GitCommit className="w-3.5 h-3.5" />
                  {shortSha}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-4 pt-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {review.findingCounts.total} Findings
            </Badge>
            {review.findingCounts.blocking > 0 ? (
              <Badge variant="destructive" className="text-xs font-normal">
                {review.findingCounts.blocking} Blocking
              </Badge>
            ) : null}
            {review.findingCounts.nonBlocking > 0 ? (
              <Badge variant="secondary" className="text-xs font-normal bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400">
                {review.findingCounts.nonBlocking} Non-blocking
              </Badge>
            ) : null}
            {review.findingCounts.total === 0 ? (
              <Badge variant="secondary" className="text-xs font-normal bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
                Clean Review
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
