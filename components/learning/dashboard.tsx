"use client";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { useProgress } from "@/lib/store/progress";
import { useHydrated } from "@/hooks/use-hydrated";

export interface WeekInfo { week: number; title: string; lessonKeys: string[]; hasQuiz: boolean; labIds: string[] }

export function Dashboard({ weeks }: { weeks: WeekInfo[] }) {
  const hydrated = useHydrated();
  const completed = useProgress((s) => s.completedLessons);
  const quizzes = useProgress((s) => s.quizScores);
  const labs = useProgress((s) => s.labsSolved);
  const cards = useProgress((s) => s.cards);
  const reset = useProgress((s) => s.reset);
  if (!hydrated) return <div className="h-64 animate-pulse rounded-xl bg-surface-2" aria-busy="true" />;

  const rows = weeks.map((w) => {
    const done = w.lessonKeys.filter((k) => completed[k]).length;
    return { ...w, done, pct: w.lessonKeys.length ? Math.round((done / w.lessonKeys.length) * 100) : 0, quiz: quizzes[`week-${w.week}`], labsDone: w.labIds.filter((id) => labs[id]).length };
  });
  const totalLessons = weeks.reduce((n, w) => n + w.lessonKeys.length, 0);
  const totalDone = rows.reduce((n, r) => n + r.done, 0);
  const next = weeks.flatMap((w) => w.lessonKeys).find((k) => !completed[k]);
  const [nw, ns] = next ? [next.split("/")[0].slice(1), next.split("/")[1]] : [];
  const mastered = Object.values(cards).filter((c) => c.box >= 4).length;
  const chart = rows.map((r) => ({ name: `W${r.week}`, "Lessons %": r.pct, "Quiz best %": r.quiz?.best ?? 0 }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-sm text-muted">Lessons completed</p><p className="text-3xl font-bold">{totalDone}<span className="text-base text-muted">/{totalLessons}</span></p></Card>
        <Card><p className="text-sm text-muted">Quizzes taken</p><p className="text-3xl font-bold">{Object.keys(quizzes).length}</p></Card>
        <Card><p className="text-sm text-muted">Debug labs solved</p><p className="text-3xl font-bold">{Object.keys(labs).length}</p></Card>
        <Card><p className="text-sm text-muted">Flashcards mastered</p><p className="text-3xl font-bold">{mastered}</p></Card>
      </div>
      {next && <Card className="flex items-center justify-between"><span>Next up: <b>{ns}</b> (Week {nw})</span><Button asChild size="sm"><Link href={`/weeks/${nw}`}>Continue</Link></Button></Card>}
      <Card>
        <h2 className="mb-3 font-semibold">Progress by week</h2>
        <div className="h-64" role="img" aria-label="Bar chart of lesson completion and best quiz score by week">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <YAxis domain={[0, 100]} stroke="var(--muted)" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="Lessons %" fill="var(--brand)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Quiz best %" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.week}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Link className="font-semibold hover:text-brand" href={`/weeks/${r.week}`}>Week {r.week} · {r.title}</Link>
              <span className="text-xs text-muted">{r.done}/{r.lessonKeys.length} lessons{r.hasQuiz ? ` · quiz ${r.quiz ? `best ${r.quiz.best}% (${r.quiz.attempts} attempts)` : "not taken"}` : ""}{r.labIds.length ? ` · labs ${r.labsDone}/${r.labIds.length}` : ""}</span>
            </div>
            <ProgressBar value={r.pct} label={`Week ${r.week} lessons`} />
          </Card>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => { if (window.confirm("Erase all progress stored in this browser?")) reset(); }}>Reset all progress</Button>
    </div>
  );
}
