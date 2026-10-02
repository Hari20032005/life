import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Mermaid } from "@/components/mdx/mermaid";
import { CodeBlock } from "@/components/mdx/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "The evolving project" };

interface Stage { week: number; name: string; title: string; summary: string; diagram: string; folders: string; schema: string; api: string; flow: string }

export default function ProjectPage() {
  const stages: Stage[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/project/booking-evolution.json"), "utf8"));
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold">The Booking System, week by week</h1>
        <p className="mt-2 max-w-2xl text-muted">One product for a small business (clinic, gym or salon) grows each week. Week 6 applies the same skills to a brand-new client problem.</p>
      </header>
      <Tabs defaultValue="w1" className="min-w-0">
        <TabsList>{stages.map((s) => <TabsTrigger key={s.week} value={`w${s.week}`}>W{s.week} · {s.name}</TabsTrigger>)}</TabsList>
        {stages.map((s) => (
          <TabsContent key={s.week} value={`w${s.week}`} className="min-w-0 space-y-6">
            <div><Badge tone="brand">Week {s.week}</Badge><h2 className="mt-2 text-2xl font-bold">{s.title}</h2><p className="mt-1 max-w-3xl text-muted">{s.summary}</p></div>
            <section><h3 className="mb-2 font-semibold">Architecture</h3><Mermaid chart={s.diagram} /></section>
            <section><h3 className="mb-2 font-semibold">User / request flow</h3><Mermaid chart={s.flow} /></section>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
              <section className="min-w-0"><h3 className="mb-2 font-semibold">Folder structure</h3><CodeBlock code={s.folders} lang="text" /></section>
              <section className="min-w-0"><h3 className="mb-2 font-semibold">Database schema</h3><CodeBlock code={s.schema} lang="text" /></section>
            </div>
            <section><h3 className="mb-2 font-semibold">API contract</h3><CodeBlock code={s.api} lang="text" /></section>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
