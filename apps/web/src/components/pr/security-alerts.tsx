"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

export function SecurityAlerts({ findings = [] }: { findings?: any[] }) {
  const securityFindings = findings.filter(f => f.findingType === "SECURITY" || f.severity === "BLOCKER");

  if (securityFindings.length === 0) return null;

  return (
    <div className="space-y-4">
      {securityFindings.map(f => (
        <Alert key={f.id} variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive backdrop-blur-sm">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {f.severity === "BLOCKER" ? "Blocker Detected" : "Security Vulnerability Detected"}
          </AlertTitle>
          <AlertDescription className="text-sm mt-1">
            {f.description}
            {f.filePath && <div className="mt-2 text-xs font-mono opacity-80">in {f.filePath}{f.lineNumber ? `:${f.lineNumber}` : ''}</div>}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
