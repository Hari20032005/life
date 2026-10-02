"use client";
import { useSearchParams } from "next/navigation";
import { InterviewList, type InterviewRow } from "./interview-list";

/** Reads ?week= on the client so the /interview page itself stays statically prerendered. */
export function InterviewWithParams({ items }: { items: InterviewRow[] }) {
  const w = Number(useSearchParams().get("week"));
  return <InterviewList items={items} initialWeek={Number.isInteger(w) && w >= 0 && w <= 6 ? w : undefined} />;
}
