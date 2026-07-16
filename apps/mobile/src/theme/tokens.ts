/**
 * Design tokens — mirrors the web landing page's black/white palette.
 * Red/green are the one deliberate exception: pipeline outcome states only.
 */

export const colors = {
  paper: "#ffffff",
  paperDim: "#fafafa",
  ink: "#0a0a0a",
  inkSoft: "#52525b",
  inkFaint: "#a1a1aa",
  line: "#e5e5e5",
  lineSoft: "#f0f0f0",

  void: "#000000",
  voidLine: "rgba(255,255,255,0.12)",
  voidSoft: "rgba(255,255,255,0.5)",
  voidFaint: "rgba(255,255,255,0.35)",

  green: "#059669",
  greenBg: "#ecfdf5",
  greenLine: "#a7f3d0",

  red: "#dc2626",
  redBg: "#fef2f2",
  redLine: "#fecaca",
} as const;

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const spacing = (n: number) => n * 4;

/** Easing curves — matches the web copy's EASE_OUT / EASE_IN_OUT. */
export const easing = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
};

/** Durations, kept under the 300ms UI budget unless explicitly marketing/explanatory. */
export const durations = {
  press: 120,
  micro: 160,
  ui: 220,
  enter: 320,
};
