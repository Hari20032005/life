/* Static lint for .github/workflows/*.yml (GitHub Actions itself can't run here).
   Verifies: YAML parses; every step has run or uses; every `npm run X` is defined in package.json; every referenced local file exists. */
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const problems = [];
const dir = ".github/workflows";
for (const f of fs.readdirSync(dir).filter((x) => /\.ya?ml$/.test(x))) {
  let wf;
  try { wf = parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { problems.push(`${f}: YAML does not parse: ${e.message}`); continue; }
  for (const [jobName, job] of Object.entries(wf.jobs ?? {})) {
    if (!job["runs-on"] && !job.uses) problems.push(`${f}/${jobName}: no runs-on`);
    for (const [i, step] of (job.steps ?? []).entries()) {
      const where = `${f}/${jobName}/step ${i + 1}${step.name ? ` (${step.name})` : ""}`;
      if (!step.run && !step.uses) problems.push(`${where}: step has neither run nor uses`);
      if (step.uses && !/@[\w.\-]+$/.test(step.uses) && !step.uses.startsWith("./")) problems.push(`${where}: action "${step.uses}" is not pinned to a version`);
      for (const cmd of String(step.run ?? "").split("\n")) {
        for (const m of cmd.matchAll(/npm run ([\w:-]+)/g)) if (!pkg.scripts?.[m[1]]) problems.push(`${where}: "npm run ${m[1]}" is not defined in package.json`);
        for (const m of cmd.matchAll(/\bnode ((?:scripts|labs)\/[\w./-]+)/g)) if (!fs.existsSync(m[1])) problems.push(`${where}: file ${m[1]} does not exist`);
        for (const m of cmd.matchAll(/cd ([\w./-]+)/g)) if (!fs.existsSync(m[1])) problems.push(`${where}: directory ${m[1]} does not exist`);
      }
    }
  }
}
if (problems.length) { console.error(problems.map((p) => "✗ " + p).join("\n")); process.exit(1); }
console.log("✓ workflows OK (static checks only: not executed on GitHub)");
