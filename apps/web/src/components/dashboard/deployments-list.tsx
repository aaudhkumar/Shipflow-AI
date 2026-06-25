"use client"

import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const dummyDeployments = [
  {
    id: "1",
    repo: "acme/frontend",
    env: "production",
    commit: "7d8e9f0",
    status: "SUCCESS",
    time: "2 mins ago",
    url: "https://acme.vercel.app"
  },
  {
    id: "2",
    repo: "acme/api",
    env: "preview",
    commit: "3a4b5c6",
    status: "PENDING",
    time: "15 mins ago",
  },
  {
    id: "3",
    repo: "acme/backend",
    env: "production",
    commit: "1x2y3z4",
    status: "FAILED",
    time: "2 hours ago",
  }
]

export function DeploymentsList({ deployments = [] }: { deployments?: any[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Recent Deployments</h3>
      </div>
      <div className="flex flex-col gap-3">
        {deployments.length === 0 ? (
          <div className="text-sm text-muted-foreground pt-4 pb-4">No deployments yet</div>
        ) : (
          deployments.map((dep) => (
            <div key={dep.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50 hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {dep.status === "SUCCESS" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {dep.status === "FAILED" && <XCircle className="w-5 h-5 text-red-500" />}
                {dep.status === "PENDING" && <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{dep.repo}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase bg-primary/10 text-primary">
                    {dep.env}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">{dep.commit}</span>
                  <span>• {dep.time}</span>
                </div>
              </div>
            </div>
            
            {dep.url && (
              <a 
                href={dep.url} 
                target="_blank" 
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors p-2"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          ))
        )}
      </div>
    </div>
  )
}
