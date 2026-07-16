"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  GitBranch,
  GitPullRequest,
  Github,
  Lock,
  Menu,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  Webhook,
  X,
} from "lucide-react";

/**
 * Shipflow — marketing landing page.
 *
 * Fixed light/dark sections regardless of the app's theme toggle — this page
 * is intentionally monochrome, with one deliberate exception: the two status
 * states in the delivery pipeline (changes requested / approved) use a
 * restrained, desaturated red and green so the outcome of a review reads at
 * a glance without breaking the rest of the black-and-white palette.
 */

const display = Inter_Tight({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const wink = localFont({ src: "../fonts/WinkySans-SemiBold.ttf", variable: "--font-wink", weight: "600" });

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.07, ease: EASE_OUT },
  }),
};

/* ---------------------------------------------------------------------- */
/*  Small reveal wrapper                                                   */
/* ---------------------------------------------------------------------- */

function Reveal({
  children,
  i = 0,
  className,
}: {
  children: React.ReactNode;
  i?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      custom={i}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Nav                                                                     */
/* ---------------------------------------------------------------------- */

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
  ];

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-colors duration-300 ${
        scrolled ? "bg-white/85 backdrop-blur-md border-b border-neutral-200" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="#top" className={`${wink.className} text-[22px] leading-none text-neutral-950 tracking-tight`}>
          shipflow<span className="text-neutral-300">.</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-neutral-500 transition-colors duration-150 hover:text-neutral-950"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/login"
            className="text-[13px] font-medium text-neutral-600 transition-colors duration-150 hover:text-neutral-950"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-950 pl-4 pr-3.5 text-[13px] font-medium text-white transition-transform duration-150 ease-out active:scale-[0.97] hover:bg-neutral-800"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-full text-neutral-900 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="overflow-hidden border-b border-neutral-200 bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex items-center gap-3 border-t border-neutral-200 px-2 pt-4">
                <Link href="/login" className="text-[14px] font-medium text-neutral-600">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-950 px-4 text-[13px] font-medium text-white"
                >
                  Get started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ---------------------------------------------------------------------- */
/*  The pipeline — shared between the hero animation and "How it works"    */
/*  Request → Product Thinking → PRD → Tasks → Implementation → Review →   */
/*  Fixes → Approval → Release                                             */
/* ---------------------------------------------------------------------- */

type Tone = "neutral" | "red" | "green";

const PIPELINE = [
  {
    key: "request",
    label: "Request",
    title: "A feature request comes in",
    body: "Someone describes what they want, in plain language — the way they'd say it out loud.",
    tone: "neutral" as Tone,
  },
  {
    key: "thinking",
    label: "Product thinking",
    title: "It gets reasoned about first",
    body: "Scope, edge cases and impact are worked through before a single line of code exists.",
    tone: "neutral" as Tone,
  },
  {
    key: "prd",
    label: "PRD",
    title: "A PRD drafts itself",
    body: "The request becomes a real product requirements doc — assumptions and all.",
    tone: "neutral" as Tone,
  },
  {
    key: "tasks",
    label: "Tasks",
    title: "The PRD becomes tasks",
    body: "Broken down into granular, assignable engineering work on your board.",
    tone: "neutral" as Tone,
  },
  {
    key: "implementation",
    label: "Implementation",
    title: "The worker writes the change",
    body: "An isolated sandbox clones the repo and opens a real diff, file by file.",
    tone: "neutral" as Tone,
  },
  {
    key: "review",
    label: "Review",
    title: "It goes up for review",
    body: "Automated checks run first, then a human takes a pass over the diff.",
    tone: "neutral" as Tone,
  },
  {
    key: "fixes",
    label: "Fixes",
    title: "Changes requested",
    body: "Feedback loops straight back to the worker — no new ticket, no context lost.",
    tone: "red" as Tone,
  },
  {
    key: "approval",
    label: "Approval",
    title: "Approved",
    body: "Once everything's addressed, the reviewer signs off.",
    tone: "green" as Tone,
  },
  {
    key: "release",
    label: "Release",
    title: "Merged and released",
    body: "Shipped to main, deployed, and the board updates itself — automatically.",
    tone: "neutral" as Tone,
  },
] as const;

type PipelineKey = (typeof PIPELINE)[number]["key"];

function toneRing(tone: Tone, variant: "light" | "dark", active: boolean) {
  if (tone === "green") {
    return active
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : variant === "dark"
        ? "border-emerald-500/25 text-emerald-400/70"
        : "border-emerald-200 text-emerald-600/70";
  }
  if (tone === "red") {
    return active
      ? "border-red-300 bg-red-50 text-red-700"
      : variant === "dark"
        ? "border-red-500/25 text-red-400/70"
        : "border-red-200 text-red-600/70";
  }
  if (variant === "dark") {
    return active ? "border-white bg-white text-neutral-950" : "border-white/15 text-white/45";
  }
  return active ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 text-neutral-400";
}

function toneCard(tone: Tone, variant: "light" | "dark") {
  if (tone === "green") {
    return variant === "dark"
      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
      : "border-emerald-200 bg-emerald-50/60";
  }
  if (tone === "red") {
    return variant === "dark" ? "border-red-500/25 bg-red-500/[0.06]" : "border-red-200 bg-red-50/60";
  }
  return variant === "dark" ? "border-white/10 bg-white/[0.03]" : "border-neutral-200 bg-neutral-50";
}

function toneText(tone: Tone, variant: "light" | "dark") {
  if (tone === "green") return variant === "dark" ? "text-emerald-300" : "text-emerald-700";
  if (tone === "red") return variant === "dark" ? "text-red-300" : "text-red-700";
  return variant === "dark" ? "text-white/70" : "text-neutral-600";
}

/** The small illustrative snippet for a given pipeline stage. Reused (at two sizes) in the hero and in "How it works". */
function PipelineVisual({ stageKey, variant }: { stageKey: PipelineKey; variant: "light" | "dark" }) {
  const dark = variant === "dark";
  const mutedText = dark ? "text-white/40" : "text-neutral-400";
  const bodyText = dark ? "text-white/75" : "text-neutral-700";

  if (stageKey === "request") {
    return (
      <div className={`rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        <p className={`${mono.className} text-[11px] ${mutedText}`}>feature request · #218</p>
        <p className={`mt-2 text-[13.5px] ${bodyText}`}>Add saved filters to the tasks view.</p>
      </div>
    );
  }
  if (stageKey === "thinking") {
    return (
      <div className={`space-y-2 rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        {["Scope: list view only", "Edge case: filters + search combined", "No schema migration needed"].map((l) => (
          <div key={l} className="flex items-start gap-2">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dark ? "bg-white/40" : "bg-neutral-400"}`} />
            <span className={`text-[12.5px] ${bodyText}`}>{l}</span>
          </div>
        ))}
      </div>
    );
  }
  if (stageKey === "prd") {
    return (
      <div className={`space-y-2 rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        {["Persist filter state per user", "Support up to 5 saved filters", "Expose via REST + UI"].map((l) => (
          <div key={l} className="flex items-start gap-2">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dark ? "bg-white/40" : "bg-neutral-400"}`} />
            <span className={`text-[12.5px] ${bodyText}`}>{l}</span>
          </div>
        ))}
      </div>
    );
  }
  if (stageKey === "tasks") {
    return (
      <div className={`space-y-2.5 rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        {["Add filters table migration", "Build save / apply UI", "Write the API endpoint"].map((l) => (
          <div key={l} className="flex items-center gap-2.5">
            <span className={`h-3.5 w-3.5 shrink-0 rounded-[3px] border ${dark ? "border-white/30" : "border-neutral-300"}`} />
            <span className={`${mono.className} text-[12px] ${bodyText}`}>{l}</span>
          </div>
        ))}
      </div>
    );
  }
  if (stageKey === "implementation") {
    const diff = [
      { t: "type TaskFilter = {", k: "ctx" as const },
      { t: "  id: string; label: string; query: Query;", k: "add" as const },
      { t: "};", k: "ctx" as const },
      { t: "const filters = useFilters(userId);", k: "add" as const },
    ];
    return (
      <div className={`${mono.className} space-y-1 rounded-lg border p-4 text-[11.5px] leading-relaxed ${toneCard("neutral", variant)}`}>
        {diff.map((l) => (
          <div
            key={l.t}
            className={`flex gap-2 rounded px-1.5 ${l.k === "add" ? (dark ? "bg-white/[0.06]" : "bg-neutral-100") : ""}`}
          >
            <span className={mutedText}>{l.k === "add" ? "+" : " "}</span>
            <span className={bodyText}>{l.t}</span>
          </div>
        ))}
      </div>
    );
  }
  if (stageKey === "review") {
    return (
      <div className={`space-y-2.5 rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        <div className="flex items-start gap-2.5">
          <MessageSquare className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${mutedText}`} strokeWidth={1.6} />
          <span className={`text-[12.5px] ${bodyText}`}>Left a comment on line 42</span>
        </div>
        <div className="flex items-start gap-2.5">
          <MessageSquare className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${mutedText}`} strokeWidth={1.6} />
          <span className={`text-[12.5px] ${bodyText}`}>Rename <code className={mono.className}>filterId</code> → <code className={mono.className}>savedFilterId</code></span>
        </div>
      </div>
    );
  }
  if (stageKey === "fixes") {
    return (
      <div className={`rounded-lg border p-4 ${toneCard("red", variant)}`}>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${toneText("red", variant)}`}>
          <RotateCcw className="h-3 w-3" />
          Changes requested
        </span>
        <p className={`mt-2.5 text-[12.5px] ${bodyText}`}>
          Renamed <code className={mono.className}>filterId</code> → <code className={mono.className}>savedFilterId</code> and pushed a new commit.
        </p>
      </div>
    );
  }
  if (stageKey === "approval") {
    return (
      <div className={`rounded-lg border p-4 ${toneCard("green", variant)}`}>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${toneText("green", variant)}`}>
          <Check className="h-3 w-3" />
          Approved
        </span>
        <p className={`mt-2.5 text-[12.5px] ${bodyText}`}>&ldquo;LGTM — nice and small.&rdquo;</p>
      </div>
    );
  }
  return (
    <div className={`rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
      <div className="flex items-center gap-2.5">
        <GitPullRequest className={`h-4 w-4 shrink-0 ${bodyText}`} strokeWidth={1.6} />
        <span className={`text-[13px] ${bodyText}`}>Merged to main</span>
      </div>
      <p className={`${mono.className} mt-2 text-[11px] ${mutedText}`}>task-218 · deployed to production</p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Hero — condensed pipeline, beneath the header                          */
/* ---------------------------------------------------------------------- */

function HeroWindow() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setStage((s) => (s + 1) % PIPELINE.length), 2500);
    return () => clearInterval(t);
  }, [reduce]);

  const current = PIPELINE[stage] ?? PIPELINE[0];

  return (
    <div className="mx-auto w-full">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_60px_-24px_rgba(0,0,0,0.18)]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full border border-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full border border-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full border border-neutral-300" />
          <span className={`${mono.className} ml-3 text-[11px] tracking-wide text-neutral-400`}>
            shipflow / feature-218
          </span>
        </div>

        {/* pipeline rail */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-neutral-100 px-4 py-3.5 sm:justify-center sm:gap-2 sm:px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {PIPELINE.map((p, i) => (
            <button
              key={p.key}
              aria-label={p.label}
              onClick={() => setStage(i)}
              className={`${mono.className} shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors duration-200 ${toneRing(
                p.tone,
                "light",
                i === stage
              )}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative h-[220px] px-6 py-6 sm:h-[230px] sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, filter: "blur(6px)", scale: 0.98 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(6px)", scale: 0.98 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="flex h-full flex-col justify-center"
            >
              <span className={`${mono.className} mb-3 text-[11px] uppercase tracking-widest text-neutral-400`}>
                {current.title}
              </span>
              <div className="max-w-md">
                <PipelineVisual stageKey={current.key} variant="light" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {PIPELINE.map((p, i) => (
          <button
            key={p.key}
            aria-label={`Show ${p.label} stage`}
            onClick={() => setStage(i)}
            className="relative h-1.5 rounded-full bg-neutral-200"
            style={{ width: i === stage ? 20 : 10 }}
          >
            {i === stage && (
              <motion.span
                layoutId="hero-dot"
                className={`absolute inset-0 rounded-full ${
                  p.tone === "green" ? "bg-emerald-500" : p.tone === "red" ? "bg-red-500" : "bg-neutral-900"
                }`}
                transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-white pb-28 pt-32 sm:pb-36 sm:pt-40">
      <div className="mx-auto max-w-[1536px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 xl:grid-cols-[1.2fr_1fr]">
          <div className="text-left shrink-0">
            <Reveal>
              <span className={`${mono.className} inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-[11px] uppercase tracking-widest text-neutral-500`}>
                <CircleDot className="h-3 w-3" />
                From request to release
              </span>
            </Reveal>

            <Reveal i={1}>
              <h1 className={`${display.className} mt-8 text-[42px] font-semibold leading-[1.06] tracking-tight text-neutral-950 sm:text-6xl md:text-[68px] whitespace-nowrap`}>
                Describe the feature.
                <br />
                <span className="text-neutral-400">Watch it ship itself.</span>
              </h1>
            </Reveal>

            <Reveal i={2}>
              <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-neutral-500 sm:text-[18px]">
                Every request moves through the same path — thinking, a PRD, tasks, code, review,
                and release — until it&rsquo;s a merged pull request your team never had to write by hand.
              </p>
            </Reveal>

            <Reveal i={3}>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-neutral-950 px-7 text-[15px] font-medium text-white transition-transform duration-150 ease-out active:scale-[0.97] hover:bg-neutral-800"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#process"
                  className="inline-flex h-12 items-center gap-1.5 px-3 text-[15px] font-medium text-neutral-700 transition-colors hover:text-neutral-950"
                >
                  See how it works
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: EASE_OUT }}
            className="w-full"
          >
            <HeroWindow />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/*  Features                                                                */
/* ---------------------------------------------------------------------- */

const features = [
  {
    icon: Sparkles,
    title: "Autonomous code worker",
    body: "Assign a task and an isolated sandbox clones your repo, writes the code across an agentic loop, and pushes a branch — no human types the diff.",
  },
  {
    icon: GitBranch,
    title: "AI-assisted planning",
    body: "A one-line idea becomes a full PRD, then granular engineering tasks, with a clarification pass to close gaps before any code is written.",
  },
  {
    icon: ShieldCheck,
    title: "Secret scanning, by default",
    body: "Every file the worker writes passes an entropy-based scanner before it's saved, so credentials never slip into a commit.",
  },
  {
    icon: Webhook,
    title: "Bi-directional GitHub sync",
    body: "Install the app once. Webhooks keep pull request state, checks, and reviews mirrored back onto your board in real time.",
  },
  {
    icon: Users,
    title: "Multi-tenant by design",
    body: "Organizations, projects, and PRDs are strictly isolated. Google or GitHub sign-in, with role-based access for who can invite whom.",
  },
  {
    icon: Lock,
    title: "Whitelisted execution",
    body: "The worker can lint, build, and test — nothing else. Arbitrary shell commands are refused at the sandbox boundary.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-xl">
          <span className={`${mono.className} text-[11px] uppercase tracking-widest text-neutral-400`}>Platform</span>
          <h2 className={`${display.className} mt-4 text-[32px] font-semibold tracking-tight text-neutral-950 sm:text-[42px]`}>
            Everything between the idea and the merge.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} i={i} className="group bg-white p-8 transition-colors duration-200 hover:bg-neutral-50">
              <f.icon className="h-5 w-5 text-neutral-900 transition-transform duration-200 group-hover:-translate-y-0.5" strokeWidth={1.6} />
              <h3 className="mt-5 text-[16px] font-medium text-neutral-950">{f.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-neutral-500">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/*  Process — "How it works". Dark, spacious, the full nine-step pipeline  */
/* ---------------------------------------------------------------------- */

function ProcessStep({ stage, i }: { stage: (typeof PIPELINE)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="relative grid grid-cols-[auto_1fr] gap-6 sm:grid-cols-[64px_1fr] sm:gap-10">
      <div className="flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className={`${mono.className} grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-black text-[12px] ${toneRing(
            stage.tone,
            "dark",
            false
          )}`}
        >
          {String(i + 1).padStart(2, "0")}
        </motion.span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT }}
        className="pb-20 sm:pb-28"
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-[20px] font-medium text-white sm:text-[22px]">{stage.title}</h3>
          {stage.tone !== "neutral" && (
            <span
              className={`${mono.className} rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${toneRing(
                stage.tone,
                "dark",
                true
              )}`}
            >
              {stage.label}
            </span>
          )}
        </div>
        <p className="mt-2.5 max-w-md text-[14.5px] leading-relaxed text-white/50">{stage.body}</p>
        <div className="mt-5 max-w-sm">
          <PipelineVisual stageKey={stage.key} variant="dark" />
        </div>
      </motion.div>
    </div>
  );
}

function Process() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.75", "end 0.6"],
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="process" ref={sectionRef} className="relative bg-black py-28 sm:py-40">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal className="max-w-lg">
          <span className={`${mono.className} text-[11px] uppercase tracking-widest text-white/40`}>How it works</span>
          <h2 className={`${display.className} mt-4 text-[32px] font-semibold tracking-tight text-white sm:text-[42px]`}>
            From feature request to release.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/45">
            Nine steps, always in the same order. Review can send work back for fixes before it&rsquo;s
            approved — nothing reaches production without both.
          </p>
        </Reveal>

        <div className="relative mt-20">
          <svg className="pointer-events-none absolute left-[19px] top-2 hidden h-full w-px sm:block" width="2" preserveAspectRatio="none">
            <line x1="1" y1="0" x2="1" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <motion.line x1="1" y1="0" x2="1" y2="100%" stroke="rgba(255,255,255,0.55)" strokeWidth="1" style={{ pathLength }} />
          </svg>

          <div className="space-y-0">
            {PIPELINE.map((stage, i) => (
              <ProcessStep key={stage.key} stage={stage} i={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/*  Pricing (compact)                                                       */
/* ---------------------------------------------------------------------- */

const plans = [
  { name: "Basic", price: "₹0", note: "Ideal for Individuals or small teams", features: ["Up to 3 connected repositories.", "10 AI PR reviews per month.", "Basic PRD generation.", "Standard community support."], cta: "Get started", highlighted: false },
  { name: "Premium", price: "₹499", note: "/ per month", features: ["Unlimited repositories.", "30 AI PR reviews per month.", "Advanced PRD generation & Planner agent.", "Automated AI Code Reviewer.", "Priority email support."], cta: "Get started", highlighted: true },
  { name: "Custom", price: "₹19", note: "/ per month", features: ["Unlimited repositories.", "70 AI PR reviews per month.", "Custom AI integrations.", "Dedicated Slack channel.", "24/7 Enterprise support."], cta: "Get started", highlighted: false },
];

function Pricing() {
  return (
    <section id="pricing" className="bg-white py-28 sm:py-36">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Reveal className="text-center">
          <span className={`${mono.className} text-[11px] uppercase tracking-widest text-neutral-400`}>Pricing</span>
          <h2 className={`${display.className} mx-auto mt-4 max-w-md text-[32px] font-semibold tracking-tight text-neutral-950 sm:text-[42px]`}>
            Simple, usage-based plans.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} i={i}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-7 ${
                  p.highlighted ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-950"
                }`}
              >
                <p className="text-[14px] font-medium">{p.name}</p>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-[34px] font-semibold tracking-tight">{p.price}</span>
                  <span className={`text-[13px] ${p.highlighted ? "text-white/50" : "text-neutral-400"}`}>{p.note}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[13.5px]">
                      <Check className={`h-3.5 w-3.5 shrink-0 ${p.highlighted ? "text-white/70" : "text-neutral-400"}`} />
                      <span className={p.highlighted ? "text-white/80" : "text-neutral-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-7 inline-flex h-10 items-center justify-center rounded-full text-[13.5px] font-medium transition-transform duration-150 ease-out active:scale-[0.97] ${
                    p.highlighted ? "bg-white text-neutral-950 hover:bg-neutral-100" : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/*  Testimonials (compact)                                                  */
/* ---------------------------------------------------------------------- */

const quotes = [
  { name: "Priya Nair", role: "Eng lead, Aster Labs", text: "We link a repo, write the task like a Jira ticket, and the PR shows up before standup." },
  { name: "Marcus Webb", role: "CTO, Fielder", text: "The secret scanner catching a stray key in a generated file was the moment we trusted it in prod repos." },
  { name: "Ines Dahl", role: "Staff engineer, Loft", text: "PRD generation alone saved our planning meetings — tasks arrive already broken down." },
];

function Testimonials() {
  return (
    <section id="testimonials" className="bg-neutral-50 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-lg">
          <span className={`${mono.className} text-[11px] uppercase tracking-widest text-neutral-400`}>Teams shipping with it</span>
          <h2 className={`${display.className} mt-4 text-[32px] font-semibold tracking-tight text-neutral-950 sm:text-[42px]`}>
            Ask the people already merging.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {quotes.map((q, i) => (
            <Reveal key={q.name} i={i}>
              <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-7">
                <p className="text-[15px] leading-relaxed text-neutral-800">&ldquo;{q.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-5">
                  <div className={`${wink.className} grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-950 text-[13px] text-white`}>
                    {q.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-medium text-neutral-950">{q.name}</p>
                    <p className="text-[12.5px] text-neutral-400">{q.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/*  Final — GitHub automation                                               */
/* ---------------------------------------------------------------------- */

const chips = ["Pull request opened", "Checks synced", "Board updated", "Reviewer requested"];

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-black py-28 text-center sm:py-40">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <Reveal className="flex justify-center">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/[0.04]">
            <Github className="h-6 w-6 text-white" strokeWidth={1.5} />
          </span>
        </Reveal>

        <Reveal i={1}>
          <h2 className={`${display.className} mt-8 text-[32px] font-semibold leading-tight tracking-tight text-white sm:text-[46px]`}>
            It already knows GitHub.
          </h2>
        </Reveal>

        <Reveal i={2}>
          <p className="mx-auto mt-5 max-w-md text-[15.5px] leading-relaxed text-white/50">
            Every merge, check, and review syncs back to your board automatically — no polling, no manual
            status updates, no second source of truth.
          </p>
        </Reveal>

        <Reveal i={3}>
          <div className="mx-auto mt-9 flex max-w-md flex-wrap items-center justify-center gap-2">
            {chips.map((c, i) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/60"
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-white/60"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
                />
                {c}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal i={4}>
          <div className="mt-10">
            <Link
              href="/register"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-medium text-neutral-950 transition-transform duration-150 ease-out active:scale-[0.97] hover:bg-neutral-100"
            >
              Connect your repo
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-4 text-[12.5px] text-white/35">No credit card required.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/*  Footer                                                                  */
/* ---------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 sm:flex-row sm:px-8">
        <Link href="#top" className={`${wink.className} text-[18px] text-neutral-950`}>
          shipflow<span className="text-neutral-300">.</span>
        </Link>
        <p className="text-[12.5px] text-neutral-400">© {new Date().getFullYear()} Shipflow. Built for teams that ship.</p>
        <div className="flex items-center gap-5 text-[13px] text-neutral-500">
          <a href="#features" className="hover:text-neutral-950">Features</a>
          <a href="#pricing" className="hover:text-neutral-950">Pricing</a>
          <a href="#testimonials" className="hover:text-neutral-950">Testimonials</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------------- */
/*  Page                                                                    */
/* ---------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable} ${wink.variable} min-h-screen bg-white font-[family-name:var(--font-body)] text-neutral-950 antialiased selection:bg-neutral-950 selection:text-white`}>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Process />
        <Pricing />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}