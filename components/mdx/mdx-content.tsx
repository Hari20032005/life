import type { ReactNode, ReactElement } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/content/loader";
import { CodeBlock } from "./code-block";
import { Mermaid } from "./mermaid";
import { Playground } from "./playground";
import { Levels, Level } from "./levels";
import { Callout } from "./callout";
import { Frame } from "./five-w";
import { Challenge } from "./reveal";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  return "";
}

const components = {
  h2: ({ children }: { children?: ReactNode }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
  h3: ({ children }: { children?: ReactNode }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
  pre: ({ children }: { children?: ReactNode }) => {
    const child = children as ReactElement<{ className?: string; children?: ReactNode }>;
    const lang = /language-(\w+)/.exec(child?.props?.className ?? "")?.[1] ?? "text";
    return <CodeBlock code={textOf(child?.props?.children).replace(/\n$/, "")} lang={lang} />;
  },
  // GFM task-list checkboxes are static and unlabeled; render them as decorative boxes (the item text carries the meaning).
  input: (props: { type?: string; checked?: boolean }) =>
    props.type === "checkbox" ? <span aria-hidden="true" className="mr-2 inline-block">{props.checked ? "☑" : "☐"}</span> : null,
  Mermaid, Playground, Levels, Level, Callout, Frame, Challenge,
};

export function MdxContent({ source }: { source: string }) {
  return (
    <div className="prose-lesson">
      <MDXRemote source={source} components={components} options={{ blockJS: false, blockDangerousJS: true, mdxOptions: { remarkPlugins: [remarkGfm] } }} />
    </div>
  );
}
