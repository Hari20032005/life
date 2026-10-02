"use client";
import { useProgress } from "@/lib/store/progress";
import { useHydrated } from "@/hooks/use-hydrated";

export function Checklist({ idPrefix, items }: { idPrefix: string; items: string[] }) {
  const checks = useProgress((s) => s.checklist);
  const toggle = useProgress((s) => s.toggleCheck);
  const hydrated = useHydrated();
  return (
    <ul className="space-y-2">
      {items.map((t, i) => {
        const id = `${idPrefix}${i}`;
        const on = hydrated && !!checks[id];
        return (
          <li key={id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 text-sm hover:bg-surface-2">
              <input type="checkbox" className="mt-1" checked={on} onChange={() => toggle(id)} />
              <span className={on ? "text-muted line-through" : ""}>{t}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
