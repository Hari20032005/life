import type { AiMode } from "./content/schema";

export const AI_MODE: Record<AiMode, { label: string; tone: "brand" | "success" | "danger" | "warn" | "neutral"; blurb: string }> = {
  "tutor-only": { label: "Learn by hand · AI = tutor", tone: "warn", blurb: "Morning rule: you type every line. AI may explain, quiz and review, nothing else." },
  "build-with-ai": { label: "Build with AI", tone: "brand", blurb: "Afternoon rule: any coding agent is allowed, but explain-back applies to every changed line." },
  mixed: { label: "Morning by hand · Afternoon with AI", tone: "brand", blurb: "Mornings: AI is a tutor only. Afternoons: build with any coding agent. Every PR gets an explain-back." },
  "no-ai": { label: "No AI · Debug Lab", tone: "danger", blurb: "Saturday rule: no AI at all. You debug with DevTools, logs, a debugger and your own reasoning." },
  "build-day": { label: "Build day · AI allowed", tone: "success", blurb: "Afternoon rules apply all day. Explain-back still applies." },
  none: { label: "", tone: "neutral", blurb: "" },
};

export const dayHref = (week: number, day: number) => `/weeks/${week}/day-${day}`;
export const lessonHref = (week: number, day: number, slug: string) => `/weeks/${week}/day-${day}/${slug}`;
