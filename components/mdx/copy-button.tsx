"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, className = "absolute right-2 top-2" }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={done ? "Copied" : "Copy code"}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
      }}
      className={`${className} z-10 rounded-md border border-border bg-surface p-1.5 text-muted opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer hover:text-fg`}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
