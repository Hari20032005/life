"use client";
import { useState, type ReactNode } from "react";
import { Eye, EyeOff, Dumbbell, HelpCircle, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

const KIND = {
  exercise: { Icon: Dumbbell, label: "Exercise", reveal: "Show solution" },
  interview: { Icon: HelpCircle, label: "Interview question", reveal: "Show model answer" },
  debug: { Icon: Bug, label: "Debug challenge", reveal: "Reveal the bug" },
} as const;

/** A prompt with a hidden answer. Try first, then reveal. */
export function Challenge({ kind = "exercise", title, children, answer }: { kind?: keyof typeof KIND; title?: string; children: ReactNode; answer: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { Icon, label, reveal } = KIND[kind];
  return (
    <div className="my-5 rounded-xl border border-border bg-surface p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand"><Icon size={16} aria-hidden />{label}{title ? `: ${title}` : ""}</p>
      <div>{children}</div>
      <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? <EyeOff size={14} /> : <Eye size={14} />} {open ? "Hide" : reveal}
      </Button>
      {open && <div className="mt-3 rounded-lg bg-surface-2 p-3">{answer}</div>}
    </div>
  );
}
