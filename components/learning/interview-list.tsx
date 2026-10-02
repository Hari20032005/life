"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Shuffle } from "lucide-react";
import type { InterviewItem } from "@/lib/content/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shuffle } from "@/lib/utils";

export type InterviewRow = InterviewItem & { week: number };

export function InterviewList({ items, initialWeek }: { items: InterviewRow[]; initialWeek?: number }) {
  const [week, setWeek] = useState<number | "all">(initialWeek ?? "all");
  const [level, setLevel] = useState<"all" | InterviewItem["level"]>("all");
  const [kind, setKind] = useState<"all" | InterviewItem["kind"]>("all");
  const [seed, setSeed] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const f = items.filter((i) => (week === "all" || i.week === week) && (level === "all" || i.level === level) && (kind === "all" || i.kind === kind));
    return seed ? shuffle(f) : f;
  }, [items, week, level, kind, seed]);

  const sel = "h-9 rounded-lg border border-border bg-surface px-2 text-sm";
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <label className="text-sm">Week <select className={sel} value={week} onChange={(e) => setWeek(e.target.value === "all" ? "all" : Number(e.target.value))}><option value="all">All</option>{[0,1,2,3,4,5,6].map((w) => <option key={w} value={w}>{w}</option>)}</select></label>
        <label className="text-sm">Level <select className={sel} value={level} onChange={(e) => setLevel(e.target.value as typeof level)}><option value="all">All</option><option>junior</option><option>mid</option><option>senior</option></select></label>
        <label className="text-sm">Type <select className={sel} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="all">All</option><option>concept</option><option>debugging</option><option>system-design</option><option>ai-engineering</option><option>behavioural</option></select></label>
        <Button size="sm" variant="outline" onClick={() => { setSeed((s) => s + 1); setOpen({}); }}><Shuffle size={14} /> Mock interview order</Button>
        <span className="ml-auto text-sm text-muted">{filtered.length} questions</span>
      </div>
      <ul className="space-y-3">
        {filtered.map((it) => (
          <li key={it.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 flex flex-wrap gap-2"><Badge tone="brand">Week {it.week}</Badge><Badge>{it.level}</Badge><Badge>{it.kind}</Badge></div>
            <p className="font-medium">{it.q}</p>
            <Button size="sm" variant="outline" className="mt-3" aria-expanded={!!open[it.id]} onClick={() => setOpen((o) => ({ ...o, [it.id]: !o[it.id] }))}>
              {open[it.id] ? <EyeOff size={14} /> : <Eye size={14} />}{open[it.id] ? "Hide answer" : "Show model answer"}
            </Button>
            {open[it.id] && (
              <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm">
                <p className="whitespace-pre-wrap">{it.a}</p>
                {it.followUps.length > 0 && <><p className="mt-2 font-semibold">Follow-ups an interviewer may ask</p><ul className="list-disc pl-5">{it.followUps.map((f) => <li key={f}>{f}</li>)}</ul></>}
              </div>
            )}
          </li>
        ))}
        {filtered.length === 0 && <li className="text-muted">No questions match these filters.</li>}
      </ul>
    </div>
  );
}
