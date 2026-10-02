import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWeeks, getQuiz } from "@/lib/content/loader";
import { QuizRunner } from "@/components/learning/quiz-runner";

type Params = { week: string };
export function generateStaticParams() {
  return getWeeks().filter((w) => getQuiz(w.week)).map((w) => ({ week: String(w.week) }));
}
export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage({ params }: { params: Promise<Params> }) {
  const n = Number((await params).week);
  const quiz = getQuiz(n);
  if (!quiz) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link className="text-sm text-muted hover:text-fg" href={`/weeks/${n}`}>← Week {n}</Link>
      <h1 className="mb-6 mt-2 text-3xl font-extrabold">{quiz.title}</h1>
      <QuizRunner quiz={quiz} storageKey={`week-${n}`} />
    </div>
  );
}
