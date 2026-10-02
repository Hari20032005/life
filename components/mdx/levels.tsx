"use client";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { GraduationCap, Sprout, Rocket, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProgress } from "@/lib/store/progress";
import { useHydrated } from "@/hooks/use-hydrated";

const META = {
  beginner: { label: "Beginner", Icon: Sprout },
  intermediate: { label: "Intermediate", Icon: GraduationCap },
  advanced: { label: "Advanced", Icon: Rocket },
  industry: { label: "Industry", Icon: Building2 },
} as const;
type LevelId = keyof typeof META;

export function Level(_: { id: LevelId; children: ReactNode }) { return null; }

/** Four depth tabs. In Study mode all four are shown stacked; otherwise tabbed (Revision shows Beginner + Industry). */
export function Levels({ children }: { children: ReactNode }) {
  const mode = useProgress((s) => s.mode);
  const hydrated = useHydrated();
  const levels = Children.toArray(children).filter(isValidElement) as ReactElement<{ id: LevelId; children: ReactNode }>[];
  const effectiveMode = hydrated ? mode : "study";

  if (effectiveMode === "study") {
    return (
      <div className="my-6 space-y-4">
        {levels.map((l) => {
          const { label, Icon } = META[l.props.id];
          return (
            <section key={l.props.id} className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand"><Icon size={16} />{label}</h3>
              <div>{l.props.children}</div>
            </section>
          );
        })}
      </div>
    );
  }
  const visible = effectiveMode === "revision" ? levels.filter((l) => ["beginner", "industry"].includes(l.props.id)) : levels;
  return (
    <Tabs defaultValue={visible[0]?.props.id} className="my-6 rounded-xl border border-border bg-surface p-3">
      <TabsList>
        {visible.map((l) => <TabsTrigger key={l.props.id} value={l.props.id}>{META[l.props.id].label}</TabsTrigger>)}
      </TabsList>
      {visible.map((l) => <TabsContent key={l.props.id} value={l.props.id} className="px-2 pb-2">{l.props.children}</TabsContent>)}
    </Tabs>
  );
}
