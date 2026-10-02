import type { Metadata } from "next";
import Link from "next/link";
import { getProgramAssessments, getWeeks, getAssessment } from "@/lib/content/loader";
import { Card } from "@/components/ui/card";
import { AssessmentView } from "@/components/learning/assessment-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Assessments" };

export default function AssessmentsPage() {
  const program = getProgramAssessments();
  const weekly = getWeeks().filter((w) => getAssessment(w.week));
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold">Assessments</h1>
        <p className="mt-2 max-w-2xl text-muted">Daily checks, weekly assessments, a mid-course and final assessment, and five mock interviews. Tick tasks as you complete them to see your self-assessed score.</p>
      </header>
      <section>
        <h2 className="mb-3 text-xl font-bold">Weekly assessments & daily checks</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {weekly.map((w) => <Link key={w.week} href={`/weeks/${w.week}/assessment`}><Card className="hover:border-brand"><b>Week {w.week}</b><p className="text-sm text-muted">{w.title}</p></Card></Link>)}
        </div>
        <p className="mt-3 text-sm text-muted">Daily assessment: every day page ends with acceptance criteria — tick each one. A day is done only when every criterion is true <i>and</i> you can explain-back every changed line.</p>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Program assessments</h2>
        <Tabs defaultValue="p0">
          <TabsList>{program.map((a, i) => <TabsTrigger key={a.title} value={`p${i}`}>{a.title}</TabsTrigger>)}</TabsList>
          {program.map((a, i) => <TabsContent key={a.title} value={`p${i}`}><AssessmentView a={a} idPrefix={`assess-prog-${i}`} /></TabsContent>)}
        </Tabs>
      </section>
    </div>
  );
}
