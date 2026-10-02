"use client";
import { useState } from "react";
import { Bug, Eye, EyeOff, Lightbulb, CheckCircle2 } from "lucide-react";
import type { Lab } from "@/lib/content/schema";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/store/progress";
import { useHydrated } from "@/hooks/use-hydrated";
import { Badge } from "@/components/ui/badge";

function LabCard({ lab }: { lab: Lab }) {
  const [hints, setHints] = useState(0);
  const [open, setOpen] = useState(false);
  const solved = useProgress((s) => !!s.labsSolved[lab.id]);
  const toggle = useProgress((s) => s.toggleLab);
  const hydrated = useHydrated();
  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 flex items-center gap-2">
        <Bug size={16} className="text-danger" /><h3 className="font-semibold">{lab.title}</h3>
        {hydrated && solved && <Badge tone="success"><CheckCircle2 size={12} />Solved</Badge>}
      </div>
      <p className="text-sm"><b>Symptom: </b>{lab.symptom}</p>
      {lab.code && <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 text-xs"><code>{lab.code}</code></pre>}
      <p className="mt-3 text-xs text-muted">No AI for this one. Write down your own symptom → cause → fix → how verified before you reveal anything.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {hints < lab.hints.length && <Button size="sm" variant="outline" onClick={() => setHints((h) => h + 1)}><Lightbulb size={14} /> Hint {hints + 1}</Button>}
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? <EyeOff size={14} /> : <Eye size={14} />}{open ? "Hide solution" : "Reveal solution"}</Button>
        <Button size="sm" variant={solved ? "success" : "ghost"} onClick={() => toggle(lab.id)}>{solved ? "Solved ✓" : "Mark solved"}</Button>
      </div>
      {lab.hints.slice(0, hints).map((h, i) => <p key={i} className="mt-3 rounded-lg bg-warn/10 p-3 text-sm"><b>Hint {i + 1}: </b>{h}</p>)}
      {open && (
        <dl className="mt-3 space-y-2 rounded-lg bg-surface-2 p-3 text-sm">
          <div><dt className="font-semibold">Cause</dt><dd>{lab.cause}</dd></div>
          <div><dt className="font-semibold">Fix</dt><dd className="whitespace-pre-wrap">{lab.fix}</dd></div>
          <div><dt className="font-semibold">How to verify</dt><dd>{lab.verify}</dd></div>
        </dl>
      )}
    </article>
  );
}

export function LabList({ labs }: { labs: Lab[] }) {
  return <div className="space-y-4">{labs.map((l) => <LabCard key={l.id} lab={l} />)}</div>;
}
