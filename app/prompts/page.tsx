import type { Metadata } from "next";
import { getPrompts, getWeeks } from "@/lib/content/loader";
import { PromptCard } from "@/components/learning/prompt-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Callout } from "@/components/mdx/callout";

export const metadata: Metadata = { title: "AI prompt library" };

export default function PromptsPage() {
  const weeks = getWeeks().filter((w) => getPrompts(w.week).length);
  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-extrabold">AI prompt library</h1><p className="mt-2 max-w-2xl text-muted">Copy-paste prompts for tutoring, debugging, reviews and interviews, tuned to each week.</p></header>
      <Callout kind="ai" title="Remember the program's AI rule">Mornings: AI is a tutor only (explain, quiz, review — you type the code). Saturdays: no AI. Never paste secrets, API keys or client data into any prompt.</Callout>
      <Tabs defaultValue={`w${weeks[0]?.week ?? 0}`}>
        <TabsList>{weeks.map((w) => <TabsTrigger key={w.week} value={`w${w.week}`}>Week {w.week}</TabsTrigger>)}</TabsList>
        {weeks.map((w) => <TabsContent key={w.week} value={`w${w.week}`}><div className="grid gap-4 lg:grid-cols-2">{getPrompts(w.week).map((p) => <PromptCard key={p.kind} p={p} />)}</div></TabsContent>)}
      </Tabs>
    </div>
  );
}
