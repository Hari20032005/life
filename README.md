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

## Verification

```bash
npm run content:check                      # schemas + required lesson sections + every lesson compiles as MDX
npm run build && npx next start -p 3131 &  # then:
node scripts/smoke.mjs                     # browser: diagrams, playground, progress, quiz, flashcards, search, 360px overflow
node scripts/check-diagrams.mjs http://localhost:3131   # every Mermaid diagram on every lesson + /project renders
```

## Status

| Area | State |
|---|---|
| Platform: design system, themes, search, progress, quiz (4 question types), flashcards (Leitner), debug labs, interview mode, dashboard, study/revision/interview modes | Done |
| Official spec for Weeks 0-6 (every day: tasks, acceptance criteria, broken labs, rubrics) | Done |
| Booking-system evolution W1→W6 (diagrams, folders, schema, API, flows) | Done |
| Weekly assessments (rubric-mapped), mid-course, final, 4 mock interviews, AI prompts per week | Done |
| Cheat sheet + revision notes, quiz, flashcards, interview bank, labs for Weeks 0-6 | Done |
| Lessons: Week 0 (8), Week 1 (7), Week 2 (4), Week 3 (5), Week 4 (5), Week 5 (5), Week 6 (6) | Core topics covered; see gaps |

### Known gaps (honest list)

- Lessons are written for the main topic of most days, not every bullet of every day. Not yet written as full lessons: Week 0 Day 7 project guide; Week 1 Day 6/7 and Week 2 Day 5-7 guides (spec, labs and rubrics exist); Week 3 Day 6-7; Week 4 Day 6-7; Week 5 Day 6-7.
- Week 0-6 debug labs are text exercises with hidden solutions, not runnable broken repos. The provided "broken systems" the program refers to still need to be built as separate repos.
- Prices and hosting costs are intentionally not hard-coded: lessons tell learners to look up and date their own numbers.
- Code in lessons has been reviewed for consistency but not executed as a complete application (the booking API/app itself is what trainees build).
- Accessibility has been checked structurally (landmarks, labels, focus styles, no 360px overflow); a full Lighthouse/axe audit and CI workflow are not set up yet.
