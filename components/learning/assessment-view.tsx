"use client";
import type { Assessment } from "@/lib/content/schema";
import { useProgress } from "@/lib/store/progress";
import { useHydrated } from "@/hooks/use-hydrated";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";

/** Self-marked assessment: tick each task; points are earned as parts are completed. */
export function AssessmentView({ a, idPrefix }: { a: Assessment; idPrefix: string }) {
  const checks = useProgress((s) => s.checklist);
  const toggle = useProgress((s) => s.toggleCheck);
  const hydrated = useHydrated();
  const total = a.parts.reduce((n, p) => n + p.points, 0);
  const earned = hydrated
    ? a.parts.reduce((n, p, pi) => n + (p.tasks.length ? (p.points * p.tasks.filter((_, ti) => checks[`${idPrefix}-${pi}-${ti}`]).length) / p.tasks.length : 0), 0)
    : 0;
  return (
    <div className="mt-2 space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold">{a.title}</h1>
        <p className="mt-1 text-muted">{a.durationMinutes} minutes · {total} points</p>
      </header>
      <Card><h2 className="mb-2 font-semibold">Rules</h2><ul className="list-disc space-y-1 pl-5 text-sm">{a.rules.map((r) => <li key={r}>{r}</li>)}</ul></Card>
      <div><div className="mb-1 flex justify-between text-sm"><span>Self-assessed score</span><b>{Math.round(earned)}/{total}</b></div><ProgressBar value={(earned / total) * 100} label="Assessment score" /></div>
      {a.parts.map((p, pi) => (
        <Card key={p.title}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{p.title}</h2><Badge tone="brand">{p.points} pts</Badge></div>
          <ul className="space-y-2">
            {p.tasks.map((t, ti) => {
              const id = `${idPrefix}-${pi}-${ti}`;
              return (
                <li key={id}>
                  <label className="flex cursor-pointer items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={hydrated && !!checks[id]} onChange={() => toggle(id)} /><span>{t}</span></label>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}
