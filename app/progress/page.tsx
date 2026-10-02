import type { Metadata } from "next";
import { getWeeks, getLessons, getQuiz, getLabs } from "@/lib/content/loader";
import { Dashboard, type WeekInfo } from "@/components/learning/dashboard";

export const metadata: Metadata = { title: "Your progress" };

export default function ProgressPage() {
  const weeks: WeekInfo[] = getWeeks().map((w) => ({
    week: w.week, title: w.title,
    lessonKeys: getLessons(w.week).map((l) => `w${l.week}/${l.slug}`),
    hasQuiz: !!getQuiz(w.week),
    labIds: getLabs(w.week).map((l) => l.id),
  }));
  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-extrabold">Your progress</h1><p className="mt-2 text-muted">Stored only in this browser (localStorage). Nothing leaves your device.</p></header>
      <Dashboard weeks={weeks} />
    </div>
  );
}
