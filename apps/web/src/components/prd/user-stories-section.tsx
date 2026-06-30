"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X, Users, Plus, Trash2 } from "lucide-react";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UserStory {
  role: string;
  goal: string;
  benefit: string;
}

interface UserStoriesSectionProps {
  stories: UserStory[];
  featureId: string;
  orgId: string;
  canEdit: boolean;
}

export function UserStoriesSection({ stories, featureId, orgId, canEdit }: UserStoriesSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<UserStory[]>(JSON.parse(JSON.stringify(stories)));

  const utils = trpc.useUtils();

  const updateMutation = trpc.feature.updatePrd.useMutation({
    onSuccess: () => {
      toast.success("User stories updated");
      setIsEditing(false);
      utils.feature.getById.invalidate({ featureId, orgId });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update stories");
    },
  });

  const handleSave = () => {
    // Filter out completely empty rows just in case
    const validStories = draft.filter(s => s.role.trim() || s.goal.trim() || s.benefit.trim());
    updateMutation.mutate({ featureId, orgId, field: "userStories", value: validStories as any });
  };

  const updateStory = (index: number, field: keyof UserStory, value: string) => {
    const newDraft = [...draft];
    newDraft[index] = { ...newDraft[index], [field]: value } as UserStory;
    setDraft(newDraft);
  };

  const removeStory = (index: number) => {
    const newDraft = [...draft];
    newDraft.splice(index, 1);
    setDraft(newDraft);
  };

  const addStory = () => {
    setDraft([...draft, { role: "", goal: "", benefit: "" }]);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 shadow-sm overflow-hidden group">
      <div className="border-b border-border/50 bg-muted/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <h3 className="font-medium text-sm text-foreground">User Stories</h3>
        </div>
        {canEdit && !isEditing && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Edit
          </Button>
        )}
      </div>
      <div className="p-5">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {draft.map((story, i) => (
                <div key={i} className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-16">As a</span>
                      <Input 
                        size={1}
                        className="h-8 text-sm" 
                        value={story.role} 
                        onChange={e => updateStory(i, "role", e.target.value)} 
                        placeholder="User role..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-16">I want</span>
                      <Input 
                        size={1}
                        className="h-8 text-sm" 
                        value={story.goal} 
                        onChange={e => updateStory(i, "goal", e.target.value)} 
                        placeholder="Action or goal..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-16">So that</span>
                      <Input 
                        size={1}
                        className="h-8 text-sm" 
                        value={story.benefit} 
                        onChange={e => updateStory(i, "benefit", e.target.value)} 
                        placeholder="Value or benefit..."
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeStory(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addStory}>
              <Plus className="w-3 h-3 mr-1" /> Add Story
            </Button>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDraft(JSON.parse(JSON.stringify(stories)));
                  setIsEditing(false);
                }}
                disabled={updateMutation.isPending}
              >
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={updateMutation.isPending}
                className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {updateMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {stories.map((story, i) => (
              <div key={i} className="bg-muted/20 p-4 rounded-lg border border-border/50 space-y-1">
                <div className="text-sm">
                  <span className="text-muted-foreground">As a </span>
                  <span className="font-semibold text-foreground">{story.role}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">I want </span>
                  <span className="font-medium text-foreground">{story.goal}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">So that </span>
                  <span className="text-foreground">{story.benefit}</span>
                </div>
              </div>
            ))}
            {stories.length === 0 && (
              <div className="text-sm text-muted-foreground italic col-span-2">No user stories defined.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
