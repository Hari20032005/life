import { Suspense } from "react";
import type { Metadata } from "next";
import { getInterview, WEEK_NUMBERS } from "@/lib/content/loader";
import { InterviewList } from "@/components/learning/interview-list";
import { InterviewWithParams } from "@/components/learning/interview-with-params";

export const metadata: Metadata = { title: "Interview mode" };

export default function InterviewPage() {
  const items = WEEK_NUMBERS.flatMap((n) => getInterview(n).map((i) => ({ ...i, week: n })));
  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-extrabold">Interview mode</h1><p className="mt-2 max-w-2xl text-muted">Answer out loud first. Then reveal the model answer. Use “Mock interview order” to shuffle and practise cold.</p></header>
      <Suspense fallback={<InterviewList items={items} />}>
        <InterviewWithParams items={items} />
      </Suspense>
    </div>
  );
}
