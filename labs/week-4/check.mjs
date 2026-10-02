/* Config-audit lab for the five Week 4 deployment failures. No server needed: it reads the files you would have on the VPS.
   Usage: node labs/week-4/check.mjs [broken|fixed]    Expected: broken -> 5 FAIL (sanity passes), fixed -> 0 FAIL. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const which = process.argv[2] ?? "fixed";
const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, which);
const facts = JSON.parse(fs.readFileSync(path.join(here, "facts.json"), "utf8"));
const read = (f) => fs.readFileSync(path.join(dir, f), "utf8");
const results = [];
const check = (name, ok, detail = "", sanity = false) => results.push({ name, ok, detail, sanity });

const compose = parse(read("docker-compose.yml"), { merge: true });        // merge: true understands YAML anchors / << keys
const services = compose.services ?? {};
const parseEnv = (text) => Object.fromEntries(text.split("\n").filter((l) => /^[A-Z_][A-Z0-9_]*=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const required = Object.keys(parseEnv(read(".env.example")));
const env = parseEnv(read(".env.production"));
const caddy = read("Caddyfile");

// sanity: the stack still has its parts and the proxy still serves both hosts; only Caddy is public
check("0a. sanity: db, api, web and caddy services exist", ["db", "api", "web", "caddy"].every((s) => services[s]), "", true);
check("0b. sanity: Caddy serves both hosts and proxies to web:3000 and api:4000", facts.hosts.every((h) => caddy.includes(h + " {")) && /reverse_proxy web:3000/.test(caddy) && /reverse_proxy api:4000/.test(caddy), "", true);
const publicPorts = Object.entries(services).flatMap(([n, s]) => (s.ports ?? []).map((p) => [n, String(p)])).filter(([, p]) => !p.startsWith("127.0.0.1:"));
check("0c. sanity: only Caddy publishes ports on all interfaces (80/443)", publicPorts.every(([n]) => n === "caddy") && publicPorts.length === 2, `public: ${JSON.stringify(publicPorts)}`, true);

// 1. restart loop: a required environment variable is missing on the server
const missing = required.filter((k) => !(env[k] && env[k].length > 0));
check("1. every variable in .env.example is set in .env.production (no restart loop)", missing.length === 0, missing.length ? `missing/empty: ${missing.join(", ")}` : "");

// 2. data lost on every restart: no volume on the database
const db = services.db ?? {};
const mount = (db.volumes ?? []).find((v) => String(v).endsWith(":/var/lib/postgresql/data"));
const volName = mount ? String(mount).split(":")[0] : null;
const declared = volName && Object.prototype.hasOwnProperty.call(compose.volumes ?? {}, volName);
check("2. Postgres data directory is on a declared named volume", !!mount && !!declared, mount ? `mount ${mount}, declared: ${!!declared}` : "no volume mounted at /var/lib/postgresql/data");

// 3. HTTPS failing: DNS points at the wrong IP
const zone = Object.fromEntries(read("dns-zone.txt").split("\n").filter((l) => /^[a-z0-9*@-]+\s+\d+\s+A\s+/i.test(l)).map((l) => { const p = l.trim().split(/\s+/); return [p[0], p[3]]; }));
const wrong = facts.hosts.map((h) => h.split(".")[0]).filter((n) => zone[n] !== facts.serverIp);
check("3. app and api A records both point at the server IP", wrong.length === 0, wrong.length ? wrong.map((n) => `${n} -> ${zone[n] ?? "(no A record)"}, expected ${facts.serverIp}`).join("; ") : "");

// 4. CORS only in production: wrong allowed origin
check("4. WEB_ORIGIN equals the exact frontend origin (https, no trailing slash)", env.WEB_ORIGIN === facts.frontendOrigin, `WEB_ORIGIN=${env.WEB_ORIGIN}, expected ${facts.frontendOrigin}`);

// 5. full disk from unrotated logs
const unbounded = Object.entries(services).filter(([, s]) => !(s.logging?.options?.["max-size"] && s.logging?.options?.["max-file"])).map(([n]) => n);
check("5. every service has log rotation (max-size and max-file)", unbounded.length === 0, unbounded.length ? `no rotation: ${unbounded.join(", ")}` : "");

let fails = 0, sanityFails = 0;
for (const r of results) { if (!r.ok) (r.sanity ? sanityFails++ : fails++); console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`); }
console.log(`\n${which}: ${fails} failing bug check(s), ${sanityFails} failing sanity check(s)`);
process.exit(sanityFails ? 2 : which === "fixed" ? (fails ? 1 : 0) : (fails === 5 ? 0 : 1));
