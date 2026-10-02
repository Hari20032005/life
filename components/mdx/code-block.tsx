import { codeToHtml } from "shiki";
import { Mermaid } from "./mermaid";
import { CopyButton } from "./copy-button";

export async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  if (lang === "mermaid") return <Mermaid chart={code} />;
  let html: string;
  try {
    html = await codeToHtml(code, { lang, themes: { light: "github-light", dark: "github-dark" }, defaultColor: false });
  } catch {
    html = await codeToHtml(code, { lang: "text", themes: { light: "github-light", dark: "github-dark" }, defaultColor: false });
  }
  return (
    <div className="group relative my-5 min-w-0 max-w-full">
      <span className="absolute left-3 top-0 -translate-y-1/2 rounded bg-surface-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted border border-border">{lang}</span>
      <CopyButton text={code} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
