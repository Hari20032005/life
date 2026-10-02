import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllLessons, getLesson, getAdjacentLessons, extractHeadings, getWeek } from "@/lib/content/loader";
import { lessonHref } from "@/lib/ui-meta";
import { MdxContent } from "@/components/mdx/mdx-content";
import { LessonComplete } from "@/components/learning/lesson-complete";
import { Badge } from "@/components/ui/badge";

type Params = { week: string; day: string; lesson: string };

export function generateStaticParams() {
  return getAllLessons().map((l) => ({ week: String(l.week), day: `day-${l.day}`, lesson: l.slug }));
}
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const l = getLesson(Number(p.week), p.lesson);
  return { title: l?.meta.title ?? "Lesson", description: l?.meta.summary };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const n = Number(p.week);
  const lesson = getLesson(n, p.lesson);
  if (!lesson || `day-${lesson.meta.day}` !== p.day) notFound();
  const { meta, body } = lesson;
  const week = getWeek(n);
  const { prev, next } = getAdjacentLessons(n, p.lesson);
  const toc = extractHeadings(body).filter((h) => h.depth === 2);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <article className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
          <Link className="hover:text-fg" href={`/weeks/${n}`}>Week {n}</Link> / <Link className="hover:text-fg" href={`/weeks/${n}/day-${meta.day}`}>Day {meta.day}</Link> / {meta.module}
        </nav>
        <h1 className="text-3xl font-extrabold tracking-tight">{meta.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2"><Badge tone="brand">{week?.title}</Badge><Badge><Clock size={12} />{meta.minutes} min</Badge>{meta.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
        <p className="mt-4 text-lg text-muted">{meta.summary}</p>
        <div className="mt-6"><MdxContent source={body} /></div>

        <div className="mt-10 flex items-center justify-between rounded-xl border border-border bg-surface p-4">
          <LessonComplete lessonKey={`w${n}/${p.lesson}`} />
        </div>
        <nav aria-label="Lesson navigation" className="mt-6 grid gap-3 sm:grid-cols-2">
          {prev ? <Link href={lessonHref(prev.week, prev.day, prev.slug)} className="rounded-xl border border-border p-4 hover:border-brand"><span className="flex items-center gap-1 text-xs text-muted"><ChevronLeft size={14} />Previous</span><span className="font-medium">{prev.title}</span></Link> : <span />}
          {next ? <Link href={lessonHref(next.week, next.day, next.slug)} className="rounded-xl border border-border p-4 text-right hover:border-brand"><span className="flex items-center justify-end gap-1 text-xs text-muted">Next<ChevronRight size={14} /></span><span className="font-medium">{next.title}</span></Link> : <span />}
        </nav>
      </article>
      {toc.length > 0 && (
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-32 text-sm">
            <p className="mb-2 font-semibold">On this page</p>
            <ul className="space-y-1.5 border-l border-border">{toc.map((h) => <li key={h.id}><a className="-ml-px block border-l border-transparent pl-3 text-muted hover:border-brand hover:text-fg" href={`#${h.id}`}>{h.text}</a></li>)}</ul>
          </nav>
        </aside>
      )}
    </div>
  );
}
