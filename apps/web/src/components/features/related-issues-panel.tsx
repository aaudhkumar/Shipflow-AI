'use client';

import { trpc } from '~/trpc/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Github } from 'lucide-react';

export function RelatedIssuesPanel({ featureId, orgId }: { featureId: string, orgId: string }) {
  const { data: issues, isLoading } = trpc.feature.getLinkedIssues.useQuery({ featureId, orgId });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Github className="h-4 w-4" />
          Related Issues
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
        {!isLoading && (!issues || issues.length === 0) && (
          <p className="text-xs text-muted-foreground">No linked issues yet.</p>
        )}
        {issues?.map((issue: any) => (
          <div key={issue.id} className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Badge
                variant={issue.state === 'open' ? 'default' : 'secondary'}
                className="text-[10px] px-1.5 py-0 shrink-0"
              >
                {issue.state}
              </Badge>
              <span className="text-xs truncate">#{issue.issueNumber} {issue.title}</span>
            </div>
            
            <a
              href={`https://github.com/${issue.repoFullName}/issues/${issue.issueNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
