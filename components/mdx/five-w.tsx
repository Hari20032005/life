import type { ReactNode } from "react";

/** Teaches every topic with the same What/Why/How/When/Where frame. */
export function Frame({ what, why, how, when, where }: { what: ReactNode; why: ReactNode; how: ReactNode; when: ReactNode; where: ReactNode }) {
  const rows: [string, ReactNode][] = [["What", what], ["Why", why], ["How", how], ["When", when], ["Where", where]];
  return (
    <dl className="my-6 grid gap-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-border bg-surface p-4">
          <dt className="mb-1 text-xs font-bold uppercase tracking-widest text-brand">{k}</dt>
          <dd className="text-[0.95rem] leading-relaxed">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
