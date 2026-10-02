# Runnable debug labs

Saturday labs are **no-AI**. Each lab is a small broken project plus an automated detector.

| Lab | Folder | Bugs |
|-----|--------|------|
| Week 0 | `labs/week-0/broken` | broken image path · CSS specificity · mobile overflow · unlabeled input · silent fetch failure · click handler attached twice |
| Week 2 | `labs/week-2/broken` | plain-text passwords · JWTs that never expire · SQL injection in login · anyone can cancel any booking · hard-coded secret |

## For learners
1. Copy `labs/week-0/broken` somewhere outside this repo and serve it (Live Server or `npx serve`).
2. Find and fix each bug using DevTools only. Write each up as symptom → cause → fix → how verified.
3. Check your work: copy the project over `labs/week-0/broken`, or point the checker at your folder, then run `node labs/week-0/check.mjs broken` and aim for **0 failing checks** on your own copy.
4. Don't open `labs/week-0/fixed` until you are done. (Mentors: delete `fixed/` before distributing the repo to trainees.)

### Week 2 notes
Needs Node 22+ (uses the built-in `node:sqlite`, no installs). Run the server logic through the checker: `node --no-warnings labs/week-2/check.mjs broken`. Sanity checks (login works, wrong password rejected, owners can cancel their own booking) must keep passing, so you can't "fix" a bug by breaking the app.
Bug 5 is checked as "no secret literal in the source file". The full lesson, rotating the secret and why deleting a committed file is not enough (`git log -p -S`), is still part of your written fix.

## For mentors
`node labs/week-0/check.mjs broken` must report exactly 6 failing checks (it exits 0 when that holds) and `... fixed` must report 0. Likewise `labs/week-2/check.mjs` (5 bugs / 0). `npm run labs:check` runs all four. The checker is browser-based (Playwright), so `CHROMIUM_PATH` may need to be set.

Bug 6 (handler attached twice) deliberately only shows from the **second** click, which is how it is usually discovered in real apps.
