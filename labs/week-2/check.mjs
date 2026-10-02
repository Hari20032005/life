/* Detects the five Week 2 lab bugs. Usage: node labs/week-2/check.mjs [broken|fixed]
   Expected: broken -> 5 FAIL (sanity checks pass), fixed -> 0 FAIL. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.JWT_SECRET = "lab-checker-secret";                      // used by the fixed server; the broken one ignores it
const which = process.argv[2] ?? "fixed";
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), which);
const { start, signForTest } = await import(path.join(dir, "server.mjs"));
const { server, db, base } = await start();

const call = async (method, p, body, token) => {
  const r = await fetch(base + p, { method, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const results = [];
const check = (name, ok, detail = "", sanity = false) => results.push({ name, ok, detail, sanity });

// users + sanity
await call("POST", "/signup", { email: "alice@example.com", password: "CorrectHorse9!" });
await call("POST", "/signup", { email: "bob@example.com", password: "Tr0ub4dor&3xyz" });
const a = (await call("POST", "/login", { email: "alice@example.com", password: "CorrectHorse9!" })).body?.token;
const b = (await call("POST", "/login", { email: "bob@example.com", password: "Tr0ub4dor&3xyz" })).body?.token;
check("0a. sanity: valid login returns a token", !!a && !!b, "", true);
const wrong = await call("POST", "/login", { email: "alice@example.com", password: "nope-nope-nope" });
check("0b. sanity: wrong password is rejected (401)", wrong.status === 401, `status ${wrong.status}`, true);
const bk = await call("POST", "/bookings", { slot: "2030-01-07T10:00:00+05:30" }, a);
check("0c. sanity: owner can cancel their own booking", (await call("POST", `/bookings/${bk.body?.id}/cancel`, null, a)).status === 200, "", true);

// 1. passwords stored in plain text
const rows = db.prepare("SELECT * FROM users").all();
const stored = rows.map((r) => Object.values(r).join("|")).join("\n");
check("1. passwords are not stored in plain text", !stored.includes("CorrectHorse9!") && !stored.includes("Tr0ub4dor&3xyz"));

// 2. tokens never expire
const claims = JSON.parse(Buffer.from(a.split(".")[1], "base64url").toString());
const expired = signForTest({ sub: 1, iat: 1, exp: Math.floor(Date.now() / 1000) - 10 });
const expiredRes = await call("POST", "/bookings", { slot: "x" }, expired);
const noExp = signForTest({ sub: 1, iat: 1 });
const noExpRes = await call("POST", "/bookings", { slot: "x" }, noExp);
check("2. tokens carry an exp claim and expired/exp-less tokens are rejected", typeof claims.exp === "number" && expiredRes.status === 401 && noExpRes.status === 401, `exp claim: ${claims.exp}, expired: ${expiredRes.status}, exp-less: ${noExpRes.status}`);

// 3. SQL injection in login. Two probes: (a) the classic tautology, (b) a comment injection with a CORRECT password,
//    which only logs in if the email is spliced into the SQL text (this still catches a query that is concatenated but whose password is checked elsewhere).
const injA = await call("POST", "/login", { email: "x' OR '1'='1' --", password: "anything" });
const injB = await call("POST", "/login", { email: "alice@example.com' --", password: "CorrectHorse9!" });
check("3. SQL injection in login does not log in (tautology and comment-injection probes)", injA.status !== 200 && injB.status !== 200, `tautology: ${injA.status}, comment injection: ${injB.status}`);

// 4. any logged-in user can cancel anyone's booking
const aBooking = await call("POST", "/bookings", { slot: "2030-01-08T10:00:00+05:30" }, a);
const evil = await call("POST", `/bookings/${aBooking.body.id}/cancel`, null, b);
const state = db.prepare("SELECT status FROM bookings WHERE id = ?").get(aBooking.body.id).status;
check("4. another user cannot cancel my booking", [403, 404].includes(evil.status) && state === "booked", `status ${evil.status}, booking is ${state}`);

// 5. secret hard-coded in source (what ends up in git history)
const src = fs.readFileSync(path.join(dir, "server.mjs"), "utf8");
check("5. no secret literal in source (read it from the environment)", !/SECRET\s*=\s*["'`][^"'`]+["'`]/.test(src));

server.close();
let fails = 0, sanityFails = 0;
for (const r of results) { if (!r.ok) (r.sanity ? sanityFails++ : fails++); console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`); }
console.log(`\n${which}: ${fails} failing bug check(s), ${sanityFails} failing sanity check(s)`);
process.exit(sanityFails ? 2 : which === "fixed" ? (fails ? 1 : 0) : (fails === 5 ? 0 : 1));
