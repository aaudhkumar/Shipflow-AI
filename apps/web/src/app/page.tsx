import Link from "next/link";
import { Workflow, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Workflow className="h-5 w-5" />
            <span>ShipFlow</span>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              Sign In
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="flex flex-col items-center text-center space-y-8">
            
            <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
              ShipFlow AI v2.0 is now live
            </div>
            
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Software delivery,{" "}
              <span className="text-zinc-400 dark:text-zinc-500">
                automated.
              </span>
            </h1>
            
            <p className="max-w-2xl text-lg text-zinc-500 sm:text-xl md:text-2xl dark:text-zinc-400">
              From raw feature requests to fully verified pull requests. ShipFlow seamlessly unifies PRD generation, task planning, and rigorous AI code reviews into one single workflow.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="https://github.com/shipflow/shipflow" target="_blank" rel="noreferrer">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  <Github className="mr-2 h-4 w-4" />
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Minimal Feature Mockup / Divider */}
        <div className="container mx-auto px-4 pb-24">
          <div className="relative mx-auto max-w-5xl rounded-xl border border-zinc-200 bg-zinc-50/50 p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur-sm">
            <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 flex flex-col h-[400px] overflow-hidden">
               {/* Window Controls Mock */}
               <div className="flex h-12 items-center border-b border-zinc-100 px-4 dark:border-zinc-900">
                 <div className="flex gap-2">
                   <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                   <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                   <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                 </div>
               </div>
               {/* Body Mock */}
               <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/20 p-8 flex items-center justify-center">
                  <div className="text-zinc-400 dark:text-zinc-600 font-medium">Dashboard Interface Preview</div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-sm text-zinc-500">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} ShipFlow Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
