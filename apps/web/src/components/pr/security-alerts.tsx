"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

export function SecurityAlerts() {
  return (
    <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive backdrop-blur-sm">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle className="font-semibold">Security Vulnerability Detected</AlertTitle>
      <AlertDescription className="text-sm mt-1">
        The AI has detected a potential timing attack vector in <code className="bg-destructive/10 px-1 py-0.5 rounded text-xs">verifySignature()</code>. 
        You should use a constant-time comparison function (e.g. <code className="bg-destructive/10 px-1 py-0.5 rounded text-xs">crypto.timingSafeEqual</code>) instead of standard string equality.
      </AlertDescription>
    </Alert>
  )
}
