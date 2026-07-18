"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
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
  Quote,
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
 *
 * Animation pass: every section gets its own motion signature (spring
 * pop-ins, magnetic buttons, tilt cards, kinetic type, an infinite marquee,
 * cursor-linked glow, a scroll progress rail) instead of one repeated
 * fade/ease-out. Durations, easing and purpose follow Emil Kowalski's
 * design-engineering rules: ease-out for entrances, springs for anything
 * that should feel alive, under 300ms for UI feedback, longer only for
 * marketing/explanatory moments, and prefers-reduced-motion is respected
 * throughout.
 */

const display = Inter_Tight({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const wink = localFont({ src: "../fonts/WinkySans-SemiBold.ttf", variable: "--font-wink", weight: "600" });

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
const SPRING_POP = { type: "spring" as const, stiffness: 340, damping: 26, mass: 0.7 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 180, damping: 22 };

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay: i * 0.07, ease: EASE_OUT },
  }),
};

/* ---------------------------------------------------------------------- */
/*  Grain — a barely-there texture over the whole page. Pure monochrome,   */
/*  breaks up flat fields without ever reading as decoration.              */
/* ---------------------------------------------------------------------- */

function Grain() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[999] h-full w-full opacity-[0.025] mix-blend-overlay" aria-hidden>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

/* ---------------------------------------------------------------------- */
/*  Scroll progress rail                                                   */
/* ---------------------------------------------------------------------- */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 260, damping: 40, mass: 0.3 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[60] h-[2px] w-full origin-left bg-neutral-950"
    />
  );
}

/* ---------------------------------------------------------------------- */
/*  Magnetic wrapper — button/element eases toward the cursor within a     */
/*  radius, then springs back. Used sparingly (primary CTAs only) per the  */
/*  "seen a hundred times a day → don't animate" rule.                     */
/* ---------------------------------------------------------------------- */

