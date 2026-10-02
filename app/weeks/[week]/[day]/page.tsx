import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookOpen, CheckSquare, Clock, Bug, Flag } from "lucide-react";
import { getWeek, getWeeks, getLessons } from "@/lib/content/loader";
import { lessonHref, AI_MODE, dayHref } from "@/lib/ui-meta";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiModeBadge } from "@/components/layout/ai-mode-badge";
import { LessonDoneIcon } from "@/components/learning/progress-widgets";
import { Checklist } from "@/components/learning/checklist";

type Params = { week: string; day: string };

export function generateStaticParams() {
  return getWeeks().flatMap((w) => w.days.map((d) => ({ week: String(w.week), day: `day-${d.day}` })));
}
function parse(p: Params) {
  const n = Number(p.week);
  const d = Number(/^day-(\d)$/.exec(p.day)?.[1]);
  const week = Number.isInteger(n) ? getWeek(n) : null;
  const day = week?.days.find((x) => x.day === d);
  return week && day ? { week, day } : null;
}
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const r = parse(await params);
  return { title: r ? `W${r.week.week} D${r.day.day}: ${r.day.title}` : "Day" };
}

export default async function DayPage({ params }: { params: Promise<Params> }) {
  const r = parse(await params);
  if (!r) notFound();
  const { week, day } = r;
  const lessons = getLessons(week.week).filter((l) => l.day === day.day);
  const modules = [...new Set(lessons.map((l) => l.module))];
  const prev = week.days.find((d) => d.day === day.day - 1);
  const next = week.days.find((d) => d.day === day.day + 1);
  const cid = `w${week.week}d${day.day}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link className="hover:text-fg" href={`/weeks/${week.week}`}>Week {week.week}: {week.title}</Link> / Day {day.day}</nav>
      <header>
        <div className="flex flex-wrap items-center gap-2"><Badge>Day {day.day} · {day.weekday}</Badge><AiModeBadge mode={day.aiMode} /></div>
        <h1 className="mt-2 text-3xl font-extrabold">{day.title}</h1>
        <p className="mt-2 text-sm text-muted">{AI_MODE[day.aiMode].blurb}</p>
      </header>

      {lessons.length > 0 && (
        <section aria-labelledby="lessons-h">
          <h2 id="lessons-h" className="mb-3 flex items-center gap-2 text-xl font-bold"><BookOpen size={20} className="text-brand" />Lessons</h2>
          {modules.map((m) => (
            <div key={m} className="mb-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{m}</h3>
              <ul className="space-y-2">
                {lessons.filter((l) => l.module === m).map((l) => (
                  <li key={l.slug}>
                    <Link href={lessonHref(week.week, day.day, l.slug)} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-brand">
                      <LessonDoneIcon lessonKey={`w${week.week}/${l.slug}`} />
                      <span className="flex-1"><span className="block font-medium">{l.title}</span><span className="block text-sm text-muted">{l.summary}</span></span>
                      <span className="flex items-center gap-1 text-xs text-muted"><Clock size={12} />{l.minutes} min</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {day.learn.length > 0 && <section><h2 className="mb-3 text-xl font-bold">What you learn</h2><ul className="list-disc space-y-1 pl-6">{day.learn.map((l) => <li key={l}>{l}</li>)}</ul></section>}

      {day.brokenLab.length > 0 && (
        <Card className="border-danger/40 bg-danger/5"><h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><Bug size={18} />The broken lab</h2><ul className="list-disc space-y-1 pl-6 text-sm">{day.brokenLab.map((b) => <li key={b}>{b}</li>)}</ul>
          <p className="mt-3 text-sm"><Link className="text-brand underline" href={`/weeks/${week.week}`}>Open the week&apos;s Debug labs tab</Link> for hints and hidden solutions.</p></Card>
      )}

      <section><h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><CheckSquare size={20} className="text-brand" />Tasks</h2><Checklist idPrefix={`${cid}-t`} items={day.tasks} /></section>
      <section><h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Flag size={20} className="text-success" />Acceptance criteria</h2><Checklist idPrefix={`${cid}-a`} items={day.acceptance} /></section>

      <footer className="flex justify-between border-t border-border pt-4 text-sm">
        {prev ? <Link className="text-brand" href={dayHref(week.week, prev.day)}>← Day {prev.day}: {prev.title}</Link> : <span />}
        {next ? <Link className="text-brand" href={dayHref(week.week, next.day)}>Day {next.day}: {next.title} →</Link> : <span />}
      </footer>
    </div>
  );
}
