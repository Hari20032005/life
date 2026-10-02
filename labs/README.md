# Runnable debug labs

Saturday labs are **no-AI**. Each lab is a small broken project plus an automated detector.

| Lab | Folder | Bugs |
|-----|--------|------|
| Week 0 | `labs/week-0/broken` | broken image path · CSS specificity · mobile overflow · unlabeled input · silent fetch failure · click handler attached twice |
| Week 1 | `labs/week-1/broken` | SQL injection · missing `await` · errors returned with 200 · missing foreign key (orphan bookings) · pool client never released · price stored as text · GROUP BY report with duplicate rows |
| Week 2 | `labs/week-2/broken` | plain-text passwords · JWTs that never expire · SQL injection in login · anyone can cancel any booking · hard-coded secret |

## For learners
1. Copy `labs/week-0/broken` somewhere outside this repo and serve it (Live Server or `npx serve`).
2. Find and fix each bug using DevTools only. Write each up as symptom → cause → fix → how verified.
3. Check your work: copy the project over `labs/week-0/broken`, or point the checker at your folder, then run `node labs/week-0/check.mjs broken` and aim for **0 failing checks** on your own copy.
4. Don't open `labs/week-0/fixed` until you are done. (Mentors: delete `fixed/` before distributing the repo to trainees.)

### Week 1 notes
Needs Postgres: `cd labs/week-1 && npm install && docker compose up -d`, then `LAB_PG_URL=postgres://postgres:postgres@localhost:54329 node labs/week-1/check.mjs broken`.
The checker creates a throw-away database, applies `migrations/001_init.sql`, loads `legacy-seed.sql` (existing "production" data, including an orphan booking and text prices), then applies **your later migrations** (`002_*.sql`, ...) and probes the API. So the schema fixes (bugs 4 and 6) must be a **new migration** that repairs existing data, not an edit to 001. Probes run in an order that keeps them independent (the pool-leak check runs last because it exhausts the pool).

### Week 2 notes
Needs Node 22+ (uses the built-in `node:sqlite`, no installs). Run the server logic through the checker: `node --no-warnings labs/week-2/check.mjs broken`. Sanity checks (login works, wrong password rejected, owners can cancel their own booking) must keep passing, so you can't "fix" a bug by breaking the app.
Bug 5 is checked as "no secret literal in the source file". The full lesson, rotating the secret and why deleting a committed file is not enough (`git log -p -S`), is still part of your written fix.

## For mentors
`node labs/week-0/check.mjs broken` must report exactly 6 failing checks (it exits 0 when that holds) and `... fixed` must report 0. Likewise `labs/week-2/check.mjs` (5 bugs / 0), `labs/week-1/check.mjs` (7 / 0, needs Postgres) and `labs/week-6/check.mjs`. `npm run labs:check` runs the no-database labs; `npm run labs:check:db` runs Week 1. The checker is browser-based (Playwright), so `CHROMIUM_PATH` may need to be set.

Bug 6 (handler attached twice) deliberately only shows from the **second** click, which is how it is usually discovered in real apps.

## Week 6: AI patch review (`labs/week-6`)
Three folders, same module:
- `start/` — original code; one test fails (owners get 404).
- `ai-patched/` — the "AI-suggested patch": every test in its own `tests.mjs` is green, but the permission matrix is broken. Find out how **by reading the diff** (`diff -ru start ai-patched`) before you run anything, including which test the agent edited.
- `fixed/` — reference solution.

`node labs/week-6/check.mjs <folder>` runs the folder's own tests and a hidden regression suite. For the lab: copy `start/` to your own folder, fix it by hand, then (and only then) ask an AI agent for its own fix and compare. Mentors: delete `ai-patched/tests.mjs` annotations (`// edited by the agent`) and `fixed/` before handing the repo to trainees.
