import "server-only";
import { getAllLessons, getLesson, getWeeks, getInterview, getFlashcards, WEEK_NUMBERS } from "./loader";

export interface SearchEntry { id: string; type: "lesson" | "week" | "day" | "interview" | "flashcard"; title: string; url: string; text: string; week: number }

function strip(md: string) {
  return md.replace(/```[\s\S]*?```/g, " ").replace(/<[^>]+>/g, " ").replace(/[#*_`>|\[\]()-]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildSearchIndex(): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const w of getWeeks()) {
    out.push({ id: `week-${w.week}`, type: "week", title: `Week ${w.week}: ${w.title}`, url: `/weeks/${w.week}`, text: `${w.goal} ${w.outcomes.join(" ")}`, week: w.week });
    for (const d of w.days) {
      out.push({
        id: `w${w.week}d${d.day}`, type: "day", title: `Week ${w.week} Day ${d.day}: ${d.title}`, url: `/weeks/${w.week}/day-${d.day}`,
        text: [...d.learn, ...d.tasks, ...d.acceptance].join(" "), week: w.week,
      });
    }
  }
  for (const l of getAllLessons()) {
    const full = getLesson(l.week, l.slug);
    out.push({ id: `l-${l.week}-${l.slug}`, type: "lesson", title: l.title, url: `/weeks/${l.week}/day-${l.day}/${l.slug}`, text: `${l.summary} ${l.tags.join(" ")} ${strip(full?.body ?? "")}`.slice(0, 6000), week: l.week });
  }
  for (const n of WEEK_NUMBERS) {
    for (const q of getInterview(n)) out.push({ id: q.id, type: "interview", title: q.q, url: `/interview?week=${n}`, text: q.a, week: n });
    for (const c of getFlashcards(n)) out.push({ id: c.id, type: "flashcard", title: c.front, url: `/flashcards?week=${n}`, text: c.back, week: n });
  }
  return out;
}
