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
npm run content:check   # schemas + required lesson sections + every lesson compiles as MDX
npm run lint            # tsc --noEmit
npm run build && npx next start -p 3200 &
npm run check:browser   # smoke test, every Mermaid diagram renders, axe accessibility (light + dark)
```
The browser scripts default to `/opt/pw-browsers/chromium`; override with `CHROMIUM_PATH`, and pass the server URL as the first argument (default ports are set per script).
`.github/workflows/ci.yml` runs all of this on pull requests. **The workflow has not yet run on GitHub**, so expect to fix small issues on first use.

## Status

| Area | State |
|---|---|
| Platform: design system, themes, search, progress, quiz (4 question types), flashcards (Leitner), debug labs, interview mode, dashboard, study/revision/interview modes | Done |
| Official spec for Weeks 0-6 (every day: tasks, acceptance criteria, broken labs, rubrics) | Done |
| Booking-system evolution W1→W6 (diagrams, folders, schema, API, flows) | Done |
| Weekly assessments (rubric-mapped), mid-course, final, 4 mock interviews, AI prompts per week | Done |
| Cheat sheet, revision notes, quiz, flashcards, interview bank, labs for Weeks 0-6 | Done |
| Lessons (46): W0 9, W1 8, W2 6, W3 6, W4 6, W5 6, W6 5, including a Sunday project guide for Weeks 0-5 | Done for the main topic of each day |
| Accessibility: axe-core, 17 pages x light/dark, no violations; 59 Mermaid diagrams render | Verified locally |

### Known gaps (honest list)

- Lessons cover the main topic of each day, not every bullet. Smaller items (for example Vite details, Convex, WebSockets, MCP depth, Semgrep usage) get a paragraph or less.
- Runnable labs with automated detectors exist for Week 0 (static page), Week 1 (booking API on real Postgres, `npm run labs:check:db`), Week 2 (auth server) and Week 6 (AI patch review); Weeks 0, 2, 5 and 6 use only Node built-ins (`npm run labs:check`; the Week 5 lab uses a simulated worst-case model and word-overlap retrieval, so it tests the code around the model, not real LLM behaviour). Week 3 is a server-rendered React app checked in headless Chromium (`npm run labs:check:browser`). Week 4 is a config-audit rehearsal (compose/env/Caddy/DNS files), not a live server; the graded task still requires a real VPS.
- Prices and hosting costs are intentionally not hard-coded; lessons tell learners to look up and date their own numbers.
- Lesson code was reviewed for consistency but not run as a complete application.
- The CI workflow is untested on GitHub runners.
