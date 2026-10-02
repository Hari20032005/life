import type { ReactNode } from "react";
import { AlertTriangle, Lightbulb, Info, Bug, Building2, Bot, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const KINDS = {
  info: { Icon: Info, label: "Note", cls: "border-brand/40 bg-brand/5" },
  tip: { Icon: Lightbulb, label: "Tip", cls: "border-success/40 bg-success/5" },
  warning: { Icon: AlertTriangle, label: "Watch out", cls: "border-warn/40 bg-warn/5" },
  mistake: { Icon: Bug, label: "Common mistake", cls: "border-danger/40 bg-danger/5" },
  industry: { Icon: Building2, label: "In industry", cls: "border-accent/40 bg-accent/5" },
  ai: { Icon: Bot, label: "AI rule", cls: "border-brand/40 bg-brand/5" },
  keypoints: { Icon: Target, label: "Key points", cls: "border-success/40 bg-success/5" },
} as const;

export function Callout({ kind = "info", title, children }: { kind?: keyof typeof KINDS; title?: string; children: ReactNode }) {
  const { Icon, label, cls } = KINDS[kind];
  return (
    <aside className={cn("my-5 rounded-xl border p-4", cls)}>
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold"><Icon size={16} aria-hidden />{title ?? label}</p>
      <div className="text-[0.95rem] [&>p]:my-1 [&>ul]:my-1">{children}</div>
    </aside>
  );
}
