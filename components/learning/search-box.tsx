"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SearchEntry } from "@/lib/content/search";

function score(e: SearchEntry, terms: string[]) {
  const title = e.title.toLowerCase();
  const text = e.text.toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (title.includes(t)) s += 10;
    if (text.includes(t)) s += 2;
    else if (!title.includes(t)) return 0;
  }
  return s;
}

export function SearchBox() {
  const [q, setQ] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["search-index"],
    queryFn: async (): Promise<SearchEntry[]> => {
      const r = await fetch("/api/search-index");
      if (!r.ok) throw new Error(`Search index failed (${r.status})`);
      return r.json();
    },
  });
  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!data || terms.length === 0) return [];
    return data.map((e) => ({ e, s: score(e, terms) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 30);
  }, [data, q]);

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search the curriculum</span>
        <Search className="absolute left-3 top-3 text-muted" size={18} aria-hidden />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons, days, interview questions, flashcards…" className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-base" />
      </label>
      {isLoading && <p className="mt-4 text-muted">Loading index…</p>}
      {isError && <p className="mt-4 text-danger">Could not load the search index. <button className="underline cursor-pointer" onClick={() => refetch()}>Retry</button></p>}
      {q && !isLoading && results.length === 0 && <p className="mt-4 text-muted">No results for “{q}”.</p>}
      <ul className="mt-4 space-y-2">
        {results.map(({ e }) => (
          <li key={e.id}>
            <Link href={e.url} className="block rounded-xl border border-border bg-surface p-4 hover:border-brand">
              <div className="mb-1 flex items-center gap-2"><Badge tone="brand">Week {e.week}</Badge><Badge>{e.type}</Badge></div>
              <p className="font-medium">{e.title}</p>
              <p className="line-clamp-2 text-sm text-muted">{e.text.slice(0, 200)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
