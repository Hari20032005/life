import { chromium } from "playwright-core";
import fs from "node:fs";
const base = process.argv[2] ?? "http://localhost:3200";
const axeSrc = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const urls = ["/", "/program", "/roadmap", "/project", "/assessments", "/flashcards", "/interview", "/prompts", "/progress", "/search",
  "/weeks/0", "/weeks/0/day-1", "/weeks/0/day-1/url-to-page", "/weeks/0/quiz", "/weeks/3/day-4/frontend-auth", "/weeks/5/day-4/tool-calling", "/weeks/6/assessment"];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
let total = 0;
for (const scheme of ["light", "dark"]) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
  for (const u of urls) {
    await p.goto(base + u, { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    await p.addScriptTag({ content: axeSrc });
    const res = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].target.join(" ").slice(0, 90), help: v.help })));
    for (const v of res) { total++; console.log(`[${scheme}] ${u}  ${v.impact} ${v.id} x${v.n}: ${v.help}  e.g. ${v.sample}`); }
  }
  await p.close();
}
console.log(total === 0 ? "axe: no violations" : `axe: ${total} violation groups`);
await b.close();
