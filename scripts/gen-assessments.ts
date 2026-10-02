/* Builds each week's assessment.json: rubric items/points come from week.json; the checkable tasks are hand-mapped below
   from the official project requirements + acceptance criteria. Run: npx tsx scripts/gen-assessments.ts */
import fs from "node:fs";
import path from "node:path";

const TASKS: Record<number, Record<string, string[]>> = {
  1: {
    "Scope doc + schema design": ["1-page scope: entities, endpoints, business rules, out of scope", "Schema with FKs, CHECKs, UNIQUE, timestamptz; ON DELETE choice justified per FK", "Partial unique index blocks double bookings; cancelled slot can be rebooked"],
    "API correctness + status codes": ["Services/customers CRUD, create/list/cancel bookings, availability for a date", "200/201/204/400/404/409 used correctly; JSON body on every non-204", "No double or past bookings; cancel sets status instead of deleting"],
    "Validation + error handling": ["Zod validation on every route with field-level 400 errors", "Invalid JSON returns 400; unknown path returns JSON 404; DB down returns 500 with no stack trace", "CSV import reports bad rows with line numbers; re-run creates no duplicates"],
    "Tests": ["Happy-path and failure test per route; npm test green", "Mentor breaks 3 lines: at least one test goes red for each", "Concurrency test: two overlapping bookings, exactly one succeeds"],
    "README + reproducible setup": ["Clean clone: install, migrate, seed and run with documented commands", "Bruno collection passes with bru run", "README explains scope, design decisions and how I verified this"],
  },
  2: {
    "Auth works securely": ["Passwords hashed (argon2/bcrypt), never logged; emails unique case-insensitively", "Same 401 message for unknown user and wrong password; tokens expire; secrets in .env", "Email/password and Google login both work; state checked; linking requires email_verified + password confirmation"],
    "Roles + ownership correct": ["Owner, staff, customer permissions match the written matrix", "Customer cannot read or cancel another customer's booking (tested)", "Every route has an explicit permission rule: 401 without login, 403 for wrong role"],
    "Security hardening": ["Helmet, CORS allowlist (frontend origin only), rate limit on login/signup", "Origin check: POST with Origin https://evil.example returns 403", "npm audit + Semgrep findings fixed or documented; SQLi, mass assignment and IDOR attacks written up"],
    "Tests + CI": ["Integration tests for signup, login, logout, roles and ownership against a real Postgres", "GitHub Actions runs lint + tests with the pgvector service container; coverage 80%+ on auth and booking logic", "Branch protection blocks a PR with a failing test"],
    "README + security notes": ["Scope updated first from the client message", "Security notes: what was tested, how, and results", "Setup and verification steps reproducible"],
  },
  3: {
    "Booking flow works end to end": ["Customer: browse services, pick a slot, book, see and cancel own bookings", "Owner: bookings by day, cancel, mark done, manage services", "Two tabs booking the same slot: one succeeds, the other sees a clear 409 message"],
    "Auth + roles in the UI": ["Email/password and Google login; auth persists across refresh", "Logged-out users redirected from protected pages; role-based pages", "Backend still rejects forbidden actions (shown with curl)"],
    "UX polish + accessibility": ["Loading, error and empty states for every fetch", "Works at 360px and 1440px; keyboard navigable; Lighthouse accessibility 90+", "A 10:00 booking shows 10:00 with the laptop in another time zone"],
    "Tests": ["Unit/component tests (login form, bookings list)", "Playwright E2E: sign up, book, see booking, cancel", "Shared Zod schema validates on client and server"],
    "README + screenshots": ["Scope updated first from the client message", "Screenshots at mobile and desktop widths", "Setup, test commands and how I verified this"],
  },
  4: {
    "Live and working over HTTPS": ["Live URL with a valid certificate; HTTP redirects to HTTPS", "Login works on the live site including protected Next.js pages", "Custom domain/subdomain with correct cookie Domain/Secure/SameSite and exact CORS origin"],
    "CI/CD + migrations": ["Merging to main builds, pushes to GHCR and deploys with no manual steps", "A failed migration stops the deploy and the old version keeps running", "Rollback to the previous image in under 5 minutes following the runbook"],
    "Server security": ["SSH keys only; password and root login disabled", "ufw allows only 22/80/443; nmap from outside confirms", "No secrets in repo or images; non-root containers; non-Caddy ports bound to 127.0.0.1"],
    "Monitoring, alerts + backups": ["Error thrown in production appears in error tracking with stack trace", "Stopping the API triggers an alert within 5 minutes", "Nightly off-server backup with a timed, successful restore drill"],
    "Runbook + README": ["RUNBOOK.md: deploy, roll back, restore, read logs", "Second deploy via Coolify/Dokploy with a when-to-use comparison", "Hosting cost comparison with sources and dates; production DB choice justified"],
  },
  5: {
    "RAG answers correct with citations": ["Documents loaded into pgvector; retrieval returns the right chunks on the 10-question set", "Answers cite the document they came from", "Bot says I don't know when the answer is not in the documents (no made-up prices); chunk size justified with results"],
    "Tool calling safe and correct": ["check_availability, create_booking, cancel_booking call the existing service layer with the user's identity", "Create/cancel run only via Confirm with the pending action id (tested); model text never triggers them", "Date without UTC offset or in the past is rejected, not booked; every tool call logged"],
    "Evals + tracing": ["30-case eval set run in CI with a reported pass rate (85%+ or failures explained)", "Every conversation traceable end to end", "Eval cases cover injection, unknown answers, tool calls and out-of-scope questions"],
    "Guardrails + cost control": ["Out-of-scope questions politely refused; injection attempts written up with fixes", "Cost per conversation measured and written in the README", "Daily token limit: with the limit low, next request returns 429 with a clear message"],
    "README + demo video": ["Scope updated first from the client message; deployed on the Week 4 VPS", "2-minute demo video linked in the README", "Chat widget on the booking site works end to end"],
  },
  6: {
    "Solves the client's actual problem": ["Problem statement in the client's words and numbers, signed off", "Measurable success criteria with baselines and results", "Change request answered in writing; merged or explicitly moved to v2"],
    "Full-stack + AI functionality": ["Core flow works end to end on the live site", "AI components (RAG/tools/classification as designed) behave correctly on real examples", "Reuse of Weeks 1-5 building blocks is deliberate and documented"],
    "Security, tests + evals": ["Every PR has tests and a How I verified this section", "Eval results and security checks recorded in the README", "AI patch bug found, explained, fixed by hand; capstone reviewed for the same bug class"],
    "Deployment + operations": ["Live URL with HTTPS, CI/CD, monitoring on", "Backups tested; rollback rehearsed", "Local setup and deployment setup clearly separated"],
    "Demo, handover docs + AI workflow reflection": ["10-minute live demo with results against success criteria; Loom recorded", "Handover pack: README, architecture doc, API reference, runbook, known limits, monthly cost", "README AI section: what AI helped build, how verified, where it was wrong and how AI's fix differed from mine"],
  },
};

for (const n of [1, 2, 3, 4, 5, 6]) {
  const dir = path.join(process.cwd(), "content/weeks", `week-${n}`);
  const week = JSON.parse(fs.readFileSync(path.join(dir, "week.json"), "utf8"));
  const parts = week.project.rubric.map((r: { item: string; points: number }) => {
    const tasks = TASKS[n][r.item];
    if (!tasks) throw new Error(`Week ${n}: no tasks mapped for rubric item "${r.item}"`);
    return { title: r.item, points: r.points, tasks };
  });
  const assessment = {
    title: `Week ${n} Assessment: ${week.project.name}`,
    durationMinutes: 120,
    rules: [
      "Mentor present. AI use follows the day's rule (Sunday project: afternoon rules; explain-back still applies).",
      "Tick a task only when you can demonstrate it live and explain the code behind it.",
      "Every fix or finding is written up as symptom → cause → fix → how verified.",
    ],
    parts,
  };
  fs.writeFileSync(path.join(dir, "assessment.json"), JSON.stringify(assessment, null, 2) + "\n");
}
console.log("assessments generated");
