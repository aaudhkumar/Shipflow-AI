import { DiffViewer } from "@/components/pr/diff-viewer"
import { SecurityAlerts } from "@/components/pr/security-alerts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GitPullRequest, ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"

export default async function PRInsightsPage({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id } = await params;
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href={`/org/${slug}`}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Refactor billing webhooks</h1>
            <Badge variant="outline" className="font-mono text-sm border-border/50">#{id}</Badge>
          </div>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <GitPullRequest className="w-4 h-4" />
            <span className="font-mono text-sm">shipflow/api-core</span>
            <span className="opacity-50">•</span>
            <span>Opened by <strong>bob-dev</strong></span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border/60 bg-background/50 backdrop-blur-sm">
            <ExternalLink className="w-4 h-4 mr-2 opacity-70" /> View on GitHub
          </Button>
        </div>
      </div>

      <SecurityAlerts />

      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden mt-8">
        <div className="border-b border-border/50 bg-muted/20 px-4 py-3 flex items-center justify-between">
          <h3 className="font-medium text-sm">AI Annotated Diff</h3>
          <Badge variant="secondary" className="text-xs font-normal">3 files changed</Badge>
        </div>
        <DiffViewer />
      </div>
    </div>
  )
}
