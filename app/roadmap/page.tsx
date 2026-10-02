import Link from "next/link";
import type { Metadata } from "next";
import { Mermaid } from "@/components/mdx/mermaid";
import { getWeeks } from "@/lib/content/loader";
import { Card } from "@/components/ui/card";
import { dayHref } from "@/lib/ui-meta";
import { AiModeBadge } from "@/components/layout/ai-mode-badge";

export const metadata: Metadata = { title: "Roadmap" };

const FLOW = `flowchart LR
  W0["Week 0<br/>How the web works<br/>HTML · CSS · JS · fetch"] --> W1["Week 1<br/>Backend + DB<br/>Express · Postgres"]
  W1 --> W2["Week 2<br/>Auth + Security<br/>JWT · OAuth · CI"]
  W2 --> W3["Week 3<br/>Frontend<br/>React · Next.js"]
  W3 --> W4["Week 4<br/>Ship + Run<br/>Docker · VPS · CI/CD"]
  W4 --> W5["Week 5<br/>AI Engineering<br/>RAG · Tools · Evals"]
  W5 --> W6["Week 6<br/>Capstone<br/>Forward deployed"]
  classDef opt stroke-dasharray: 5 5
  class W0 opt`;

export default function RoadmapPage() {
  const weeks = getWeeks();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold">Roadmap</h1>
        <p className="mt-2 max-w-2xl text-muted">Weeks 1–5 grow one booking product. Week 6 is a brand-new client problem. Week 0 (dashed) can be skipped by passing the test-out.</p>
      </header>
      <Mermaid chart={FLOW} caption="The six-week path (plus optional Week 0)" />
      <div className="grid gap-6">
        {weeks.map((w) => (
          <Card key={w.week}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold"><Link className="hover:text-brand" href={`/weeks/${w.week}`}>Week {w.week} · {w.title}</Link></h2>
              <span className="text-sm text-muted">{w.tagline}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{w.projectStage}</p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {w.days.map((d) => (
                <li key={d.day}>
                  <Link href={dayHref(w.week, d.day)} className="block h-full rounded-lg border border-border p-3 hover:border-brand">
                    <p className="text-xs text-muted">Day {d.day} · {d.weekday}</p>
                    <p className="mb-2 text-sm font-medium">{d.title}</p>
                    <AiModeBadge mode={d.aiMode} />
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}
