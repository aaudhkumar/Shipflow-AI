import { db } from "@shipflow/db"
import { eq, desc } from "@shipflow/db"

import { Badge } from "@/components/ui/badge"
import { Sparkles, Inbox, ExternalLink } from "lucide-react"
import Link from "next/link"

export default async function IssuesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Dynamically import schema to avoid circular dependency resolution issues in Next.js Server Components
  const { githubIssues, organizations, repositories, featureRequests } = await import("@shipflow/db/schema");

  // Look up the org
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!org) {
    return <div className="text-muted-foreground">Organization not found.</div>;
  }

  // Fetch issues
  const issues = await db
    .select({
      id: githubIssues.id,
      issueNumber: githubIssues.issueNumber,
      title: githubIssues.title,
      state: githubIssues.state,
      authorLogin: githubIssues.authorLogin,
      createdAt: githubIssues.createdAt,
      repoFullName: repositories.fullName,
      featureId: featureRequests.id,
      featureTitle: featureRequests.title,
    })
    .from(githubIssues)
    .innerJoin(repositories, eq(githubIssues.repositoryId, repositories.id))
    .leftJoin(featureRequests, eq(githubIssues.featureRequestId, featureRequests.id))
    .where(eq(githubIssues.orgId, org.id))
    .orderBy(desc(githubIssues.createdAt));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issue Triage Inbox</h1>
          <p className="text-muted-foreground mt-1">
            Review GitHub issues and link them to feature requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Listening for GitHub events...
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
              <Inbox className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-muted-foreground">No GitHub issues ingested yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {issues.map((issue) => (
              <div key={issue.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="mt-1">
                    {issue.state === 'open' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{issue.title}</h4>
                      <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                        {issue.repoFullName}#{issue.issueNumber}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Opened by {issue.authorLogin} on {new Date(issue.createdAt).toLocaleDateString()}
                    </p>
                    
                    {issue.featureId && (
                      <div className="mt-3">
                        <Link href={`/org/${slug}/features/${issue.featureId}`}>
                          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Linked to: {issue.featureTitle}
                          </Badge>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                
                <a
                  href={`https://github.com/${issue.repoFullName}/issues/${issue.issueNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
