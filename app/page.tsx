import Link from "next/link";
import { ArrowRight, Bot, Bug, Layers, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { getWeeks, getLessons } from "@/lib/content/loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LessonsProgress } from "@/components/learning/progress-widgets";

const FEATURES = [
  { Icon: Layers, title: "First-principles lessons", body: "Every topic is taught as What / Why / How / When / Where, at four depths: beginner, intermediate, advanced and industry." },
  { Icon: Sparkles, title: "Visual & interactive", body: "Mermaid sequence diagrams, runnable code playgrounds, quizzes, flashcards and revision mode." },
  { Icon: Bug, title: "No-AI debug labs", body: "Every Saturday is a broken system with hidden solutions you reveal only after you've tried." },
  { Icon: Bot, title: "Ready-made AI prompts", body: "Tutor, debugging, code-review, architecture-review, PR-review and interview prompts for every week." },
  { Icon: ShieldCheck, title: "Explain-back culture", body: "The program rule: if you can't explain a changed line, it doesn't merge. The site trains that habit." },
  { Icon: Rocket, title: "One product, six weeks", body: "A booking system evolves from API → auth → web app → live deploy → AI receptionist → client capstone." },
];

export default function Home() {
  const weeks = getWeeks();
  const allKeys = weeks.flatMap((w) => getLessons(w.week).map((l) => `w${l.week}/${l.slug}`));
  return (
    <div className="space-y-16">
      <section className="py-10 text-center">
        <p className="mb-3 inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">Six weeks · Beginner → job-ready</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Become a <span className="text-brand">Full-Stack AI Developer</span> without leaving this page</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">By Week 6 you can take a business problem from a client, scope it, design it, build it full-stack with AI, deploy it, add RAG + tool calling, and demo it.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link href="/weeks/0">Start Week 0 <ArrowRight size={16} /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/roadmap">See the roadmap</Link></Button>
        </div>
        <div className="mx-auto mt-8 max-w-md text-left"><LessonsProgress keys={allKeys} label="Your overall progress" /></div>
      </section>

      <section aria-labelledby="weeks-h">
        <h2 id="weeks-h" className="mb-5 text-2xl font-bold">The seven weeks</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weeks.map((w) => {
            const keys = getLessons(w.week).map((l) => `w${l.week}/${l.slug}`);
            return (
              <Link key={w.week} href={`/weeks/${w.week}`} className="group">
                <Card className="h-full transition group-hover:border-brand">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand">Week {w.week}</p>
                  <h3 className="mt-1 text-lg font-semibold">{w.title}</h3>
                  <p className="mb-3 text-sm text-muted">{w.tagline}</p>
                  <p className="mb-4 line-clamp-3 text-sm">{w.goal}</p>
                  <LessonsProgress keys={keys} label={`Week ${w.week}`} />
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="why-h">
        <h2 id="why-h" className="mb-5 text-2xl font-bold">How this platform teaches</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <Card key={title}><Icon className="mb-2 text-brand" size={22} aria-hidden /><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted">{body}</p></Card>
          ))}
        </div>
      </section>
    </div>
  );
}
