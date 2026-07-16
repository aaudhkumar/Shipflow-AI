"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function CreateProjectDialog({ orgId, orgSlug: _orgSlug, onSuccess }: { orgId: string; orgSlug: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Fetch repos and members for the multiselect
  const { data: repos = [] } = trpc.repository.connectedList.useQuery({ orgId }, { enabled: open });
  const { data: members = [] } = trpc.organization.getMembers.useQuery({ orgId }, { enabled: open });

  const utils = trpc.useUtils();

  const createMutation = trpc.project.create.useMutation({
    onSuccess: () => {
      toast.success("Project created successfully");
      setOpen(false);
      setName("");
      setDescription("");
      setSelectedRepos([]);
      setSelectedMembers([]);
      utils.project.list.invalidate();
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create project");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    createMutation.mutate({
      orgId,
      name,
      description,
      repositoryIds: selectedRepos,
      memberIds: selectedMembers,
    });
  };

  const toggleRepo = (id: string) => {
    setSelectedRepos(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all">
          <Plus className="w-4 h-4 mr-2" /> Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              A project groups feature requests and connects them to specific repositories and team members.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="flex justify-between items-end">
                <span>Project Name</span>
                <span className="text-muted-foreground text-xs font-normal">
                  {name.length} / 100
                </span>
              </Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value.slice(0, 100))} 
                placeholder="e.g. Mobile App Redesign" 
                disabled={createMutation.isPending}
                required
                minLength={3}
                maxLength={100}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="flex justify-between items-end">
                <span>Description (Optional)</span>
                <span className="text-muted-foreground text-xs font-normal">
                  {description.length} / 500
                </span>
              </Label>
              <textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value.slice(0, 500))} 
                placeholder="What is this project about?" 
                disabled={createMutation.isPending}
                rows={3}
                maxLength={500}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
            </div>

            <div className="grid gap-2">
              <Label>Linked Repositories</Label>
              <ScrollArea className="h-[100px] border border-border/50 rounded-md p-2">
                {repos.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">No repositories synced yet.</div>
                ) : (
                  <div className="space-y-2">
                    {repos.map((repo: any) => (
                      <div key={repo.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`repo-${repo.id}`} 
                          checked={selectedRepos.includes(repo.id)} 
                          onCheckedChange={() => toggleRepo(repo.id)}
                        />
                        <Label htmlFor={`repo-${repo.id}`} className="text-sm cursor-pointer font-normal">
                          {repo.fullName}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="grid gap-2">
              <Label>Contributors</Label>
              <ScrollArea className="h-[120px] border border-border/50 rounded-md p-2">
                {members.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">No members found.</div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member: any) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`member-${member.id}`} 
                          checked={selectedMembers.includes(member.id)} 
                          onCheckedChange={() => toggleMember(member.id)}
                        />
                        <Label htmlFor={`member-${member.id}`} className="text-sm cursor-pointer font-normal flex items-center gap-2">
                          <span>{member.user.name || member.user.email}</span>
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                            {member.role}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
