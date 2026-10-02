# FullStack AI Academy

Interactive learning platform for the **Six-Week Full-Stack AI Developer Training Program** (Week 0 → Week 6).
Architecture plan: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Run

```bash
npm install
npm run dev            # http://localhost:3000
npm run content:check  # validate every content file + lesson quality rules
npm run build && npm start
```

## Adding content (no React needed)

| To add | Create |
|---|---|
| A lesson | `content/weeks/week-N/lessons/<slug>.mdx` with frontmatter (`title, day, order, module, minutes, summary, tags`) |
| Quiz / interview / flashcards / labs / prompts / assessment | `quiz.json`, `interview.json`, `flashcards.json`, `labs.json`, `prompts.json`, `assessment.json` in the week folder |
| Cheat sheet / revision | `cheatsheet.mdx`, `revision.mdx` |

Lessons must contain the sections `What / Why / How / When / Where / Common mistakes / Industry usage` and a `<Levels>` block (Beginner, Intermediate, Advanced, Industry). `npm run content:check` fails otherwise.

MDX components: `<Levels>/<Level id>`, `<Callout kind>`, `<Challenge kind answer={…}>` (hidden solutions), `<Playground code={`…`} />` (sandboxed JS runner), and ```` ```mermaid ```` fences.

## Status

| Area | State |
|---|---|
| Design system, layout, theme, search, progress, quiz, flashcards (Leitner), labs, interview mode, dashboard | Done |
| Official spec for Weeks 0–6 (all days, tasks, acceptance criteria, rubrics, broken labs) | Done |
| Booking-system evolution W1→W6 (diagrams, folders, schema, API, flows) | Done |
| Program + mock-interview assessments, AI prompts for every week | Done |
| Week 0 deep content | 5 lessons, quiz, flashcards, interview, 6 labs, cheat sheet, revision, assessment (remaining: terminal/Git/DevTools lesson, DOM/events lesson, debugging lesson) |
| Week 1 deep content | Day 3 SQL (3 lessons covering Modules 1-10), quiz, flashcards |
| Weeks 2–6 lessons, quizzes, labs, flashcards, interview banks | Spec + prompts only — **to be written** |
