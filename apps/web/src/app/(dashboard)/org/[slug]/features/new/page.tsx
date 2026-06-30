"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function NewFeaturePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const { data: org } = trpc.organization.getBySlug.useQuery({ slug });
  const { data: projects } = trpc.project.list.useQuery(
    { orgId: org?.id! }, 
    { enabled: !!org?.id }
  );
  
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialProjectId = searchParams?.get("projectId") || "";

  const [projectId, setProjectId] = useState(initialProjectId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("IN_APP");
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Load from session storage
  useEffect(() => {
    setIsMounted(true);
    const saved = sessionStorage.getItem(`new-feature-${slug}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.channel) setChannel(data.channel);
        if (data.projectId && !initialProjectId) setProjectId(data.projectId);
      } catch (e) {}
    }
  }, [slug, initialProjectId]);

  // Save to session storage
  useEffect(() => {
    if (isMounted) {
      const data = { title, description, channel, projectId };
      sessionStorage.setItem(`new-feature-${slug}`, JSON.stringify(data));
    }
  }, [title, description, channel, projectId, slug, isMounted]);

  // Update initial project ID once projects load if not set from URL or session storage
  useEffect(() => {
    if (projects && projects.length > 0 && !projectId && !initialProjectId) {
      setProjectId(projects[0]!.id);
    }
  }, [projects, projectId, initialProjectId]);

  const createFeature = trpc.feature.create.useMutation({
    onSuccess: (data) => {
      sessionStorage.removeItem(`new-feature-${slug}`);
      if (data?.id) {
        router.push(`/org/${slug}/features/${data.id}`);
      } else {
        router.push(`/org/${slug}/features`);
      }
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!org?.id) {
      setError("Organization not found");
      return;
    }
    
    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    createFeature.mutate({
      orgId: org.id,
      projectId,
      title,
      rawDescription: description,
      sourceChannel: channel as "IN_APP" | "EMAIL" | "TICKET" | "CALL",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href={`/org/${slug}/features`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Features
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request a New Feature</h1>
        <p className="text-muted-foreground mt-1">
          Describe what you want to build. Our AI will help clarify the requirements.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Feature Title
            </label>
            <input
              type="text"
              id="title"
              required
              minLength={3}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g. Add dark mode support"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="project" className="text-sm font-medium">
              Project
            </label>
            <select
              id="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="" disabled>Select a project</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="channel" className="text-sm font-medium">
              Source Channel
            </label>
            <select
              id="channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="IN_APP">In-App Feedback</option>
              <option value="EMAIL">Email Request</option>
              <option value="TICKET">Support Ticket</option>
              <option value="CALL">Customer Call</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium flex justify-between">
              <span>Detailed Description</span>
              <span className="text-muted-foreground text-xs font-normal">
                {description.length} characters
              </span>
            </label>
            <textarea
              id="description"
              rows={6}
              required
              minLength={10}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the problem, use cases, and how it should work..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Write a detailed description. If it's too vague, our AI Clarifier will ask you follow-up questions.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createFeature.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {createFeature.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
