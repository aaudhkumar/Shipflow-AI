"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { trpc } from "~/trpc/client"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  const acceptMutation = trpc.member.acceptInvitation.useMutation({
    onSuccess: () => {
      setStatus("success")
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    },
    onError: (err) => {
      if (err.message.includes("UNAUTHORIZED")) {
        // Need to sign in first, redirect with the token
        router.push(`/register?callbackUrl=/invitations/accept?token=${token}`)
      } else {
        setStatus("error")
        setErrorMessage(err.message)
      }
    }
  })

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("No invitation token provided.")
      return
    }

    acceptMutation.mutate({ token })
  }, [token])

  return (
    <div className="max-w-md w-full p-8 text-center space-y-6">
      {status === "loading" && (
        <>
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <h1 className="text-2xl font-semibold">Accepting Invitation...</h1>
          <p className="text-muted-foreground">Please wait while we verify your invitation.</p>
        </>
      )}
      
      {status === "success" && (
        <>
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
          <h1 className="text-2xl font-semibold">Invitation Accepted!</h1>
          <p className="text-muted-foreground">You have successfully joined the organization. Redirecting you to the dashboard...</p>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="w-12 h-12 mx-auto text-destructive" />
          <h1 className="text-2xl font-semibold">Invitation Error</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
          <div className="pt-4">
            <Button onClick={() => router.push("/")} variant="outline">
              Return to Home
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Suspense fallback={<Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />}>
        <AcceptInvitationContent />
      </Suspense>
    </div>
  )
}
