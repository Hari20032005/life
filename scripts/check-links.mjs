/* Checks every URL in the per-week resources.json files under content/weeks. Needs normal internet access (run it locally or in CI).
   Exit 1 only for links that are genuinely broken: 404/410, DNS failure, TLS errors. 401/403/429/999 are bot-blocking, reported as warnings. */
import fs from "node:fs";
const rows = [];
for (let w = 0; w <= 6; w++) {
  const f = `content/weeks/week-${w}/resources.json`;
  if (fs.existsSync(f)) for (const r of JSON.parse(fs.readFileSync(f, "utf8"))) rows.push({ w, ...r });
}
async function probe(r) {
  let last;
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(r.url, { method, redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "Mozilla/5.0 (compatible; link-check)" } });
      last = { status: res.status, final: res.url };
      if (res.status < 400) return last;
    } catch (e) { last = { status: 0, error: String(e.cause?.code ?? e.name) }; }
  }
  return last;
}
const out = [], queue = [...rows];
await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) { const r = queue.shift(); out.push({ ...r, ...(await probe(r)) }); } }));
const warnStatus = new Set([401, 403, 429, 999]);
let broken = 0, warn = 0, ok = 0;
for (const r of out.sort((a, b) => a.w - b.w)) {
  const tag = r.status >= 200 && r.status < 400 ? "OK  " : warnStatus.has(r.status) ? "WARN" : "FAIL";
  if (tag === "OK  ") ok++; else if (tag === "WARN") warn++; else broken++;
  if (tag !== "OK  ") console.log(`${tag} ${r.status || r.error}  W${r.w}  ${r.url}`);
}
console.log(`\nlinks: ${ok} ok, ${warn} blocked-or-rate-limited (verify by hand), ${broken} broken, of ${out.length}`);
process.exit(broken ? 1 : 0);
