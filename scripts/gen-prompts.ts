/* Generates the nine AI-prompt kinds for weeks 1-6 from week-specific focus text. Run once: npx tsx scripts/gen-prompts.ts */
import fs from "node:fs";
import path from "node:path";

const FOCUS: Record<number, { topics: string; product: string; review: string }> = {
  1: { topics: "TypeScript, Express, REST, Postgres, SQL, Drizzle, Zod, Vitest", product: "a booking REST API for a salon", review: "route/service/data separation, status codes, SQL correctness, transactions, validation" },
  2: { topics: "password hashing, JWT cookies, RBAC, OAuth/OIDC, OWASP, CSRF, rate limiting, CI", product: "authentication and authorization for the booking API", review: "authN vs authZ, ownership checks, token expiry, secrets, CORS, IDOR, mass assignment" },
  3: { topics: "React, Next.js App Router, server vs client components, forms, TanStack Query, accessibility, Playwright", product: "the booking web app frontend", review: "component design, keys, state immutability, effects, a11y, time zones" },
  4: { topics: "Docker, Compose, VPS hardening, DNS, Caddy, TLS, GitHub Actions, GHCR, backups, monitoring", product: "deploying the booking app to a VPS", review: "least privilege, exposed ports, secrets handling, rollback safety, backup restores" },
  5: { topics: "LLM APIs, prompts, embeddings, pgvector RAG, tool calling, evals, tracing, cost control", product: "an AI receptionist for the booking app", review: "prompt injection defence, pending-action confirmation, citations, eval coverage, cost caps" },
  6: { topics: "client discovery, architecture docs, scoping, change requests, launch checklists, handover", product: "a forward-deployed client solution", review: "scope clarity, measurable success criteria, single points of failure, cost estimate, AI patch safety" },
};

for (const [w, f] of Object.entries(FOCUS)) {
  const prompts = [
    { kind: "tutor", title: "Socratic tutor (morning rule)", when: "Morning, learning by hand", prompt: `You are my tutor for this week's topics: ${f.topics}. Do NOT write code for me. Explain concepts, ask one question at a time to check my understanding, and review code I paste. Start by asking what I already know.` },
    { kind: "claude", title: "First-principles explainer", when: "A concept isn't clicking", prompt: `Explain [CONCEPT] from first principles for a trainee building ${f.product}. Give: a real-world analogy, the mechanism, a failure scenario, and 3 quiz questions without answers.` },
    { kind: "chatgpt", title: "Quiz me", when: "Revision", prompt: `Quiz me on [TOPIC] from: ${f.topics}. Ask 8 questions of rising difficulty, one at a time, grade each answer and explain mistakes. Finish with weak areas.` },
    { kind: "debugging", title: "Debug without giving the answer", when: "Stuck during a build (not Saturday: Saturday is no-AI)", prompt: `Symptom: [SYMPTOM]. Relevant code/logs (secrets removed): [PASTE]. Do not fix it yet. Give 3 ranked hypotheses, the exact command or log to check each, and what result would confirm or reject it.` },
    { kind: "code-review", title: "Code review", when: "Before opening a PR", prompt: `Review this code for ${f.review}. List findings by severity with a one-line reason each and a suggested test. Do not rewrite the whole file. Code: [PASTE]` },
    { kind: "architecture-review", title: "Architecture review", when: "Before building the weekly project", prompt: `Here is my plan for ${f.product}: [PLAN]. Review it for single points of failure, missing edge cases, and over-engineering. Give the 3 biggest risks and the smallest change that fixes each.` },
    { kind: "pr-review", title: "PR review + explain-back drill", when: "Before the mentor checks 3 random lines", prompt: `Here is my PR diff and description: [DIFF]. First review it like a strict senior engineer. Then pick 3 random changed lines and ask me to explain each; grade my answers honestly. Check my "How I verified this" section is real.` },
    { kind: "learning", title: "Weekly learning plan", when: "Start of the week", prompt: `I'm starting a week on: ${f.topics}. I have mornings for hand-coding and afternoons to build with AI. Make a day-by-day plan with active-recall tasks, one thing to build by hand per morning, and one thing to verify per afternoon.` },
    { kind: "interview", title: "Mock interview", when: "Friday evening", prompt: `Act as an interviewer for a full-stack AI developer role. Ask me 10 questions on: ${f.topics}. Mix concept, debugging and design. One at a time, give feedback, then a score and a list of topics to revisit.` },
  ];
  fs.writeFileSync(path.join(process.cwd(), "content/weeks", `week-${w}`, "prompts.json"), JSON.stringify(prompts, null, 2) + "\n");
}
console.log("prompts generated");