function Magnetic({ children, strength = 0.35 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING_SOFT);
  const sy = useSpring(y, SPRING_SOFT);

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

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
/*  Kinetic headline — words rise + unblur in a stagger, not a block fade.  */
/* ---------------------------------------------------------------------- */

function KineticWords({ text, className, delayBase = 0 }: { text: string; className?: string; delayBase?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0, rotate: 1.5 }}
            animate={{ y: "0%", opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: delayBase + i * 0.045, ease: EASE_OUT }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/*  Nav                                                                     */
/* ---------------------------------------------------------------------- */

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="group relative text-[13px] font-medium text-neutral-500 transition-colors duration-150 hover:text-neutral-950">
      {label}
      <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-neutral-950 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-x-100" />
    </a>
  );
}

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
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
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
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/login"
            className="text-[13px] font-medium text-neutral-600 transition-colors duration-150 hover:text-neutral-950"
          >
            Sign in
          </Link>
          <Magnetic strength={0.25}>
            <Link
              href="/register"
              className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-950 pl-4 pr-3.5 text-[13px] font-medium text-white transition-transform duration-150 ease-out active:scale-[0.97] hover:bg-neutral-800"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Magnetic>
        </div>

        <motion.button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.9 }}
          className="grid h-9 w-9 place-items-center rounded-full text-neutral-900 md:hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "x" : "menu"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="grid place-items-center"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
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
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: EASE_OUT }}
                  className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {l.label}
                </motion.a>
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
    </motion.header>
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

  const listItem = {
    hidden: { opacity: 0, x: -8 },
    show: (i: number) => ({ opacity: 1, x: 0, transition: { duration: 0.35, delay: i * 0.06, ease: EASE_OUT } }),
  };

  if (stageKey === "request") {
    return (
      <div className={`rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        <p className={`${mono.className} text-[11px] ${mutedText}`}>feature request · #218</p>
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: EASE_OUT }}
          className={`mt-2 text-[13.5px] ${bodyText}`}
        >
          Add saved filters to the tasks view.
        </motion.p>
      </div>
    );
  }
  if (stageKey === "thinking") {
    return (
      <div className={`space-y-2 rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        {["Scope: list view only", "Edge case: filters + search combined", "No schema migration needed"].map((l, i) => (
          <motion.div key={l} variants={listItem} custom={i} initial="hidden" animate="show" className="flex items-start gap-2">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dark ? "bg-white/40" : "bg-neutral-400"}`} />
            <span className={`text-[12.5px] ${bodyText}`}>{l}</span>
          </motion.div>
        ))}
      </div>
    );
  }
  if (stageKey === "prd") {
    return (
      <div className={`space-y-2 rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        {["Persist filter state per user", "Support up to 5 saved filters", "Expose via REST + UI"].map((l, i) => (
          <motion.div key={l} variants={listItem} custom={i} initial="hidden" animate="show" className="flex items-start gap-2">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dark ? "bg-white/40" : "bg-neutral-400"}`} />
            <span className={`text-[12.5px] ${bodyText}`}>{l}</span>
          </motion.div>
        ))}
      </div>
    );
  }
  if (stageKey === "tasks") {
    return (
      <div className={`space-y-2.5 rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        {["Add filters table migration", "Build save / apply UI", "Write the API endpoint"].map((l, i) => (
          <motion.div key={l} variants={listItem} custom={i} initial="hidden" animate="show" className="flex items-center gap-2.5">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...SPRING_POP, delay: i * 0.08 }}
              className={`h-3.5 w-3.5 shrink-0 rounded-[3px] border ${dark ? "border-white/30" : "border-neutral-300"}`}
            />
            <span className={`${mono.className} text-[12px] ${bodyText}`}>{l}</span>
          </motion.div>
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
        {diff.map((l, i) => (
          <motion.div
            key={l.t}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.09, ease: EASE_OUT }}
            className={`flex gap-2 rounded px-1.5 ${l.k === "add" ? (dark ? "bg-white/[0.06]" : "bg-neutral-100") : ""}`}
          >
            <span className={mutedText}>{l.k === "add" ? "+" : " "}</span>
            <span className={bodyText}>{l.t}</span>
          </motion.div>
        ))}
      </div>
    );
  }
  if (stageKey === "review") {
    return (
      <div className={`space-y-2.5 rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }} className="flex items-start gap-2.5">
          <MessageSquare className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${mutedText}`} strokeWidth={1.6} />
          <span className={`text-[12.5px] ${bodyText}`}>Left a comment on line 42</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12, ease: EASE_OUT }} className="flex items-start gap-2.5">
          <MessageSquare className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${mutedText}`} strokeWidth={1.6} />
          <span className={`text-[12.5px] ${bodyText}`}>Rename <code className={mono.className}>filterId</code> → <code className={mono.className}>savedFilterId</code></span>
        </motion.div>
      </div>
    );
  }
  if (stageKey === "fixes") {
    return (
      <div className={`rounded-lg border p-4 ${toneCard("red", variant)}`}>
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_POP}
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${toneText("red", variant)}`}
        >
          <motion.span animate={{ rotate: -360 }} transition={{ duration: 0.6, ease: EASE_IN_OUT }}>
            <RotateCcw className="h-3 w-3" />
          </motion.span>
          Changes requested
        </motion.span>
        <p className={`mt-2.5 text-[12.5px] ${bodyText}`}>
          Renamed <code className={mono.className}>filterId</code> → <code className={mono.className}>savedFilterId</code> and pushed a new commit.
        </p>
      </div>
    );
  }
  if (stageKey === "approval") {
    return (
      <div className={`rounded-lg border p-4 ${toneCard("green", variant)}`}>
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_POP}
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${toneText("green", variant)}`}
        >
          <Check className="h-3 w-3" />
          Approved
        </motion.span>
        <p className={`mt-2.5 text-[12.5px] ${bodyText}`}>&ldquo;LGTM — nice and small.&rdquo;</p>
      </div>
    );
  }
  return (
    <div className={`rounded-lg border p-4 ${toneCard("neutral", variant)}`}>
      <div className="flex items-center gap-2.5">
        <motion.span initial={{ rotate: -8, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={SPRING_POP}>
          <GitPullRequest className={`h-4 w-4 shrink-0 ${bodyText}`} strokeWidth={1.6} />
        </motion.span>
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
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      setDir(1);
      setStage((s) => (s + 1) % PIPELINE.length);
    }, 2500);
    return () => clearInterval(t);
  }, [reduce]);

  const current = PIPELINE[stage] ?? PIPELINE[0];

  const goTo = (i: number) => {
    setDir(i > stage ? 1 : -1);
    setStage(i);
  };

  return (
    <div className="mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: -6 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: EASE_OUT }}
        style={{ transformPerspective: 1200 }}
        whileHover={{ y: -3 }}
        className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_60px_-24px_rgba(0,0,0,0.18)] transition-shadow duration-300 hover:shadow-[0_1px_0_rgba(0,0,0,0.02),0_32px_70px_-24px_rgba(0,0,0,0.24)]"
      >
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
              onClick={() => goTo(i)}
              className={`${mono.className} relative shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors duration-200 ${toneRing(
                p.tone,
                "light",
                i === stage
              )}`}
            >
              {i === stage && (
                <motion.span
                  layoutId="hero-pill"
                  className="absolute inset-0 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{p.label}</span>
            </button>
          ))}
        </div>

        <div className="relative h-[220px] overflow-hidden px-6 py-6 sm:h-[230px] sm:px-8">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={current.key}
              custom={dir}
              initial={{ opacity: 0, x: dir * 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: dir * -24, filter: "blur(6px)" }}
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
      </motion.div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {PIPELINE.map((p, i) => (
          <button
            key={p.key}
            aria-label={`Show ${p.label} stage`}
            onClick={() => goTo(i)}
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

/** A soft, monochrome radial blob that eases toward the cursor within the hero. */
function CursorGlow() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.35);
  const sx = useSpring(x, { stiffness: 60, damping: 20 });
  const sy = useSpring(y, { stiffness: 60, damping: 20 });
  const left = useTransform(sx, (v) => `${v * 100}%`);
  const top = useTransform(sy, (v) => `${v * 100}%`);

  if (reduce) return null;

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        style={{ left, top }}
        className="absolute h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300/25 blur-[90px]"
      />
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-white pb-28 pt-32 sm:pb-36 sm:pt-40">
      <CursorGlow />
      {/* faint moving dot-grid, monochrome */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
        style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)", backgroundSize: "26px 26px" }}
      />

      <div className="relative mx-auto max-w-[1536px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 xl:grid-cols-[1.2fr_1fr]">
          <div className="text-left shrink-0">
            <Reveal>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING_POP}
                className={`${mono.className} inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-[11px] uppercase tracking-widest text-neutral-500`}
              >
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
                  <CircleDot className="h-3 w-3" />
                </motion.span>
                From request to release
              </motion.span>
            </Reveal>

            <h1 className={`${display.className} mt-8 text-[42px] font-semibold leading-[1.06] tracking-tight text-neutral-950 sm:text-6xl md:text-[68px] whitespace-nowrap`}>
              <KineticWords text="Describe the feature." delayBase={0.15} />
              <br />
              <span className="text-neutral-400">
                <KineticWords text="Watch it ship itself." delayBase={0.4} />
              </span>
            </h1>

            <Reveal i={4}>
              <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-neutral-500 sm:text-[18px]">
                Every request moves through the same path — thinking, a PRD, tasks, code, review,
                and release — until it&rsquo;s a merged pull request your team never had to write by hand.
              </p>
            </Reveal>

            <Reveal i={5}>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Magnetic>
                  <Link
                    href="/register"
                    className="group inline-flex h-12 items-center gap-2 rounded-full bg-neutral-950 px-7 text-[15px] font-medium text-white transition-transform duration-150 ease-out active:scale-[0.97] hover:bg-neutral-800"
                  >
                    Get started free
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Magnetic>
                <a
                  href="#process"
                  className="group inline-flex h-12 items-center gap-1.5 px-3 text-[15px] font-medium text-neutral-700 transition-colors hover:text-neutral-950"
                >
                  See how it works
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
/*  Features — tilt cards                                                  */
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

function TiltCard({ f, i }: { f: (typeof features)[number]; i: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 22 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22 });

  return (
    <Reveal i={i} className="group">
      <motion.div
        ref={ref}
        style={reduce ? undefined : { rotateX: srx, rotateY: sry, transformPerspective: 800 }}
        onMouseMove={(e) => {
          if (reduce) return;
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          rx.set(py * -8);
          ry.set(px * 8);
        }}
        onMouseLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        className="h-full bg-white p-8 transition-colors duration-200 hover:bg-neutral-50"
      >
        <motion.div whileHover={{ y: -3, scale: 1.06 }} transition={SPRING_POP} className="inline-block">
          <f.icon className="h-5 w-5 text-neutral-900" strokeWidth={1.6} />
        </motion.div>
        <h3 className="mt-5 text-[16px] font-medium text-neutral-950">{f.title}</h3>
        <p className="mt-2.5 text-[14px] leading-relaxed text-neutral-500">{f.body}</p>
      </motion.div>
    </Reveal>
  );
}

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

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3 [perspective:1000px]">
          {features.map((f, i) => (
            <TiltCard key={f.title} f={f} i={i} />
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
          initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
          animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
          transition={SPRING_POP}
          className={`${mono.className} relative grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-black text-[12px] ${toneRing(
            stage.tone,
            "dark",
            false
          )}`}
        >
          {stage.tone !== "neutral" && inView && (
            <motion.span
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 1.1, ease: EASE_OUT }}
              className={`absolute inset-0 rounded-full border ${stage.tone === "green" ? "border-emerald-400" : "border-red-400"}`}
            />
          )}
          {String(i + 1).padStart(2, "0")}
        </motion.span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
        className="pb-20 sm:pb-28"
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-[20px] font-medium text-white sm:text-[22px]">{stage.title}</h3>
          {stage.tone !== "neutral" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ ...SPRING_POP, delay: 0.25 }}
              className={`${mono.className} rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${toneRing(
                stage.tone,
                "dark",
                true
              )}`}
            >
              {stage.label}
            </motion.span>
          )}
        </div>
        <p className="mt-2.5 max-w-md text-[14.5px] leading-relaxed text-white/50">{stage.body}</p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
          className="mt-5 max-w-sm"
        >
          <PipelineVisual stageKey={stage.key} variant="dark" />
        </motion.div>
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
  const pathLength = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="process" ref={sectionRef} className="relative overflow-hidden bg-black py-28 sm:py-40">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_70%_60%_at_20%_0%,black,transparent)]"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />
      <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
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
  { name: "Premium", price: "₹999", note: "/ per month", features: ["Unlimited repositories.", "30 AI PR reviews per month.", "Advanced PRD generation & Planner agent.", "Automated AI Code Reviewer.", "Priority email support."], cta: "Get started", highlighted: true },
  { name: "Custom", price: "₹2999", note: "/ per month", features: ["Unlimited repositories.", "100 AI PR reviews per month.", "Custom AI integrations.", "Dedicated Slack channel.", "24/7 Enterprise support."], cta: "Get started", highlighted: false },
];

function PricingCard({ p, i }: { p: (typeof plans)[number]; i: number }) {
  return (
    <Reveal i={i}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={SPRING_SOFT}
        className={`relative flex h-full flex-col overflow-hidden rounded-2xl border p-7 ${
          p.highlighted ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-950"
        }`}
      >
        {p.highlighted && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-1 opacity-60"
            style={{
              background:
                "radial-gradient(120px 120px at var(--x,50%) var(--y,0%), rgba(255,255,255,0.12), transparent 70%)",
            }}
            animate={{ ["--x" as any]: ["20%", "80%", "20%"], ["--y" as any]: ["0%", "40%", "0%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <p className="relative text-[14px] font-medium">{p.name}</p>
        <p className="relative mt-4 flex items-baseline gap-1">
          <span className="text-[34px] font-semibold tracking-tight">{p.price}</span>
          <span className={`text-[13px] ${p.highlighted ? "text-white/50" : "text-neutral-400"}`}>{p.note}</span>
        </p>
        <ul className="relative mt-6 flex-1 space-y-2.5">
          {p.features.map((f, fi) => (
            <motion.li
              key={f}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: fi * 0.05, ease: EASE_OUT }}
              className="flex items-center gap-2.5 text-[13.5px]"
            >
              <Check className={`h-3.5 w-3.5 shrink-0 ${p.highlighted ? "text-white/70" : "text-neutral-400"}`} />
              <span className={p.highlighted ? "text-white/80" : "text-neutral-600"}>{f}</span>
            </motion.li>
          ))}
        </ul>
        <Magnetic strength={0.15}>
          <Link
            href="/register"
            className={`relative mt-7 inline-flex h-10 w-full items-center justify-center rounded-full text-[13.5px] font-medium transition-transform duration-150 ease-out active:scale-[0.97] ${
              p.highlighted ? "bg-white text-neutral-950 hover:bg-neutral-100" : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
            }`}
          >
            {p.cta}
          </Link>
        </Magnetic>
      </motion.div>
    </Reveal>
  );
}

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
            <PricingCard key={p.name} p={p} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/*  Testimonials — infinite marquee, pauses on hover                       */
/* ---------------------------------------------------------------------- */

const quotes = [
  { name: "Priya Nair", role: "Eng lead, Aster Labs", text: "We link a repo, write the task like a Jira ticket, and the PR shows up before standup." },
  { name: "Marcus Webb", role: "CTO, Fielder", text: "The secret scanner catching a stray key in a generated file was the moment we trusted it in prod repos." },
  { name: "Ines Dahl", role: "Staff engineer, Loft", text: "PRD generation alone saved our planning meetings — tasks arrive already broken down." },
];

function QuoteCard({ q }: { q: (typeof quotes)[number] }) {
  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col rounded-2xl border border-neutral-200 bg-white p-7 sm:w-[380px]">
      <Quote className="h-5 w-5 text-neutral-300" strokeWidth={1.5} />
      <p className="mt-4 text-[15px] leading-relaxed text-neutral-800">&ldquo;{q.text}&rdquo;</p>
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
  );
}

function Testimonials() {
  const reduce = useReducedMotion();
  const track = useMemo(() => [...quotes, ...quotes], []);

  return (
    <section id="testimonials" className="overflow-hidden bg-neutral-50 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-lg">
          <span className={`${mono.className} text-[11px] uppercase tracking-widest text-neutral-400`}>Teams shipping with it</span>
          <h2 className={`${display.className} mt-4 text-[32px] font-semibold tracking-tight text-neutral-950 sm:text-[42px]`}>
            Ask the people already merging.
          </h2>
        </Reveal>
      </div>

      <div className="group relative mt-16 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div
          className={`flex w-max gap-5 px-5 sm:px-8 ${reduce ? "" : "animate-[marquee_38s_linear_infinite] group-hover:[animation-play-state:paused]"}`}
        >
          {track.map((q, i) => (
            <QuoteCard key={`${q.name}-${i}`} q={q} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
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
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div className="relative mx-auto max-w-2xl px-5 sm:px-8">
        <Reveal className="flex justify-center">
          <motion.span
            whileHover={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 0.5, ease: EASE_IN_OUT }}
            className="grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/[0.04]"
          >
            <Github className="h-6 w-6 text-white" strokeWidth={1.5} />
          </motion.span>
        </Reveal>

        <h2 className={`${display.className} mt-8 text-[32px] font-semibold leading-tight tracking-tight text-white sm:text-[46px]`}>
          <KineticWords text="It already knows GitHub." />
        </h2>

        <Reveal i={2}>
          <p className="mx-auto mt-5 max-w-md text-[15.5px] leading-relaxed text-white/50">
            Every merge, check, and review syncs back to your board automatically — no polling, no manual
            status updates, no second source of truth.
          </p>
        </Reveal>

        <Reveal i={3}>
          <div className="mx-auto mt-9 flex max-w-md flex-wrap items-center justify-center gap-2">
            {chips.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ ...SPRING_POP, delay: i * 0.08 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/60"
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-white/60"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.3, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
                />
                {c}
              </motion.span>
            ))}
          </div>
        </Reveal>

        <Reveal i={4}>
          <div className="mt-10">
            <Magnetic>
              <Link
                href="/register"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-medium text-neutral-950 transition-transform duration-150 ease-out active:scale-[0.97] hover:bg-neutral-100"
              >
                Connect your repo
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Magnetic>
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
      <Grain />
      <ScrollProgress />
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