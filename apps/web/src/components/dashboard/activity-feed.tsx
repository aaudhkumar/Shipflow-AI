import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export function ActivityFeed({ activities = [] }: { activities?: any[] }) {

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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
