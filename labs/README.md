# Runnable debug labs

Saturday labs are **no-AI**. Each lab is a small broken project plus an automated detector.

| Lab | Folder | Bugs |
|-----|--------|------|
| Week 0 | `labs/week-0/broken` | broken image path · CSS specificity · mobile overflow · unlabeled input · silent fetch failure · click handler attached twice |
| Week 1 | `labs/week-1/broken` | SQL injection · missing `await` · errors returned with 200 · missing foreign key (orphan bookings) · pool client never released · price stored as text · GROUP BY report with duplicate rows |
| Week 2 | `labs/week-2/broken` | plain-text passwords · JWTs that never expire · SQL injection in login · anyone can cancel any booking · hard-coded secret |
| Week 3 | `labs/week-3/broken` | `useEffect` with an unstable dependency (refetch loop) · index keys · session lost on refresh · form without validation · hydration mismatch from a date |
| Week 5 | `labs/week-5/broken` | instruction hidden in an uploaded PDF · bad chunking · time without a UTC offset · whole history resent every turn · invented answer when the documents don't contain it |
| Week 6 | `labs/week-6/` | AI-suggested patch that passes its tests but reopens an authorization hole (see below) |

## For learners
1. Copy `labs/week-0/broken` somewhere outside this repo and serve it (Live Server or `npx serve`).
2. Find and fix each bug using DevTools only. Write each up as symptom → cause → fix → how verified.
3. Check your work: copy the project over `labs/week-0/broken`, or point the checker at your folder, then run `node labs/week-0/check.mjs broken` and aim for **0 failing checks** on your own copy.
4. Don't open `labs/week-0/fixed` until you are done. (Mentors: delete `fixed/` before distributing the repo to trainees.)

### Week 1 notes
Needs Postgres: `cd labs/week-1 && npm install && docker compose up -d`, then `LAB_PG_URL=postgres://postgres:postgres@localhost:54329 node labs/week-1/check.mjs broken`.
The checker creates a throw-away database, applies `migrations/001_init.sql`, loads `legacy-seed.sql` (existing "production" data, including an orphan booking and text prices), then applies **your later migrations** (`002_*.sql`, ...) and probes the API. So the schema fixes (bugs 4 and 6) must be a **new migration** that repairs existing data, not an edit to 001. Probes run in an order that keeps them independent (the pool-leak check runs last because it exhausts the pool).

### Week 5 notes
No API key or network: the "model" is a deterministic stub in `labs/week-5/corpus.mjs` that is the **worst case** (it obeys any instruction it finds in documents) and retrieval uses a simple word-overlap vector instead of real embeddings. So this lab tests the code **around** the model: confirmation of actions, time validation, context size, chunking and abstention. It does not replace reading real LLM traces; use your own chatbot's traces for that. Run: `node labs/week-5/check.mjs broken`.

### Week 3 notes
A server-rendered React app (React from the repo's `node_modules`, bundled with esbuild as a **production** build, so Strict Mode's double effects are not in play). The harness serves it with SSR in **UTC** while the checker's browser runs as **Asia/Kolkata**, which is what makes the hydration mismatch real. Needs Chromium: `CHROMIUM_PATH` if not at `/opt/pw-browsers/chromium`. Run `node labs/week-3/check.mjs broken`; to debug by hand, edit `broken/App.jsx` and re-run (the harness rebuilds each time). `single-fix-mutants.py` shows that fixing any single bug flips only that bug's check.

### Week 2 notes
Needs Node 22+ (uses the built-in `node:sqlite`, no installs). Run the server logic through the checker: `node --no-warnings labs/week-2/check.mjs broken`. Sanity checks (login works, wrong password rejected, owners can cancel their own booking) must keep passing, so you can't "fix" a bug by breaking the app.
Bug 5 is checked as "no secret literal in the source file". The full lesson, rotating the secret and why deleting a committed file is not enough (`git log -p -S`), is still part of your written fix.

## For mentors
`node labs/week-0/check.mjs broken` must report exactly 6 failing checks (it exits 0 when that holds) and `... fixed` must report 0. Likewise `labs/week-2/check.mjs` (5 bugs / 0), `labs/week-1/check.mjs` (7 / 0, needs Postgres) and `labs/week-6/check.mjs`. `npm run labs:check` runs the no-database labs (Weeks 0, 2, 5, 6); `npm run labs:check:db` runs Week 1 (needs Postgres) and `npm run labs:check:browser` runs Week 3 (needs Chromium). The checker is browser-based (Playwright), so `CHROMIUM_PATH` may need to be set.

Bug 6 (handler attached twice) deliberately only shows from the **second** click, which is how it is usually discovered in real apps.

## Week 6: AI patch review (`labs/week-6`)
Three folders, same module:
- `start/` — original code; one test fails (owners get 404).
- `ai-patched/` — the "AI-suggested patch": every test in its own `tests.mjs` is green, but the permission matrix is broken. Find out how **by reading the diff** (`diff -ru start ai-patched`) before you run anything, including which test the agent edited.
- `fixed/` — reference solution.

`node labs/week-6/check.mjs <folder>` runs the folder's own tests and a hidden regression suite. For the lab: copy `start/` to your own folder, fix it by hand, then (and only then) ask an AI agent for its own fix and compare. Mentors: delete `ai-patched/tests.mjs` annotations (`// edited by the agent`) and `fixed/` before handing the repo to trainees.
