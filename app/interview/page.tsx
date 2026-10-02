import type { Metadata } from "next";
import { getInterview, WEEK_NUMBERS } from "@/lib/content/loader";
import { InterviewList } from "@/components/learning/interview-list";

export const metadata: Metadata = { title: "Interview mode" };

export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const w = Number((await searchParams).week);
  const items = WEEK_NUMBERS.flatMap((n) => getInterview(n).map((i) => ({ ...i, week: n })));
  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-extrabold">Interview mode</h1><p className="mt-2 max-w-2xl text-muted">Answer out loud first. Then reveal the model answer. Use “Mock interview order” to shuffle and practise cold.</p></header>
      <InterviewList items={items} initialWeek={Number.isInteger(w) && w >= 0 && w <= 6 ? w : undefined} />
    </div>
  );
}
