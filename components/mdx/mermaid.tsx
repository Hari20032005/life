"use client";
import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

export function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
  const id = useId().replace(/:/g, "");
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: resolvedTheme === "dark" ? "dark" : "neutral", fontFamily: "inherit" });
        const { svg } = await mermaid.render(`m${id}`, chart.trim());
        if (!cancelled) { setSvg(svg); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Diagram failed to render");
      }
    })();
    return () => { cancelled = true; };
  }, [chart, id, resolvedTheme]);

  return (
    <figure className="my-6 rounded-xl border border-border bg-surface p-4 overflow-x-auto" aria-label={caption ?? "Diagram"}>
      {error ? (
        <pre className="text-xs text-danger whitespace-pre-wrap">{error}{"\n\n"}{chart}</pre>
      ) : svg ? (
        <div className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="h-24 animate-pulse rounded bg-surface-2" aria-busy="true" />
      )}
      {caption && <figcaption className="mt-3 text-center text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}
