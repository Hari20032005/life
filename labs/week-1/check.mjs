/* Detects the seven Week 1 lab bugs against a real Postgres.
   Usage: LAB_PG_URL=postgres://postgres:postgres@localhost:54329 node labs/week-1/check.mjs [broken|fixed]
   Flow: apply migrations/001 -> load legacy-seed.sql ("production data") -> apply your later migrations -> start the API -> probe it. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const which = process.argv[2] ?? "fixed";
const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, which);
const adminBase = (process.env.LAB_PG_URL ?? "postgres://postgres:postgres@localhost:54329").replace(/\/$/, "");
const dbName = `lab_w1_${which}_${process.pid}`;

const admin = new pg.Client({ connectionString: adminBase + "/postgres" });
await admin.connect();
await admin.query(`CREATE DATABASE ${dbName}`);
const databaseUrl = `${adminBase}/${dbName}`;

const setup = new pg.Client({ connectionString: databaseUrl });
await setup.connect();
const migrations = fs.readdirSync(path.join(dir, "migrations")).filter((f) => f.endsWith(".sql")).sort();
await setup.query(fs.readFileSync(path.join(dir, "migrations", migrations[0]), "utf8"));
await setup.query(fs.readFileSync(path.join(here, "legacy-seed.sql"), "utf8"));
let migrationError = null;
for (const f of migrations.slice(1)) {
  try { await setup.query(fs.readFileSync(path.join(dir, "migrations", f), "utf8")); } catch (e) { migrationError = `${f}: ${e.message}`; break; }
}

const { start } = await import(path.join(dir, "server.mjs"));
const { server, pool, base } = await start({ databaseUrl });

const call = async (method, p, body, timeoutMs = 2000) => {
  try {
    const r = await fetch(base + p, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs) });
    return { status: r.status, body: await r.json().catch(() => null) };
  } catch (e) { return { status: 0, body: null, error: e.name }; }
};
const results = [];
const check = (name, ok, detail = "", sanity = false) => results.push({ name, ok, detail, sanity });

check("0. sanity: migrations apply cleanly", !migrationError, migrationError ?? "", true);
const s = await call("GET", "/services?sort=name");
check("0a. sanity: GET /services works", s.status === 200 && s.body?.length === 3, `status ${s.status}`, true);
const ann = await call("GET", "/customers/search?q=ann");
check("0b. sanity: search 'ann' finds Ann only", ann.status === 200 && ann.body?.length === 1 && ann.body[0].name === "Ann", "", true);

// 1. SQL injection
const inj = await call("GET", "/customers/search?q=" + encodeURIComponent("' OR '1'='1"));
check("1. SQL injection in customer search returns nothing extra", inj.status === 200 && Array.isArray(inj.body) && inj.body.length === 0, `rows returned: ${Array.isArray(inj.body) ? inj.body.length : inj.status}`);

// 2. missing await
const one = await call("GET", "/bookings/1");
check("2. GET /bookings/1 returns the booking object (await)", one.status === 200 && one.body?.id === 1, `body: ${JSON.stringify(one.body)}`);

// 3. errors with status 200
const bad = await call("POST", "/bookings", { customerId: 1, serviceId: 9999, slot: "2030-02-01T11:00:00+05:30" });
check("3. a failing insert returns a 4xx status (not 200)", bad.status >= 400 && bad.status < 500, `status ${bad.status}`);

// 4. missing foreign key / orphans
const fk = await setup.query(`SELECT 1 FROM pg_constraint WHERE conrelid = 'bookings'::regclass AND contype = 'f' AND confrelid = 'customers'::regclass`);
const orphans = await setup.query(`SELECT count(*)::int AS n FROM bookings b WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = b.customer_id)`);
let orphanInsert = "accepted";
await setup.query("BEGIN");
try { await setup.query(`INSERT INTO bookings (customer_id, service_id, staff_id, slot) VALUES (424242, 1, 1, now())`); } catch (e) { orphanInsert = e.code === "23503" ? "rejected (FK)" : "error " + e.code; }
await setup.query("ROLLBACK");                                   // never leave probe rows behind
check("4. bookings.customer_id has a foreign key, no orphans remain, orphan insert rejected", fk.rowCount === 1 && orphans.rows[0].n === 0 && orphanInsert.startsWith("rejected"), `fk: ${fk.rowCount}, orphans: ${orphans.rows[0].n}, orphan insert: ${orphanInsert}`);

// 6. price stored as text
const type = await setup.query(`SELECT data_type FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'price'`);
const sorted = await call("GET", "/services?sort=price");
const prices = Array.isArray(sorted.body) ? sorted.body.map((x) => Number(x.price)) : [];
check("6. services.price is numeric and sorts numerically (9, 20, 100)", ["integer", "numeric", "bigint"].includes(type.rows[0]?.data_type) && JSON.stringify(prices) === "[9,20,100]", `type: ${type.rows[0]?.data_type}, order: ${JSON.stringify(prices)}`);

// 7. GROUP BY report with duplicate rows
const rev = await call("GET", "/reports/revenue");
const names = Array.isArray(rev.body) ? rev.body.map((r) => r.service) : [];
const byName = Object.fromEntries((rev.body ?? []).map((r) => [r.service, Number(r.revenue)]));
check("7. revenue report has one row per service with correct totals (Haircut 200, Trim 20)", rev.status === 200 && new Set(names).size === names.length && byName.Haircut === 200 && byName.Trim === 20, `rows: ${JSON.stringify(rev.body)?.slice(0, 120)}`);

// Data-changing and pool-exhausting probes run last so they cannot disturb the checks above.
const okBooking = await call("POST", "/bookings", { customerId: 1, serviceId: 1, slot: "2030-02-01T10:00:00+05:30" });
check("0c. sanity: a valid booking can be created (2xx)", okBooking.status >= 200 && okBooking.status < 300 && !!okBooking.body?.id, `status ${okBooking.status}`, true);

// 5. pool client never released
let hung = 0;
for (let i = 0; i < 25; i++) { const r = await call("GET", "/bookings", null, 1500); if (r.status !== 200) hung++; }
check("5. 25 sequential GET /bookings all succeed (pool clients released)", hung === 0, `failed/hung: ${hung}`);


let fails = 0, sanityFails = 0;
for (const r of results) { if (!r.ok) (r.sanity ? sanityFails++ : fails++); console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`); }
console.log(`\n${which}: ${fails} failing bug check(s), ${sanityFails} failing sanity check(s)`);

// Cleanup. A leaked (never released) pool client is killed by DROP ... FORCE and emits an unhandled error: expected for the broken server.
process.on("uncaughtException", (e) => { if (e?.code !== "57P01" && !/terminated/i.test(e?.message ?? "")) throw e; });
server.closeAllConnections?.(); server.close();
pool.end().catch(() => {});
await setup.end().catch(() => {});
await admin.query(`DROP DATABASE ${dbName} WITH (FORCE)`);
await admin.end();
process.exit(sanityFails ? 2 : which === "fixed" ? (fails ? 1 : 0) : (fails === 7 ? 0 : 1));
