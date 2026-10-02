import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getWeeks } from "@/lib/content/loader";
import { AI_MODE } from "@/lib/ui-meta";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Program overview" };

export default function ProgramPage() {
  const program = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/program.json"), "utf8")) as {
    aiRules: { when: string; rule: string }[]; groundRules: string[]; goal: string;
  };
  const weeks = getWeeks();
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold">Program overview</h1>
        <p className="mt-2 text-lg text-muted">{program.goal}</p>
      </header>

      <section>
        <h2 className="mb-3 text-xl font-bold">The AI rule</h2>
        <div className="grid gap-3">
          {program.aiRules.map((r) => <Card key={r.when} className="flex flex-col gap-1 sm:flex-row sm:gap-4"><b className="w-48 shrink-0 text-brand">{r.when}</b><span>{r.rule}</span></Card>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {(["tutor-only", "build-with-ai", "no-ai", "build-day"] as const).map((m) => <Badge key={m} tone={AI_MODE[m].tone}>{AI_MODE[m].label}</Badge>)}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Ground rules for the whole program</h2>
        <ul className="list-disc space-y-2 pl-6">{program.groundRules.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Weekly rhythm</h2>
        <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">
          <thead><tr className="bg-surface-2 text-left"><th className="border border-border p-2">Day</th><th className="border border-border p-2">Typical focus</th><th className="border border-border p-2">AI mode</th></tr></thead>
          <tbody>
            {[["Mon–Fri", "Learn in the morning, build in the afternoon, with a PR and explain-back", "mixed"], ["Sat", "Debug lab on a provided broken system", "no-ai"], ["Sun", "Weekly project with rubric", "build-day"]].map(([d, f, m]) => (
              <tr key={d}><td className="border border-border p-2 font-medium">{d}</td><td className="border border-border p-2">{f}</td><td className="border border-border p-2"><Badge tone={AI_MODE[m as keyof typeof AI_MODE].tone}>{AI_MODE[m as keyof typeof AI_MODE].label}</Badge></td></tr>
            ))}
          </tbody>
        </table></div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Outcome per week</h2>
        <ol className="space-y-2">{weeks.map((w) => <li key={w.week}><b>Week {w.week} — {w.title}:</b> <span className="text-muted">{w.goal}</span></li>)}</ol>
      </section>
    </div>
  );
}
