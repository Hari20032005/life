"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import type { Question, Quiz } from "@/lib/content/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProgress } from "@/lib/store/progress";
import { shuffle, cn } from "@/lib/utils";

type Answer = number | number[] | boolean | undefined;

function isCorrect(q: Question, a: Answer): boolean {
  if (a === undefined) return false;
  if (q.type === "multi") {
    const sel = [...(a as number[])].sort();
    const ans = [...q.answer].sort();
    return sel.length === ans.length && sel.every((v, i) => v === ans[i]);
  }
  return q.answer === a;
}

const TYPE_LABEL: Record<Question["type"], string> = { mcq: "Multiple choice", multi: "Select all that apply", tf: "True / False", scenario: "Scenario" };

export function QuizRunner({ quiz, storageKey }: { quiz: Quiz; storageKey: string }) {
  const record = useProgress((s) => s.recordQuiz);
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => (seed === 0 ? quiz.questions : shuffle(quiz.questions)), [quiz, seed]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.filter((q) => isCorrect(q, answers[q.id])).length;
  const pct = Math.round((score / questions.length) * 100);
  const answeredAll = questions.every((q) => answers[q.id] !== undefined && !(Array.isArray(answers[q.id]) && (answers[q.id] as number[]).length === 0));

  function submit() {
    setSubmitted(true);
    record(storageKey, pct);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function retry() { setAnswers({}); setSubmitted(false); setSeed((s) => s + 1); }

  return (
    <div className="space-y-6">
      {submitted && (
        <div role="status" className={cn("rounded-xl border p-5", pct >= quiz.passMark ? "border-success/40 bg-success/5" : "border-warn/40 bg-warn/5")}>
          <p className="flex items-center gap-2 text-lg font-bold"><Trophy size={20} /> {score}/{questions.length} correct ({pct}%)</p>
          <p className="text-sm text-muted">{pct >= quiz.passMark ? "Passed. Review any misses below, then move on." : `Pass mark is ${quiz.passMark}%. Read the explanations, revisit the lesson, and try again.`}</p>
          <Button className="mt-3" variant="outline" onClick={retry}><RotateCcw size={14} /> Retry (shuffled)</Button>
        </div>
      )}
      {questions.map((q, i) => {
        const a = answers[q.id];
        const ok = submitted && isCorrect(q, a);
        const options: string[] = q.type === "tf" ? ["True", "False"] : q.options;
        return (
          <fieldset key={q.id} disabled={submitted} className="rounded-xl border border-border bg-surface p-5">
            <legend className="sr-only">Question {i + 1}</legend>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="brand">Q{i + 1}</Badge><Badge>{TYPE_LABEL[q.type]}</Badge><Badge>{q.topic}</Badge>
              {submitted && (ok ? <Badge tone="success"><CheckCircle2 size={12} />Correct</Badge> : <Badge tone="danger"><XCircle size={12} />Incorrect</Badge>)}
            </div>
            <p className="mb-3 whitespace-pre-wrap font-medium">{q.prompt}</p>
            <div className="space-y-2">
              {options.map((opt, oi) => {
                const selected = q.type === "multi" ? ((a as number[] | undefined) ?? []).includes(oi) : q.type === "tf" ? a === (oi === 0) : a === oi;
                const isAns = q.type === "multi" ? q.answer.includes(oi) : q.type === "tf" ? q.answer === (oi === 0) : q.answer === oi;
                return (
                  <label key={oi} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm",
                    submitted && isAns ? "border-success bg-success/10" : submitted && selected ? "border-danger bg-danger/10" : selected ? "border-brand bg-brand/5" : "border-border hover:bg-surface-2")}>
                    <input
                      type={q.type === "multi" ? "checkbox" : "radio"}
                      name={q.id}
                      checked={selected}
                      className="mt-1"
                      onChange={() =>
                        setAnswers((prev) => {
                          if (q.type === "multi") {
                            const cur = (prev[q.id] as number[] | undefined) ?? [];
                            return { ...prev, [q.id]: cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi] };
                          }
                          return { ...prev, [q.id]: q.type === "tf" ? oi === 0 : oi };
                        })
                      }
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
            {submitted && <p className="mt-3 rounded-lg bg-surface-2 p-3 text-sm"><b>Why: </b>{q.explanation}</p>}
          </fieldset>
        );
      })}
      {!submitted && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-border bg-surface/95 p-3 backdrop-blur">
          <span className="text-sm text-muted">{Object.keys(answers).length}/{questions.length} answered</span>
          <Button onClick={submit} disabled={!answeredAll}>Submit answers</Button>
        </div>
      )}
    </div>
  );
}
