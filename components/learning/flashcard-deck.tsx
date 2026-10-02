"use client";
import { useMemo, useState } from "react";
import { Check, RotateCw, X, Layers } from "lucide-react";
import type { Flashcard } from "@/lib/content/schema";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/store/progress";
import { useHydrated } from "@/hooks/use-hydrated";
import { shuffle } from "@/lib/utils";

/** Leitner-box spaced repetition: cards you miss return to box 1; cards you know move up and come back later. */
export function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const state = useProgress((s) => s.cards);
  const rate = useProgress((s) => s.rateCard);
  const hydrated = useHydrated();
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState(0);
  const [studyAll, setStudyAll] = useState(false);

  const queue = useMemo(() => {
    const now = Date.now();
    const due = hydrated && !studyAll ? cards.filter((c) => !state[c.id] || new Date(state[c.id].due).getTime() <= now) : cards;
    return order === 0 ? due : shuffle(due);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, hydrated, studyAll, order]);

  const [i, setI] = useState(0);
  const card = queue[i];
  const mastered = hydrated ? cards.filter((c) => (state[c.id]?.box ?? 0) >= 4).length : 0;

  if (!card) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-lg font-semibold">You&apos;re all caught up 🎉</p>
        <p className="text-sm text-muted">No cards are due. {mastered}/{cards.length} mastered.</p>
        <Button className="mt-4" variant="outline" onClick={() => { setStudyAll(true); setI(0); }}>Study all cards anyway</Button>
      </div>
    );
  }
  function answer(knew: boolean) {
    rate(card.id, knew);
    setFlipped(false);
    setI((x) => x + 1);
  }
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span className="flex items-center gap-1"><Layers size={14} /> Card {Math.min(i + 1, queue.length)} of {queue.length}</span>
        <span>{mastered}/{cards.length} mastered</span>
      </div>
      <button
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Showing answer. Click to show question" : "Showing question. Click to reveal answer"}
        className="flex min-h-64 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center shadow-sm transition hover:border-brand"
      >
        <span className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">{flipped ? "Answer" : card.topic}</span>
        <span className={flipped ? "text-base leading-relaxed whitespace-pre-wrap" : "text-xl font-semibold"}>{flipped ? card.back : card.front}</span>
        {!flipped && <span className="mt-6 flex items-center gap-1 text-xs text-muted"><RotateCw size={12} /> tap to reveal</span>}
      </button>
      <div className="mt-4 flex justify-center gap-3">
        <Button variant="outline" disabled={!flipped} onClick={() => answer(false)}><X size={16} /> Still learning</Button>
        <Button variant="success" disabled={!flipped} onClick={() => answer(true)}><Check size={16} /> I knew it</Button>
      </div>
      <div className="mt-3 text-center"><Button size="sm" variant="ghost" onClick={() => { setOrder((o) => o + 1); setI(0); setFlipped(false); }}>Shuffle</Button></div>
    </div>
  );
}
