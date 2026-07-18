"use client"

import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex-shrink-0">
                {dep.status === "SUCCESS" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {dep.status === "FAILED" && <XCircle className="w-5 h-5 text-red-500" />}
                {dep.status === "PENDING" && <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm break-all">{dep.repositoryName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 min-w-0">
                  <span className="font-mono bg-muted px-1 py-0.5 rounded text-[10px] truncate">
                    {dep.commitSha?.substring(0, 7) || 'N/A'}
                  </span>
                  <span className="truncate flex-shrink-0">• {new Date(dep.deployedAt).toLocaleString()}</span>
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
