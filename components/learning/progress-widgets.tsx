"use client";
import { useProgress } from "@/lib/store/progress";
import { useHydrated } from "@/hooks/use-hydrated";
import { ProgressBar } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

export function useCompletedCount(keys: string[]) {
  const completed = useProgress((s) => s.completedLessons);
  const hydrated = useHydrated();
  return hydrated ? keys.filter((k) => completed[k]).length : 0;
}

export function LessonsProgress({ keys, label }: { keys: string[]; label: string }) {
  const done = useCompletedCount(keys);
  const pct = keys.length ? (done / keys.length) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted"><span>{label}</span><span>{done}/{keys.length} lessons</span></div>
      <ProgressBar value={pct} label={label} />
    </div>
  );
}

export function LessonDoneIcon({ lessonKey }: { lessonKey: string }) {
  const done = useProgress((s) => !!s.completedLessons[lessonKey]);
  const hydrated = useHydrated();
  return hydrated && done ? <CheckCircle2 size={16} className="text-success shrink-0" aria-label="Completed" /> : <span className="size-4 shrink-0 rounded-full border border-border" aria-hidden />;
}
