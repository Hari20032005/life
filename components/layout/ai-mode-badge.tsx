import { Bot } from "lucide-react";
import type { AiMode } from "@/lib/content/schema";
import { AI_MODE } from "@/lib/ui-meta";
import { Badge } from "@/components/ui/badge";

export function AiModeBadge({ mode }: { mode: AiMode }) {
  const m = AI_MODE[mode];
  return <Badge tone={m.tone} title={m.blurb}><Bot size={12} aria-hidden />{m.label}</Badge>;
}
