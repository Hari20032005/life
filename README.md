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
npm run ci:lint         # static lint of .github/workflows (scripts/files it references exist, YAML parses)
npm run build && npx next start -p 3200 &
npm run check:browser   # smoke test, every Mermaid diagram renders, axe accessibility on every lesson + key pages (light and dark)
npm run labs:check      # runnable labs (Weeks 0, 2, 4, 5, 6): broken fails exactly its bugs, fixed passes
npm run labs:check:browser   # Week 3 lab (needs Chromium)
npm run labs:check:db        # Week 1 lab (needs Postgres, see labs/README.md)
```
The browser scripts default to `/opt/pw-browsers/chromium`; override with `CHROMIUM_PATH`. Each script takes the server URL as its first argument (default `http://localhost:3200`).
`.github/workflows/ci.yml` runs all of this on pull requests. **The workflow has never run on GitHub**; `ci:lint` only checks it statically, so expect small fixes on first use.

## Status

| Area | State |
|---|---|
| Platform: design system, themes, search, progress, quiz (4 question types), flashcards (Leitner), debug labs, interview mode, dashboard, study/revision/interview modes | Done |
| Official spec for Weeks 0-6 (every day: tasks, acceptance criteria, broken labs, rubrics) | Done |
| Booking-system evolution W1→W6 (diagrams, folders, schema, API, flows) | Done |
| Weekly assessments (rubric-mapped), mid-course, final, 4 mock interviews, AI prompts per week | Done |
| Cheat sheet, revision notes, quiz, flashcards, interview bank, labs for Weeks 0-6 | Done |
| Lessons (57): W0 9, W1 11, W2 9, W3 7, W4 8, W5 8, W6 5. Every Mon-Fri main topic, every Saturday debugging method, and a Sunday project guide for Weeks 0-5; supplementary lessons on the event loop, API styles/webhooks, dependency scanning, TOTP 2FA, backend models (Convex), MCP | Done |
| Runnable labs with detectors: W0, W1 (real Postgres), W2, W3 (SSR React in Chromium), W4 (config audit), W5 (simulated model), W6 (AI patch review); checkers proven precise one bug at a time | Done |
| Accessibility: axe-core clean on all 57 lessons + 17 key pages in light and dark; 71 Mermaid diagrams render | Verified locally |

### Known limits (honest list)

- **CI has never run on GitHub.** `npm run ci:lint` checks it statically; the browser/Postgres/lab steps were each run locally but not inside Actions.
- **Labs are rehearsals, not the real thing.** The Week 4 lab audits configuration files; the graded task still requires a real VPS with DNS and HTTPS. The Week 5 lab uses a deterministic worst-case model stub and word-overlap retrieval, so it tests the code around the model, not real LLM behaviour or real traces.
- **Lesson code was not executed as a complete application.** What *was* executed and verified: the labs, the TOTP implementation (against the RFC 4226/6238 test vectors), the webhook verifier, and the event-loop demo. The Anthropic SDK snippets in Week 5 follow the SDK documentation but were not run against the API (no key available).
- **Some items still get a paragraph, not a lesson:** Vite specifics, Uptime Kuma/Better Stack setup, Coolify/Dokploy walkthroughs, Playwright configuration, Excalidraw. Learners are told what to look for and which docs to read.
- **Prices and hosting costs are intentionally not hard-coded;** lessons tell learners to look up and date their own numbers.
- **Assessments are self-scored checklists,** not graded submissions; there is no backend, accounts or instructor view (progress lives in the browser's localStorage).
