"use client";
import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Line = { kind: "log" | "error" | "warn"; text: string };

/** Runs learner-editable JavaScript inside a sandboxed iframe (no DOM/cookie/storage access to the parent). */
export function Playground({ code: initial, title = "Try it" }: { code: string; title?: string }) {
  const [code, setCode] = useState(initial.trim());
  const [lines, setLines] = useState<Line[] | null>(null);

  function run() {
    const out: Line[] = [];
    const channel = `pg-${Math.random().toString(36).slice(2)}`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.display = "none";

    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow || e.data?.channel !== channel) return;
      if (e.data.done) {
        window.removeEventListener("message", onMsg);
        iframe.remove();
        setLines(out.length ? out : [{ kind: "log", text: "(no output — use console.log)" }]);
        return;
      }
      out.push({ kind: e.data.kind, text: e.data.text });
    };
    window.addEventListener("message", onMsg);

    const safe = JSON.stringify(code).replace(/</g, "\\u003c");
    iframe.srcdoc = `<script>
      const send = (kind, text) => parent.postMessage({ channel: ${JSON.stringify(channel)}, kind, text }, "*");
      const fmt = (v) => typeof v === "string" ? v : (() => { try { return JSON.stringify(v, null, 2) } catch { return String(v) } })();
      for (const k of ["log","warn","error","info"]) console[k] = (...a) => send(k === "info" ? "log" : k, a.map(fmt).join(" "));
      (async () => {
        try { await (new (Object.getPrototypeOf(async function(){}).constructor)(${safe}))(); }
        catch (e) { send("error", String(e)); }
        finally { setTimeout(() => parent.postMessage({ channel: ${JSON.stringify(channel)}, done: true }, "*"), 50); }
      })();
    <\/script>`;
    document.body.appendChild(iframe);
    // Infinite-loop guard: give up after 3 seconds.
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        window.removeEventListener("message", onMsg);
        iframe.remove();
        setLines([...out, { kind: "error", text: "Timed out after 3s (infinite loop?)" }]);
      }
    }, 3000);
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{title} · JavaScript</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setCode(initial.trim()); setLines(null); }} aria-label="Reset code"><RotateCcw size={14} /> Reset</Button>
          <Button size="sm" onClick={run}><Play size={14} /> Run</Button>
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        aria-label="Editable code"
        className="block w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 outline-none min-h-32"
        rows={Math.min(18, code.split("\n").length + 1)}
      />
      {lines && (
        <pre className="border-t border-border bg-surface-2 p-3 text-xs leading-5 whitespace-pre-wrap" aria-live="polite">
          {lines.map((l, i) => (
            <div key={i} className={l.kind === "error" ? "text-danger" : l.kind === "warn" ? "text-warn" : ""}>{"› "}{l.text}</div>
          ))}
        </pre>
      )}
    </div>
  );
}
