"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "~/trpc/client";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Workflow } from "lucide-react";

export default function OnboardingPage() {
  const [orgName, setOrgName] = useState("");
  const router = useRouter();
  
  // We use the session hook from better-auth to greet the user
  const { data: session, isPending } = useSession();

  const { data: organizations, isLoading: isLoadingOrgs } = trpc.organization.list.useQuery(undefined, {
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (organizations && organizations.length > 0) {
      router.push(`/org/${organizations[0]?.slug}`);
    }
  }, [organizations, router]);

  // TRPC Mutation to create an organization
  const createOrg = trpc.organization.create.useMutation({
    onSuccess: (data) => {
      toast.success("Organization created successfully");
      router.push(`/org/${data.slug}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    
    createOrg.mutate({
      name: orgName,
      slug,
    });
  };

  if (isPending || isLoadingOrgs || (organizations && organizations.length > 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-2">
          <Workflow className="h-6 w-6 text-zinc-400" />
          <span className="text-zinc-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 mb-4">
            <Workflow className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Let's set up your workspace to get started.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <form onSubmit={handleCreateOrg} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-sm font-medium">
                Organization Name
              </Label>
              <Input
                id="orgName"
                placeholder="Acme Inc."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={createOrg.isPending}
                required
                className="bg-zinc-50 dark:bg-zinc-900"
              />
              <p className="text-xs text-zinc-500">
                This is the name of your company or team.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createOrg.isPending || !orgName.trim()}
            >
              {createOrg.isPending ? "Creating Workspace..." : "Create Workspace"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
