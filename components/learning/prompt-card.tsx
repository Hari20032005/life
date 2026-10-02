"use client";
import type { PromptItem } from "@/lib/content/schema";
import { CopyButton } from "@/components/mdx/copy-button";
import { Badge } from "@/components/ui/badge";

export function PromptCard({ p }: { p: PromptItem }) {
  return (
    <article className="group relative rounded-xl border border-border bg-surface p-4">
      <div className="mb-1 flex items-center gap-2"><Badge tone="brand">{p.kind}</Badge><h2 className="font-semibold">{p.title}</h2></div>
      <p className="mb-3 text-xs text-muted">Use when: {p.when}</p>
      <CopyButton text={p.prompt} className="absolute right-3 top-3" />
      <pre className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-sm leading-relaxed">{p.prompt}</pre>
    </article>
  );
}
