/* Detects each of the six Week 0 lab bugs. Usage: node labs/week-0/check.mjs [broken|fixed]
   Expected: broken -> 6 FAIL, fixed -> 0 FAIL. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const which = process.argv[2] ?? "fixed";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), which);
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/\/$/, "/index.html"));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": types[path.extname(f)] ?? "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const url = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

// 1-4, 6 on a 360px viewport
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
const net404 = [];
page.on("response", (r) => r.status() === 404 && net404.push(new URL(r.url()).pathname));
await page.goto(url, { waitUntil: "networkidle" });

check("1. hero image loads (no broken path)", await page.$eval("#hero", (i) => i.complete && i.naturalWidth > 0), `404s: ${net404.join(", ") || "none"}`);
check("2. .btn uses its own blue background (specificity)", (await page.$eval("#add", (b) => getComputedStyle(b).backgroundColor)) === "rgb(29, 78, 216)");
check("3. no horizontal scroll at 360px (card overflow)", await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
check("4. email input has a label", await page.$eval("#email", (i) => i.labels.length > 0));
check("0. sanity: projects load and render", (await page.$$("#list li")).length === 3, `items: ${(await page.$$("#list li")).length}`);

// Bug 6 shows from the 2nd click: the first click's render() attaches a second listener.
const before = (await page.$$("#list li")).length;
await page.click("#add");
await page.click("#add");
const after = (await page.$$("#list li")).length;
check("6. two clicks add exactly two items (handler attached once)", after - before === 2, `added ${after - before}`);

// 5b. failures must be visible: block the data file and expect an error state with Retry
const p2 = await browser.newPage({ viewport: { width: 360, height: 800 } });
await p2.route("**/data/**", (route) => route.abort());
await p2.goto(url, { waitUntil: "networkidle" });
const statusText = (await p2.$eval("#status", (s) => s.textContent)).trim();
check("5b. fetch failure shows an error state with Retry (not silent)", /could not load/i.test(statusText) && !!(await p2.$("#retry")), `status text: "${statusText}"`);

await browser.close(); server.close();
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`); }
console.log(`\n${which}: ${fails} failing check(s)`);
process.exit(which === "fixed" ? (fails ? 1 : 0) : (fails === 6 ? 0 : 1));   // broken must fail exactly the six bugs
