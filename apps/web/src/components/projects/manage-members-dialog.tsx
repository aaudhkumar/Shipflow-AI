"use client";

import { useState, useEffect } from "react";
import { trpc } from "~/trpc/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ManageProjectMembersDialogProps {
  orgId: string;
  projectId: string;
  projectName: string;
  currentMemberIds: string[];
}

export function ManageProjectMembersDialog({ orgId, projectId, projectName, currentMemberIds }: ManageProjectMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { data: orgMembers, isLoading: isMembersLoading } = trpc.organization.getMembers.useQuery(
    { orgId },
    { enabled: open }
  );

  const utils = trpc.useUtils();

  const updateMembersMutation = trpc.project.updateMembers.useMutation({
    onSuccess: () => {
      toast.success("Project members updated successfully");
      utils.project.getById.invalidate({ projectId });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update members: ${error.message}`);
    },
  });

  useEffect(() => {
    if (open) {
      setSelectedMembers(currentMemberIds);
    }
  }, [open, currentMemberIds]);

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) => 
      prev.includes(memberId) 
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSave = () => {
    updateMembersMutation.mutate({
      orgId,
      projectId,
      memberIds: selectedMembers,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="w-4 h-4 mr-2" />
          Manage Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
          <DialogDescription>
            Add or remove members from {projectName}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isMembersLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !orgMembers || orgMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No organization members found.</p>
          ) : (
            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
              {orgMembers.map((member: any) => {
                const user = member.user;
                const isSelected = selectedMembers.includes(member.id);
                return (
                  <div key={member.id} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors" onClick={() => toggleMember(member.id)}>
                    <Checkbox 
                      id={member.id} 
                      checked={isSelected} 
                      onCheckedChange={() => toggleMember(member.id)}
                      onClick={(e) => e.stopPropagation()} 
                    />
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                      <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || "Unnamed User"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={updateMembersMutation.isPending}
          >
            {updateMembersMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
