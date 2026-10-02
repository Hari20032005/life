import type { Metadata } from "next";
import { getFlashcards, WEEK_NUMBERS } from "@/lib/content/loader";
import { FlashcardDeck } from "@/components/learning/flashcard-deck";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Flashcards" };

export default function FlashcardsPage() {
  const byWeek = WEEK_NUMBERS.map((n) => ({ n, cards: getFlashcards(n) })).filter((x) => x.cards.length);
  const all = byWeek.flatMap((x) => x.cards);
  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-extrabold">Flashcards</h1><p className="mt-2 text-muted">Spaced repetition (Leitner boxes). Cards you miss come back immediately; cards you know come back in 1, 3, 7, then 14 days.</p></header>
      <Tabs defaultValue="all">
        <TabsList><TabsTrigger value="all">All weeks</TabsTrigger>{byWeek.map((x) => <TabsTrigger key={x.n} value={`w${x.n}`}>Week {x.n}</TabsTrigger>)}</TabsList>
        <TabsContent value="all"><FlashcardDeck cards={all} /></TabsContent>
        {byWeek.map((x) => <TabsContent key={x.n} value={`w${x.n}`}><FlashcardDeck cards={x.cards} /></TabsContent>)}
      </Tabs>
    </div>
  );
}
