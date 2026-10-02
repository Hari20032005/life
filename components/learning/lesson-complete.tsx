"use client";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/store/progress";
import { useHydrated } from "@/hooks/use-hydrated";

export function LessonComplete({ lessonKey }: { lessonKey: string }) {
  const done = useProgress((s) => !!s.completedLessons[lessonKey]);
  const toggle = useProgress((s) => s.toggleLesson);
  const hydrated = useHydrated();
  const isDone = hydrated && done;
  return (
    <Button variant={isDone ? "success" : "outline"} onClick={() => toggle(lessonKey)} aria-pressed={isDone}>
      {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />} {isDone ? "Completed" : "Mark as complete"}
    </Button>
  );
}
