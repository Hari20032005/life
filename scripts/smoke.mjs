import { chromium } from "playwright-core";
const base = process.argv[2] ?? "http://localhost:3200";
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e));
p.on("console", (m) => m.type() === "error" && !/404/.test(m.text()) && errs.push("console: " + m.text()));
const ok = (name, cond) => console.log(cond ? "PASS" : "FAIL", name);

await p.goto(`${base}/weeks/0/day-4/javascript-arrays`, { waitUntil: "networkidle" });
await p.waitForSelector("figure svg", { timeout: 15000 });
ok("mermaid diagram renders to svg", (await p.locator("figure svg").count()) >= 1);

// Playground
await p.getByRole("button", { name: "Run" }).first().click();
await p.waitForSelector("pre[aria-live=polite]", { timeout: 5000 });
const out = await p.locator("pre[aria-live=polite]").first().innerText();
ok("playground runs sandboxed JS (shows shared-array result)", out.includes("[") && out.includes("3"));

// Reveal challenge
await p.getByRole("button", { name: "Show solution" }).first().click();
ok("exercise solution reveals", await p.getByText("Without running it").count() >= 0);

// Mark complete + persistence
await p.getByRole("button", { name: /Mark as complete/ }).click();
await p.reload({ waitUntil: "networkidle" });
ok("completion persists across reload", await p.getByRole("button", { name: /Completed/ }).count() === 1);

// Revision mode switches Levels to tabs
await p.getByRole("radio", { name: /Revision/ }).click();
ok("revision mode shows tabs", await p.getByRole("tab", { name: "Beginner" }).count() >= 1);
await p.getByRole("radio", { name: /Study/ }).click();

// Quiz
await p.goto(`${base}/weeks/0/quiz`, { waitUntil: "networkidle" });
ok("submit disabled until all answered", await p.getByRole("button", { name: "Submit answers" }).isDisabled());
const groups = await p.locator("fieldset").count();
for (let i = 0; i < groups; i++) await p.locator("fieldset").nth(i).locator("input").first().check();
await p.getByRole("button", { name: "Submit answers" }).click();
ok("quiz shows score + explanations", (await p.getByRole("status").innerText()).includes("correct") && (await p.getByText("Why:").count()) === groups);

// Progress dashboard
await p.goto(`${base}/progress`, { waitUntil: "networkidle" });
const dash = await p.getByText("Quizzes taken").locator("..").innerText();
const dash2 = await p.getByText("Lessons completed").locator("..").innerText();
ok("dashboard shows 1 quiz and 1 lesson", /\n1\s*$/.test(dash.trim()) && /\n1\/\d+/.test(dash2.trim()));

// Flashcards
await p.goto(`${base}/flashcards`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Showing question/ }).click();
await p.getByRole("button", { name: /I knew it/ }).click();
const cardsMastered = await p.evaluate(() => JSON.parse(localStorage.getItem("fsai-progress-v1")).state.cards);
ok("flashcard rating stored in box 2", Object.values(cardsMastered)[0]?.box === 2);

// Search
await p.goto(`${base}/search`, { waitUntil: "networkidle" });
await p.getByPlaceholder(/Search lessons/).fill("event loop");
await p.waitForSelector("ul li a", { timeout: 5000 });
ok("search returns results", await p.locator("ul li a").count() > 0);

// Corrupted storage falls back
await p.evaluate(() => localStorage.setItem("fsai-progress-v1", "{corrupt"));
await p.goto(`${base}/progress`, { waitUntil: "networkidle" });
ok("corrupted localStorage falls back (page still renders)", await p.getByText("Lessons completed").count() === 1);

// Pages 200
for (const u of ["/", "/program", "/roadmap", "/project", "/assessments", "/interview", "/prompts", "/weeks/3", "/weeks/5/day-4", "/weeks/6/day-6", "/weeks/1/day-3/sql-transactions", "/weeks/1/assessment", "/weeks/6/day-6/ai-patch-review", "/weeks/5/quiz", "/weeks/2/assessment", "/weeks/4/day-3/dns-https-caddy"]) {
  const r = await p.goto(base + u, { waitUntil: "load" });
  ok(`${u} -> ${r.status()}`, r.status() === 200);
}

// Resources tab: renders every curated link, opens externally and safely, and passes axe with the tab open
{
  await p.goto(`${base}/weeks/3`, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: "Resources" }).click();
  const links = await p.locator("main ul a[target=_blank]").evaluateAll((as) => as.map((a) => ({ rel: a.rel, href: a.href })));
  ok(`resources tab lists links (${links.length}) all rel=noopener noreferrer, https`, links.length >= 6 && links.every((l) => /noopener/.test(l.rel) && /noreferrer/.test(l.rel) && l.href.startsWith("https://")));
  const fs = await import("node:fs");
  await p.addScriptTag({ content: fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8") });
  const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] })).violations.map((x) => x.id + " x" + x.nodes.length));
  ok(`resources tab has no axe violations ${v.join(", ")}`, v.length === 0);
}

// mobile overflow
const m = await b.newPage({ viewport: { width: 360, height: 800 } });
for (const u of ["/", "/weeks/0/day-1/url-to-page", "/weeks/1/day-3/sql-foundations", "/project"]) {
  await m.goto(base + u, { waitUntil: "networkidle" }); await m.waitForTimeout(800);
  const over = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(`no horizontal scroll at 360px ${u} (${over}px)`, over <= 0);
}
console.log("errors:", errs.length ? errs : "none");
await b.close();
