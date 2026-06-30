"use client"

import { MessageSquare, FileCode } from "lucide-react"

export function DiffViewer({ findings = [] }: { findings?: any[] }) {
  if (findings.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No findings found for this review.
      </div>
    )
  }

  // Group by file
  const byFile = findings.reduce((acc, f) => {
    if (!acc[f.filePath]) acc[f.filePath] = [];
    acc[f.filePath].push(f);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="font-mono text-sm flex flex-col">
      {(Object.entries(byFile) as [string, any[]][]).map(([filePath, fileFindings]) => (
        <div key={filePath} className="border-b border-border/30 last:border-0">
          <div className="px-4 py-2 bg-muted/30 border-b border-border/30 text-xs flex items-center gap-2 text-muted-foreground">
            <FileCode className="w-3.5 h-3.5" />
            <span>{filePath}</span>
            <span className="ml-auto text-primary">{fileFindings.length} findings</span>
          </div>
          
          <div className="bg-muted/10 flex flex-col">
            {fileFindings.map((finding) => (
              <div key={finding.id} className="p-4 border-b border-border/50 last:border-0">
                <div className="rounded-lg bg-card border border-primary/30 p-4 shadow-lg flex flex-col gap-3 font-sans relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-semibold text-sm">ShipFlow AI Insight</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                        Line {finding.lineNumber || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-card-foreground leading-relaxed">
                    {finding.description}
                  </p>
                  
                  {finding.suggestion && (
                    <div className="mt-2 rounded-md bg-muted/50 border border-border/50 overflow-hidden font-mono text-xs">
                      <div className="bg-muted px-3 py-1.5 text-muted-foreground border-b border-border/50 flex justify-between items-center">
                        <span>Suggested Fix</span>
                      </div>
                      <div className="p-3 overflow-x-auto text-emerald-400">
                        <pre><code>{finding.suggestion}</code></pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
