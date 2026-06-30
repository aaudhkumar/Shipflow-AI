"use client"

import { useState } from "react"
import { useSession, changePassword, sendVerificationEmail, forgetPassword, signOut } from "@/lib/auth-client"
import { trpc } from "~/trpc/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Key, Mail, LogOut, CheckCircle2, User, Users, Shield, CreditCard } from "lucide-react"
import { toast } from "sonner"

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    
    // Prevent duplicate script injections which confuse Razorpay's base URL resolution
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      return resolve(true)
    }
    
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function SettingsClient({ orgId }: { orgId: string }) {
  const { data: session } = useSession()
  const user = session?.user
  
  const trpcContext = trpc.useUtils()
  
  const { data: orgSettings, isLoading: isLoadingSettings } = trpc.organization.getSettings.useQuery({ orgId })
  const { data: members, isLoading: isLoadingMembers } = trpc.organization.getMembers.useQuery({ orgId })
  
  const updateSettingsMutation = trpc.organization.updateSettings.useMutation({
    onSuccess: () => {
      trpcContext.organization.getSettings.invalidate({ orgId })
    }
  })
  
  const inviteMemberMutation = trpc.organization.inviteMember.useMutation({
    onSuccess: () => {
      trpcContext.organization.getMembers.invalidate({ orgId })
      setInviteEmail("")
    }
  })
  
  const updateMemberRoleMutation = trpc.organization.updateMemberRole.useMutation({
    onSuccess: () => {
      trpcContext.organization.getMembers.invalidate({ orgId })
    }
  })
  
  const removeMemberMutation = trpc.organization.removeMember.useMutation({
    onSuccess: () => {
      trpcContext.organization.getMembers.invalidate({ orgId })
    }
  })

  const createOrderMutation = trpc.billing.createOrder.useMutation()
  const verifyPaymentMutation = trpc.billing.verifyPayment.useMutation()

  const [orgName, setOrgName] = useState(orgSettings?.name || "")
  
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"OWNER"|"ADMIN"|"PM"|"ENGINEER"|"REVIEWER"|"VIEWER">("VIEWER")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  
  // Sync state when orgSettings load
  if (orgSettings && !orgName && orgName !== orgSettings.name) {
    setOrgName(orgSettings.name)
  }

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate({
      orgId,
      name: orgName
    })
  }

  const handleInvite = () => {
    inviteMemberMutation.mutate({
      orgId,
      email: inviteEmail,
      role: inviteRole
    })
  }
  
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

  const handleBuyCredits = async () => {
    if (!user) return;
    
    const isLoaded = await loadRazorpayScript()
    if (!isLoaded) {
      toast.error("Failed to load Razorpay SDK")
      return
    }

    try {
      // Create order for 500 INR (50000 paise)
      const order = await createOrderMutation.mutateAsync({ orgId, amount: 50000 })
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "ShipFlow AI",
        description: "Purchase AI Review Credits",
        order_id: order.order_id,
        handler: async function (response: any) {
          try {
            await verifyPaymentMutation.mutateAsync({
              orgId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            toast.success("Payment successful! Credits have been added to your account.")
          } catch (error) {
            toast.error("Payment verification failed.")
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#1C1C1C",
        },
      }

      const rzp = new (window as any).Razorpay(options)
      
      rzp.on("payment.failed", function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`)
      })

      rzp.open()
    } catch (error) {
      toast.error("Failed to initiate checkout")
    }
  }

  if (!user || isLoadingSettings) {
    return <div className="p-8 flex justify-center"><div className="animate-pulse flex space-x-4"><div className="h-4 w-48 bg-muted rounded"></div></div></div>
  }

  const currentUserMember = members?.find(m => m.user.id === user.id)
  const isOwnerOrAdmin = currentUserMember?.role === "OWNER" || currentUserMember?.role === "ADMIN"

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const hasChanges = orgSettings?.name !== orgName

  return (
    <div className="max-w-6xl mx-auto pb-12 font-sans">
      <div className="mb-8">
        <h2 className="text-[32px] font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1 text-[15px]">Manage your organization profile, plan, and members.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          
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
                    {user.emailVerified && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 h-5 px-1.5 text-[10px] uppercase font-semibold tracking-wider rounded-md">
                        Verified
                      </Badge>
                    )}
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
                  <Label className="text-[14px] font-bold">Forgot password</Label>
                  <p className="text-[12px] text-muted-foreground font-medium max-w-[220px] leading-tight">Send a password reset link to your email address.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 px-3 rounded-lg border-border font-semibold shadow-sm text-[13px]"
                  onClick={async () => {
                    if (user.email) await forgetPassword({ email: user.email, redirectTo: "/reset-password" })
                  }}
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Send reset link
                </Button>
              </div>

              <div className="w-full h-px bg-border/40" />

              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-[14px] font-bold">Verify email</Label>
                  <p className="text-[12px] text-muted-foreground font-medium max-w-[220px] leading-tight">
                    {user.emailVerified ? "Your email address is already verified." : "Your email is not verified yet."}
                  </p>
                </div>
                {user.emailVerified ? (
                  <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg border-emerald-200 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 font-semibold shadow-sm text-[13px] pointer-events-none">
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Verified
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg border-border font-semibold shadow-sm text-[13px]" onClick={async () => { if (user.email) await sendVerificationEmail({ email: user.email, callbackURL: window.location.href }) }}>
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Verify now
                  </Button>
                )}
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

        {/* Right Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Organization Card */}
          <Card className="shadow-sm border-border/80 rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-5">
              <CardTitle className="text-lg font-bold tracking-tight">Organization</CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground/80 font-medium mt-1">
                Your organization's display name and current plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-[13px] font-bold">Name</Label>
                <Input 
                  id="org-name" 
                  value={orgName} 
                  onChange={e => setOrgName(e.target.value)} 
                  disabled={!isOwnerOrAdmin}
                  className="h-10 rounded-lg border-border/80 shadow-sm text-[14px] font-medium"
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Label className="text-[13px] font-bold">Plan</Label>
                  <Badge variant="secondary" className="bg-muted/60 text-muted-foreground border-transparent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md">
                    {orgSettings?.billingPlan || "ENTERPRISE"}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2 text-[11px] font-bold rounded flex items-center gap-1 border-primary/20 text-primary hover:bg-primary/5"
                    onClick={handleBuyCredits}
                    disabled={createOrderMutation.isPending}
                  >
                    <CreditCard className="w-3 h-3" /> Buy Credits
                  </Button>
                </div>
                <Button 
                  onClick={handleUpdateSettings} 
                  disabled={!hasChanges || updateSettingsMutation.isPending}
                  className={`h-9 px-4 rounded-lg font-semibold text-[13px] shadow-sm transition-all ${
                    !hasChanges ? "bg-muted text-muted-foreground/60 cursor-not-allowed opacity-100" : "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90"
                  }`}
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Members Card */}
          <Card className="shadow-sm border-border/80 rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-5">
              <CardTitle className="text-lg flex items-center gap-2 font-bold tracking-tight">
                <Users className="w-5 h-5" /> Members
              </CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground/80 font-medium mt-1">
                Invite teammates, adjust access, and remove members.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              
              {isOwnerOrAdmin && (
                <div className="flex items-end gap-3 pb-6 border-b border-border/40">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[13px] font-bold">Invite by email</Label>
                    <Input 
                      placeholder="teammate@example.com" 
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="h-10 rounded-lg border-border/80 shadow-sm text-[14px]"
                    />
                  </div>
                  <div className="w-[140px] space-y-2">
                    <Label className="text-[13px] font-bold">Role</Label>
                    <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                      <SelectTrigger className="h-10 rounded-lg border-border/80 shadow-sm font-medium text-[14px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                        <SelectItem value="REVIEWER">Reviewer</SelectItem>
                        <SelectItem value="ENGINEER">Engineer</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="OWNER">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleInvite} 
                    disabled={!inviteEmail || inviteMemberMutation.isPending}
                    className={`h-10 px-4 rounded-lg font-semibold text-[14px] shadow-sm flex items-center gap-1.5 ${
                      !inviteEmail ? "bg-muted text-muted-foreground/60 cursor-not-allowed opacity-100" : "bg-[#1C1C1C] text-white hover:bg-[#1C1C1C]/90"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Invite
                  </Button>
                </div>
              )}

              <div className="space-y-0 -mx-2">
                {isLoadingMembers ? (
                  <div className="animate-pulse space-y-4 px-2">
                    {[1, 2].map(i => (
                      <div key={i} className="h-12 bg-muted/50 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border border-border/50 shadow-sm">
                          <AvatarImage src={member.user.image || ""} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">{getInitials(member.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-[14px] leading-tight text-foreground">{member.user.name} {member.user.id === user.id && <span className="text-muted-foreground font-medium ml-1">(You)</span>}</p>
                          <p className="text-[13px] text-muted-foreground font-medium leading-tight mt-0.5">{member.user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isOwnerOrAdmin && member.user.id !== user.id ? (
                          <>
                            <Select 
                              value={member.role} 
                              onValueChange={(v: any) => updateMemberRoleMutation.mutate({ orgId, memberId: member.id, role: v })}
                            >
                              <SelectTrigger className="w-[100px] h-9 text-[13px] font-medium rounded-lg border-border/80 shadow-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                <SelectItem value="REVIEWER">Reviewer</SelectItem>
                                <SelectItem value="ENGINEER">Engineer</SelectItem>
                                <SelectItem value="PM">PM</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="OWNER">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <div className="w-[100px] h-9 px-3 flex items-center justify-between rounded-lg border border-border/80 bg-background/50 text-[13px] font-medium shadow-sm opacity-80 cursor-default">
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1).toLowerCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
