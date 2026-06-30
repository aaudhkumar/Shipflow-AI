"use client"

import { useState } from "react"
import { useSession, changePassword, signOut } from "@/lib/auth-client"
import { trpc } from "~/trpc/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Key, LogOut, User, Shield, Mail, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export function SettingsClient({ orgId }: { orgId: string }) {
  const { data: session } = useSession()
  const user = session?.user
  
  const trpcContext = trpc.useUtils()
  
  const { data: orgSettings, isLoading: isLoadingSettings } = trpc.organization.getSettings.useQuery({ orgId })
  const { data: members, isLoading: isLoadingMembers } = trpc.organization.getMembers.useQuery({ orgId })

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  
  const handleChangePassword = async () => {
    await changePassword({
      newPassword,
      currentPassword,
      revokeOtherSessions: true
    })
    setIsChangePasswordOpen(false)
    setCurrentPassword("")
    setNewPassword("")
  }

  if (!user || isLoadingSettings) {
    return <div className="p-8 flex justify-center"><div className="animate-pulse flex space-x-4"><div className="h-4 w-48 bg-muted rounded"></div></div></div>
  }

  const currentUserMember = members?.find(m => m.user.id === user.id)

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-6xl mx-auto pb-12 font-sans">
      <div className="mb-8">
        <h2 className="text-[32px] font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1 text-[15px]">Manage your organization profile, plan, and members.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Profile Card */}
          <Card className="shadow-sm border-border/80 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 shadow-sm border border-border/50">
                  <AvatarImage src={user.image || ""} />
                  <AvatarFallback className="bg-[#1C1C1C] text-white text-xl font-medium">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[19px] tracking-tight">{user.name}</h3>
                    <Badge className="bg-[#1C1C1C] hover:bg-[#1C1C1C]/90 text-white border-transparent text-[11px] h-5 px-2 font-medium rounded-full flex items-center gap-1">
                      <Shield className="w-[10px] h-[10px]" />
                      {currentUserMember ? currentUserMember.role.charAt(0).toUpperCase() + currentUserMember.role.slice(1).toLowerCase() : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground font-medium">
                    <Mail className="w-[14px] h-[14px]" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground font-medium">
                    <User className="w-[14px] h-[14px]" />
                    <span>Member since {joinDate}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="shadow-sm border-border/80 rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-bold tracking-tight">
                <Key className="w-5 h-5" /> Security
              </CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground/80 font-medium">
                Update your password, verify your email, or sign out.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-5">
              
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-[14px] font-bold">Password</Label>
                  <p className="text-[12px] text-muted-foreground font-medium max-w-[220px] leading-tight">Change your password. All other sessions will be revoked automatically.</p>
                </div>
                <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg border-border font-semibold shadow-sm text-[13px]">
                      <Key className="mr-1.5 h-3.5 w-3.5" />
                      Change password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                      <Button onClick={handleChangePassword}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="w-full h-px bg-border/40" />

              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-[14px] font-bold">Sign out</Label>
                  <p className="text-[12px] text-muted-foreground font-medium max-w-[220px] leading-tight">End your current session and return to the login screen.</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="h-9 px-3 rounded-lg bg-[#E0142C] hover:bg-[#C91227] font-semibold shadow-sm text-[13px]"
                  onClick={async () => await signOut()}
                >
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Sign out
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        </div>
      </div>
    </div>
  )
}
