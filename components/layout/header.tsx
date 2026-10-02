import Link from "next/link";
import { GraduationCap, Search } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { ModeSwitch } from "./mode-switch";
import { getWeeks } from "@/lib/content/loader";

const NAV = [
  { href: "/program", label: "Program" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/project", label: "Project" },
  { href: "/assessments", label: "Assess" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/interview", label: "Interview" },
  { href: "/prompts", label: "AI Prompts" },
  { href: "/progress", label: "Progress" },
];

export function Header() {
  const weeks = getWeeks();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <GraduationCap className="text-brand" size={22} aria-hidden /> <span>FullStack AI Academy</span>
        </Link>
        <nav aria-label="Main" className="hidden lg:flex items-center gap-1 text-sm">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="rounded-md px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-fg">{n.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ModeSwitch />
          <Link href="/search" aria-label="Search" className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg"><Search size={18} /></Link>
          <ThemeToggle />
        </div>
      </div>
      <nav aria-label="Weeks" className="border-t border-border overflow-x-auto">
        <ul className="mx-auto flex max-w-7xl gap-1 px-4 py-1.5 text-xs whitespace-nowrap">
          {weeks.map((w) => (
            <li key={w.week}>
              <Link href={`/weeks/${w.week}`} className="block rounded-md px-2.5 py-1 text-muted hover:bg-surface-2 hover:text-fg">
                <b className="text-fg">W{w.week}</b> {w.title.split(":")[0]}
              </Link>
            </li>
          ))}
          <li className="lg:hidden flex gap-1 pl-2 border-l border-border">
            {NAV.slice(0, 3).map((n) => <Link key={n.href} href={n.href} className="rounded-md px-2.5 py-1 text-muted hover:bg-surface-2">{n.label}</Link>)}
          </li>
        </ul>
      </nav>
    </header>
  );
}
