import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Target, ListChecks, ClipboardCheck, Wrench } from "lucide-react";
import { getWeek, getWeeks, getLessons, getQuiz, getInterview, getLabs, getPrompts, getMarkdown, getAssessment, getFlashcards, getResources } from "@/lib/content/loader";
import { dayHref } from "@/lib/ui-meta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiModeBadge } from "@/components/layout/ai-mode-badge";
import { LessonsProgress } from "@/components/learning/progress-widgets";
import { MdxContent } from "@/components/mdx/mdx-content";
import { LabList } from "@/components/learning/lab-list";
import { PromptCard } from "@/components/learning/prompt-card";
import { InterviewList } from "@/components/learning/interview-list";
import { FlashcardDeck } from "@/components/learning/flashcard-deck";

type Params = { week: string };

export function generateStaticParams() {
  return getWeeks().map((w) => ({ week: String(w.week) }));
}
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const w = getWeek(Number((await params).week));
  return { title: w ? `Week ${w.week}: ${w.title}` : "Week" };
}

function Empty({ what }: { what: string }) {
  return <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{what} for this week is coming soon.</p>;
}

export default async function WeekPage({ params }: { params: Promise<Params> }) {
  const n = Number((await params).week);
  const week = Number.isInteger(n) ? getWeek(n) : null;
  if (!week) notFound();

  const lessons = getLessons(n);
  const quiz = getQuiz(n);
  const interview = getInterview(n).map((i) => ({ ...i, week: n }));
  const labs = getLabs(n);
  const prompts = getPrompts(n);
  const cheat = getMarkdown(n, "cheatsheet");
  const revision = getMarkdown(n, "revision");
  const assessment = getAssessment(n);
  const cards = getFlashcards(n);
  const resources = getResources(n);
  const keys = lessons.map((l) => `w${l.week}/${l.slug}`);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-brand">Week {week.week}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{week.title}</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted">{week.goal}</p>
        <div className="mt-4 max-w-md"><LessonsProgress keys={keys} label={`Week ${week.week} progress`} /></div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList aria-label="Week sections">
          {[["overview", "Overview"], ["days", "Daily breakdown"], ["project", "Project"], ["labs", "Debug labs"], ["quiz", "Quiz"], ["interview", "Interview"], ["cards", "Flashcards"], ["cheat", "Cheat sheet"], ["revision", "Revision"], ["resources", "Resources"], ["prompts", "AI prompts"], ["assessment", "Assessment"]].map(([v, l]) => <TabsTrigger key={v} value={v}>{l}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {week.skippable && <Card className="border-warn/40 bg-warn/5"><b>Test-out option. </b>{week.skippable}</Card>}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Target size={20} className="text-brand" />Learning objectives</h2>
            <ul className="list-disc space-y-1 pl-6">{week.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
          </section>
          <section><h2 className="mb-2 text-xl font-bold">Where this fits in the product</h2><p className="text-muted">{week.projectStage}</p><Button asChild variant="outline" className="mt-3"><Link href="/project">See the full evolution</Link></Button></section>
        </TabsContent>

        <TabsContent value="days">
          <ol className="grid gap-4 md:grid-cols-2">
            {week.days.map((d) => {
              const dl = lessons.filter((l) => l.day === d.day);
              return (
                <li key={d.day}>
                  <Link href={dayHref(week.week, d.day)} className="block h-full">
                    <Card className="h-full transition hover:border-brand">
                      <div className="mb-1 flex flex-wrap items-center gap-2"><Badge>Day {d.day} · {d.weekday}</Badge><AiModeBadge mode={d.aiMode} /></div>
                      <h3 className="text-lg font-semibold">{d.title}</h3>
                      <p className="mt-1 text-sm text-muted">{dl.length ? `${dl.length} lesson${dl.length > 1 ? "s" : ""}` : d.isProjectDay ? "Weekly project" : d.aiMode === "no-ai" ? "Debug lab" : "Spec & tasks"} · {d.tasks.length} tasks · {d.acceptance.length} acceptance criteria</p>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ol>
        </TabsContent>

        <TabsContent value="project" className="space-y-5">
          <h2 className="text-2xl font-bold">{week.project.name}</h2>
          {week.project.brief && <blockquote className="border-l-4 border-brand pl-4 italic text-muted">{week.project.brief}</blockquote>}
          <section><h3 className="mb-2 flex items-center gap-2 font-semibold"><ListChecks size={18} />Requirements</h3><ul className="list-disc space-y-1 pl-6">{week.project.requirements.map((r) => <li key={r}>{r}</li>)}</ul></section>
          {week.project.stretch.length > 0 && <section><h3 className="mb-2 font-semibold">Stretch</h3><ul className="list-disc space-y-1 pl-6">{week.project.stretch.map((r) => <li key={r}>{r}</li>)}</ul></section>}
          <section>
            <h3 className="mb-2 flex items-center gap-2 font-semibold"><ClipboardCheck size={18} />Rubric (100%)</h3>
            <div className="overflow-x-auto"><table className="w-full max-w-xl border-collapse text-sm"><tbody>
              {week.project.rubric.map((r) => <tr key={r.item}><td className="border border-border p-2">{r.item}</td><td className="w-20 border border-border p-2 text-right font-semibold">{r.points}</td></tr>)}
            </tbody></table></div>
          </section>
        </TabsContent>

        <TabsContent value="labs">{labs.length ? <LabList labs={labs} /> : <Empty what="Detailed debug labs" />}
          {week.days.find((d) => d.brokenLab.length) && (
            <Card className="mt-6"><h3 className="mb-2 flex items-center gap-2 font-semibold"><Wrench size={16} />Saturday broken-lab checklist (official)</h3>
              <ul className="list-disc space-y-1 pl-6 text-sm">{week.days.find((d) => d.brokenLab.length)!.brokenLab.map((b) => <li key={b}>{b}</li>)}</ul></Card>
          )}
        </TabsContent>

        <TabsContent value="quiz">
          {quiz ? <Card><h2 className="text-xl font-bold">{quiz.title}</h2><p className="mt-1 text-muted">{quiz.questions.length} questions · pass mark {quiz.passMark}% · MCQ, multi-select, true/false and scenarios.</p><Button asChild className="mt-4"><Link href={`/weeks/${n}/quiz`}>Start quiz</Link></Button></Card> : <Empty what="The quiz" />}
        </TabsContent>
        <TabsContent value="interview">{interview.length ? <InterviewList items={interview} initialWeek={n} /> : <Empty what="Interview questions" />}</TabsContent>
        <TabsContent value="cards">{cards.length ? <FlashcardDeck cards={cards} /> : <Empty what="Flashcards" />}</TabsContent>
        <TabsContent value="cheat">{cheat ? <MdxContent source={cheat} /> : <Empty what="The cheat sheet" />}</TabsContent>
        <TabsContent value="revision">{revision ? <MdxContent source={revision} /> : <Empty what="Revision notes" />}</TabsContent>
        <TabsContent value="resources">
          {resources.length ? (
            <div>
              <p className="mb-4 text-sm text-muted">Official docs and tools for this week. They open in a new tab. If a link has moved, tell your mentor.</p>
              <ul className="grid gap-3 md:grid-cols-2">
                {resources.map((r) => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="block h-full rounded-xl border border-border bg-surface p-4 hover:border-brand">
                      <div className="mb-1 flex items-center gap-2"><Badge>{r.kind}</Badge><span className="font-semibold">{r.title}<span className="sr-only"> (opens in a new tab)</span></span></div>
                      <p className="text-sm text-muted">{r.why}</p>
                      <p className="mt-1 truncate text-xs text-brand">{new URL(r.url).hostname}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : <Empty what="Resources" />}
        </TabsContent>
        <TabsContent value="prompts">{prompts.length ? <div className="grid gap-4 lg:grid-cols-2">{prompts.map((p) => <PromptCard key={p.kind} p={p} />)}</div> : <Empty what="AI prompts" />}</TabsContent>
        <TabsContent value="assessment">
          {assessment ? <Card><h2 className="text-xl font-bold">{assessment.title}</h2><p className="text-muted">{assessment.durationMinutes} minutes</p><Button asChild className="mt-4"><Link href={`/weeks/${n}/assessment`}>Open assessment</Link></Button></Card> : <Empty what="The weekly assessment" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
