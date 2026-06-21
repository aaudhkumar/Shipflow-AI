import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export function ActivityFeed() {
  const activities = [
    {
      id: 1,
      repo: "shipflow/api-core",
      pr: "#142",
      title: "Refactor billing webhooks",
      status: "approved",
      time: "2m ago"
    },
    {
      id: 2,
      repo: "shipflow/web",
      pr: "#98",
      title: "Add dark mode toggle",
      status: "needs_work",
      time: "15m ago"
    },
    {
      id: 3,
      repo: "shipflow/database",
      pr: "#45",
      title: "Schema migration for usage logs",
      status: "analyzing",
      time: "1h ago"
    },
    {
      id: 4,
      repo: "shipflow/api-core",
      pr: "#141",
      title: "Fix rate limiter race condition",
      status: "approved",
      time: "3h ago"
    }
  ]

  return (
    <Card className="h-full bg-card/40 backdrop-blur-md border-border/50 shadow-sm flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Recent AI Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[320px] px-6">
          <div className="space-y-4 pb-4">
            {activities.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-[-1rem] before:w-px before:bg-border/50 last:before:hidden">
                <div className="absolute left-[-4px] top-[6px] w-2 h-2 rounded-full bg-border" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{item.repo}</span>
                    <span className="text-xs text-muted-foreground/50">•</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium leading-none mb-2">{item.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">{item.pr}</Badge>
                    {item.status === "approved" && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Approved</Badge>
                    )}
                    {item.status === "needs_work" && (
                      <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Needs Work</Badge>
                    )}
                    {item.status === "analyzing" && (
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Analyzing...</Badge>
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
