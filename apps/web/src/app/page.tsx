"use client";

import Link from "next/link";
import { Workflow, ArrowRight, Github, Zap, CheckCircle2, Search, Code2, GitMerge, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-50 overflow-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="bg-zinc-900 dark:bg-zinc-100 p-1.5 rounded-md">
              <Workflow className="h-5 w-5 text-zinc-50 dark:text-zinc-900" />
            </div>
            <span>ShipFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="#features" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
              Features
            </Link>
            <Link href="#pipeline" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
              How it works
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors hidden sm:inline-block">
              Sign In
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-full px-5">
                Start Shipping
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="flex flex-col items-center text-center space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border border-zinc-200 bg-white/50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 backdrop-blur-md shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                ShipFlow AI v2.0 is now live
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="max-w-4xl text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
                Software delivery,{" "}
                <span className="text-zinc-400 dark:text-zinc-600">
                  automated.
                </span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="max-w-2xl text-lg text-zinc-600 sm:text-xl md:text-2xl dark:text-zinc-400 leading-relaxed font-medium">
                From raw feature requests to fully verified pull requests. ShipFlow seamlessly unifies PRD generation, task planning, and rigorous AI code reviews into a single workflow.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
                    Start for free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/shipflow/shipflow" target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                    <Github className="mr-2 h-4 w-4" />
                    View Documentation
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>



        {/* The Pipeline Section (Timeline + Sticky Scroll + Interactive Hover Cards) */}
        <section id="pipeline" className="py-32 bg-white dark:bg-[#09090b] border-y border-zinc-100 dark:border-zinc-800/50 relative">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-24">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">The Closed-Loop Workflow</h2>
              <p className="mt-6 text-zinc-600 dark:text-zinc-400 text-lg">
                Stop pasting prompts. Start shipping features. ShipFlow connects the entire product lifecycle into one auditable, autonomous pipeline.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-12 relative">
              {/* Left side: Timeline Steps */}
              <div className="md:w-1/2 relative">
                {/* Vertical connecting line */}
                <div className="absolute left-8 top-8 bottom-8 w-px bg-zinc-200 dark:bg-zinc-800"></div>
                
                <div className="flex flex-col gap-24 relative z-10">
                  {[
                    { title: "1. Clarify Request", icon: Search, desc: "Our AI PM checks for duplicates in your codebase and asks clarifying questions before writing a single line of code." },
                    { title: "2. Generate PRD", icon: LayoutDashboard, desc: "Automatic structured PRD generation with strictly defined user stories, acceptance criteria, and edge cases." },
                    { title: "3. Plan & Build", icon: Code2, desc: "Seamless task breakdown pushed directly to your Kanban board, ready for human or AI implementation." },
                    { title: "4. Semantic QA", icon: GitMerge, desc: "Deep, semantic code review checking pull requests against original PRD acceptance criteria—not just syntax." },
                  ].map((step, i) => (
                    <motion.div 
                      key={i} 
                      className="relative pl-24 group cursor-default"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-10%" }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                       <div className="absolute left-0 top-0 h-16 w-16 rounded-2xl bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm z-10 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300">
                          <step.icon className="h-7 w-7 text-emerald-600 dark:text-emerald-500 transform group-hover:scale-110 transition-transform duration-300" />
                       </div>
                       <h3 className="font-bold text-2xl mb-3 text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">{step.title}</h3>
                       <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">{step.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right side: Sticky Interactive Bento Card */}
              <div className="md:w-1/2 relative hidden md:block">
                <div className="sticky top-32 h-[500px] w-full">
                  <motion.div 
                    className="absolute inset-0 bg-white dark:bg-[#0c0c0e] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden group flex items-center justify-center"
                    whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(16,185,129,0.15)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="relative z-10 w-[80%]">
                       <div className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/90 p-8 backdrop-blur-sm transform transition-transform group-hover:scale-[1.03] duration-500 shadow-xl">
                          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-5">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/30">
                                   <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                                </div>
                                <div>
                                   <div className="text-base font-bold dark:text-zinc-100">ShipFlow AI Engine</div>
                                   <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase mt-0.5">Active Workspace</div>
                                </div>
                             </div>
                             <span className="text-xs font-mono bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 px-2 py-1 rounded-md text-zinc-600 dark:text-zinc-400">v2.0.4</span>
                          </div>
                          
                          <div className="space-y-5">
                             <div className="flex items-center gap-4">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div className="text-base text-zinc-600 dark:text-zinc-300 font-medium">Context verified</div>
                             </div>
                             <div className="flex items-center gap-4">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div className="text-base text-zinc-600 dark:text-zinc-300 font-medium">Dependencies resolved</div>
                             </div>
                             <div className="flex items-center gap-4 bg-zinc-100/50 dark:bg-zinc-800/30 -mx-3 px-3 py-2 rounded-lg border border-transparent group-hover:border-emerald-500/20 transition-colors">
                                <span className="relative flex h-3.5 w-3.5 ml-0.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                                </span>
                                <div className="text-base text-zinc-900 dark:text-zinc-100 font-bold ml-1">Synthesizing code...</div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="py-32">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Enterprise-grade delivery, out of the box</h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-lg">
                Designed for engineering rigor. No generic wrappers, just hard-hitting workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              
              <div className="col-span-1 md:col-span-2 bg-white dark:bg-[#0c0c0e] rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800/80 shadow-sm overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="text-2xl font-bold mb-3 relative z-10">Semantic PR Reviews</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md relative z-10">
                  Not just a syntax checker. Our AI acts as a rigorous QA reviewer, checking pull requests against specific PRD acceptance criteria.
                </p>
                {/* Mock UI snippet */}
                <div className="rounded-xl border border-zinc-200/50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 font-mono text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-500 font-sans font-bold">
                    <CheckCircle2 className="h-4 w-4" /> 
                    <span>Release Readiness Score: 98/100</span>
                  </div>
                  <span className="text-zinc-400 dark:text-zinc-500">{"// PRD Compliance Output"}</span><br/>
                  <span className="text-emerald-500">✓</span> [Req 1] Auth state persists on refresh<br/>
                  <span className="text-emerald-500">✓</span> [Req 2] Handles network timeout gracefully<br/>
                  <span className="text-amber-500">⚠</span> [Req 3] Missing analytics event on success (Non-blocking)
                </div>
              </div>

              <div className="col-span-1 bg-white dark:bg-[#0c0c0e] rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800/80 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5">
                  <Zap className="h-32 w-32" />
                </div>
                <h3 className="text-2xl font-bold mb-3 relative z-10">Lightning Fast</h3>
                <p className="text-zinc-600 dark:text-zinc-400 relative z-10">
                  Built on modern infrastructure with robust background orchestration via Inngest. No dropped webhooks, no blocking requests.
                </p>
              </div>

              <div className="col-span-1 bg-white dark:bg-[#0c0c0e] rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
                <h3 className="text-2xl font-bold mb-3">Duplicate Detection</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Our Requirement Agent instantly flags requests for features that already exist in your workspace, saving hours of wasted effort.
                </p>
              </div>

              <div className="col-span-1 md:col-span-2 bg-zinc-900 text-white rounded-3xl p-8 border border-zinc-800 shadow-xl overflow-hidden relative">
                <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-emerald-500/20 rounded-full blur-[80px]" />
                <h3 className="text-2xl font-bold mb-3 relative z-10">Automated GitHub Integration</h3>
                <p className="text-zinc-400 mb-8 max-w-md relative z-10">
                  Deeply integrated into your repositories. Installs as a GitHub App, reacting to webhooks instantly to run code analysis without manual intervention.
                </p>
                <div className="flex gap-4 relative z-10">
                  <div className="px-4 py-2 bg-black/40 border border-zinc-700 rounded-lg text-sm font-mono flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> webhook: push
                  </div>
                  <div className="px-4 py-2 bg-black/40 border border-zinc-700 rounded-lg text-sm font-mono flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> webhook: pull_request
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] py-12 text-center text-sm text-zinc-500">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 mb-4 md:mb-0">
            <Workflow className="h-5 w-5" />
            <span>ShipFlow</span>
          </div>
          <p>© {new Date().getFullYear()} ShipFlow Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
