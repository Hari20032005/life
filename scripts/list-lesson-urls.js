// Writes /tmp/urls.json: every lesson URL (+ /roadmap) for scripts/check-diagrams.mjs
const fs = require("fs"), path = require("path");
const urls = ["/roadmap"];
for (let n = 0; n <= 6; n++) {
  const d = `content/weeks/week-${n}/lessons`;
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    const m = fs.readFileSync(path.join(d, f), "utf8").match(/^day:\s*(\d+)/m);
    urls.push(`/weeks/${n}/day-${m[1]}/${f.replace(".mdx", "")}`);
  }
}
fs.writeFileSync("/tmp/urls.json", JSON.stringify(urls));
