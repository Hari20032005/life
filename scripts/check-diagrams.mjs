import { chromium } from "playwright-core";
import fs from "node:fs";
const base = process.argv[2] ?? "http://localhost:3130";
const urls = JSON.parse(fs.readFileSync("/tmp/urls.json", "utf8"));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
let bad = 0, total = 0;
for (const u of urls) {
  await p.goto(base + u, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({
    figs: document.querySelectorAll("figure[aria-label]").length,
    svgs: document.querySelectorAll("figure[aria-label] svg").length,
    errs: [...document.querySelectorAll("figure pre.text-danger")].map((e) => e.textContent.slice(0, 160)),
  }));
  total += r.figs;
  if (r.errs.length || r.svgs < r.figs) { bad++; console.log("BAD", u, `${r.svgs}/${r.figs}`, r.errs); }
}
console.log(`pages checked: ${urls.length}, diagrams: ${total}, pages with failing diagrams: ${bad}`);
await b.close();

// /project: diagrams live inside tabs that are only mounted when selected
{
  const b2 = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
  const pg = await b2.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto(base + "/project", { waitUntil: "networkidle" });
  const tabs = await pg.getByRole("tab").all();
  let projBad = 0;
  for (const t of tabs) {
    await t.click();
    await pg.waitForTimeout(1500);
    const r = await pg.evaluate(() => ({ figs: document.querySelectorAll("figure[aria-label]").length, svgs: document.querySelectorAll("figure[aria-label] svg").length, errs: [...document.querySelectorAll("figure pre.text-danger")].map((e) => e.textContent.slice(0, 120)) }));
    if (r.errs.length || r.svgs < r.figs || r.figs === 0) { projBad++; console.log("BAD project tab", await t.innerText(), `${r.svgs}/${r.figs}`, r.errs); }
  }
  console.log(`project tabs checked: ${tabs.length}, failing: ${projBad}`);
  await b2.close();
}
