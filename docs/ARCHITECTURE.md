# FullStack AI Academy — Architecture Plan

A learning platform for the **Six-Week Full-Stack AI Developer Training Program** (Week 0 → Week 6).

## 1. Principles

1. **Content is data, not code.** Curriculum lives in `content/` (MDX + JSON). Adding a lesson never requires touching React.
2. **Static first.** Every page is statically generated (`generateStaticParams`). Interactivity (progress, quizzes, playground) is client-side and persists in `localStorage`, so the site can be hosted on any static host and scales to hundreds of trainees at zero cost.
3. **Typed content.** Every JSON/frontmatter shape is validated by Zod at build time (`lib/content/schema.ts`). A malformed quiz fails the build instead of breaking in front of a trainee.
4. **Pedagogy is a schema.** Each lesson is written with the same sections (What / Why / How / When / Where / Common mistakes / Industry usage) and four depth levels (Beginner / Intermediate / Advanced / Industry) via `<Levels>` components, so quality is enforceable.
5. **The program's AI rule is a first-class UI element.** Morning = hand-coding, afternoon = AI-assisted, Saturday = no-AI debug lab. Every day shows its AI mode badge.

## 2. Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn-style UI primitives (Radix + cva) · Framer Motion · Lucide · MDX (`next-mdx-remote/rsc`) · Mermaid (client-rendered) · Recharts · Zustand (`persist`) · TanStack Query (content search index) · Shiki (server-side code highlighting).

## 3. Folder structure

```
app/
  layout.tsx                 root layout, theme, providers
  page.tsx                   Home
  program/page.tsx           Program overview + rules
  roadmap/page.tsx           Interactive roadmap
  weeks/[week]/page.tsx      Week overview (tabs: Overview, Days, Project, Quiz, Interview, Cheatsheet, Revision, Assessment)
  weeks/[week]/[day]/page.tsx        Day page (modules list, tasks, acceptance criteria)
  weeks/[week]/[day]/[lesson]/page.tsx   Lesson page (MDX)
  weeks/[week]/quiz/page.tsx
  weeks/[week]/assessment/page.tsx
  project/page.tsx           Booking-system evolution (W1→W6)
  assessments/page.tsx       Daily / weekly / mid / final / interview mocks
  flashcards/page.tsx
  revision/page.tsx
  interview/page.tsx
  prompts/page.tsx           AI prompt library
  progress/page.tsx          Dashboard (Recharts)
  search/page.tsx
  api/search-index/route.ts  static JSON search index
components/
  ui/                        Button, Card, Badge, Tabs, Progress, Dialog …
  layout/                    Header, Sidebar, Footer, ThemeToggle, CommandPalette
  mdx/                       Callout, Levels, Mermaid, CodeBlock, Playground, DebugLab, Quiz embed …
  learning/                  QuizRunner, FlashcardDeck, ProgressRing, LessonComplete, WeekCard …
content/
  program.json               Global rules, rubrics, AI rule
  project/booking-evolution.json
  weeks/week-N/
    week.json                Goal, days, tasks, acceptance criteria, rubric (the official spec)
    lessons/*.mdx            Frontmatter + body
    quiz.json | interview.json | flashcards.json | labs.json | prompts.json | assessment.json
    cheatsheet.mdx | revision.mdx
lib/
  content/schema.ts          Zod schemas
  content/loader.ts          fs readers (server only), cached
  content/search.ts          index builder
  store/progress.ts          Zustand persisted store
  utils.ts
hooks/                       useProgress, useHydrated, useSearch
types/
public/
docs/
```

## 4. Content schema

| File | Shape |
|------|-------|
| `week.json` | `{ week, slug, title, goal, audience, skippable, days[]: { day, label, weekday, title, aiMode, learn[], tasks[], acceptance[], lessons[] }, project, rubric[], stretch }` |
| `lessons/*.mdx` frontmatter | `{ title, day, order, module, minutes, summary, tags[] }` |
| `quiz.json` | `questions[]: { id, type: mcq \| multi \| tf \| scenario, prompt, options[], answer, explanation, topic }` |
| `interview.json` | `{ id, level, q, a, followUps[] }` |
| `flashcards.json` | `{ id, front, back, topic }` |
| `labs.json` | `{ id, title, symptom, hint[], cause, fix, verify }` (hidden solutions) |
| `prompts.json` | one prompt for each of: tutor, claude, chatgpt, debug, code-review, architecture-review, pr-review, learning, interview |

## 5. Routing strategy

All routes are SSG. Slugs: `week-0 … week-6`, `day-1 … day-7`, lesson slug from filename. Lesson ordering comes from frontmatter `order`; prev/next navigation is computed across the whole program so "Continue" always works.

## 6. Progress model (client)

```ts
{ completedLessons: Record<lessonKey, ISO>,   // "w0/d1/how-the-web-works"
  completedDays:    Record<dayKey, ISO>,
  quizScores:       Record<weekSlug, {best, attempts, last}>,
  flashcards:       Record<cardId, {box: 1-5, due: ISO}>,   // Leitner
  debugLabsSolved:  Record<labId, ISO>,
  mode: "study" | "revision" | "interview" }
```
Persisted with `zustand/persist` under `fsai-progress-v1` with a version migrate and a try/catch-safe storage (corrupted data → defaults, mirroring what Week 0 teaches).

## 7. Learning modes

- **Study** — full lesson, all four depth levels expanded.
- **Revision** — only "key points", cheat-sheet and flashcards.
- **Interview** — hides answers behind reveal, randomises questions.

## 8. Implementation roadmap

| Phase | Deliverable |
|-------|-------------|
| 1 | Architecture + scaffold (this doc) |
| 2 | Design system: tokens, UI primitives, layout, theme |
| 3 | Content engine: Zod schemas, loader, MDX components, Mermaid, code highlighting, search |
| 4 | Week 0 in full depth |
| 5 | Weeks 1–6: full spec data for every day + lessons |
| 6 | Quizzes, interview banks, assessments |
| 7 | Progress tracking, flashcards, dashboard |
| 8 | Polish: a11y, SEO, perf, CI |

## 9. Quality bar for each lesson

Each lesson contains: What, Why, How, When, Where, Common mistakes, Industry usage; Beginner → Industry explanations; at least one diagram where a mechanism exists; exercise; quiz tie-in; interview questions. A lint script (`npm run content:check`) fails the build if a lesson lacks the required headings.
