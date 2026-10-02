"use client";
import { BookOpen, RefreshCw, Mic } from "lucide-react";
import { useProgress, type Mode } from "@/lib/store/progress";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

const MODES: { id: Mode; label: string; Icon: typeof BookOpen; hint: string }[] = [
  { id: "study", label: "Study", Icon: BookOpen, hint: "Full lessons, all depth levels" },
  { id: "revision", label: "Revision", Icon: RefreshCw, hint: "Beginner + Industry summaries only" },
  { id: "interview", label: "Interview", Icon: Mic, hint: "Tabbed depth, answers hidden until you try" },
];

export function ModeSwitch() {
  const mode = useProgress((s) => s.mode);
  const setMode = useProgress((s) => s.setMode);
  const hydrated = useHydrated();
  return (
    <div role="radiogroup" aria-label="Learning mode" className="inline-flex rounded-lg border border-border bg-surface p-0.5">
      {MODES.map(({ id, label, Icon, hint }) => {
        const active = (hydrated ? mode : "study") === id;
        return (
          <button key={id} role="radio" aria-checked={active} title={hint} onClick={() => setMode(id)}
            className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer", active ? "bg-brand text-brand-fg" : "text-muted hover:text-fg")}>
            <Icon size={14} /><span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
