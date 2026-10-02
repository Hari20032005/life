import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWeeks, getAssessment } from "@/lib/content/loader";
import { AssessmentView } from "@/components/learning/assessment-view";

type Params = { week: string };
export function generateStaticParams() {
  return getWeeks().filter((w) => getAssessment(w.week)).map((w) => ({ week: String(w.week) }));
}
export const metadata: Metadata = { title: "Weekly assessment" };

export default async function Page({ params }: { params: Promise<Params> }) {
  const n = Number((await params).week);
  const a = getAssessment(n);
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link className="text-sm text-muted hover:text-fg" href={`/weeks/${n}`}>← Week {n}</Link>
      <AssessmentView a={a} idPrefix={`assess-w${n}`} />
    </div>
  );
}
