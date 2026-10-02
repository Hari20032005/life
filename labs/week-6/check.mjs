/* Week 6 AI patch review lab. Usage: node labs/week-6/check.mjs [start|ai-patched|fixed]
   - "own"        = the tests shipped in that folder (what the agent saw / edited)
   - "regression" = the hidden permission-matrix suite (the truth) */
import path from "node:path";
import { fileURLToPath } from "node:url";

const which = process.argv[2] ?? "fixed";
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), which);
const svc = await import(path.join(dir, "service.mjs"));
const own = (await import(path.join(dir, "tests.mjs"))).default;
const { cancelBooking, addBooking, reset, statusOf, NotFoundError, ForbiddenError } = svc;

const owner = { id: 1, role: "owner" }, alice = { id: 2, role: "customer" }, bob = { id: 3, role: "customer" }, staff = { id: 4, role: "staff" };
const outcome = (fn) => { try { fn(); return "ok"; } catch (e) { return e instanceof NotFoundError ? "404" : e instanceof ForbiddenError ? "403" : "error"; } };
const cases = [
  ["REG owner cancels any booking", () => { reset(); addBooking(1, alice.id); return outcome(() => cancelBooking(owner, 1)) === "ok" && statusOf(1) === "cancelled"; }],
  ["REG customer cancels their OWN booking (as a customer)", () => { reset(); addBooking(2, alice.id); return outcome(() => cancelBooking(alice, 2)) === "ok" && statusOf(2) === "cancelled"; }],
  ["REG customer cannot cancel another customer's booking (no leak, booking untouched)", () => { reset(); addBooking(3, alice.id); const o = outcome(() => cancelBooking(bob, 3)); return (o === "404" || o === "403") && statusOf(3) === "booked"; }],
  ["REG staff cannot cancel any booking", () => { reset(); addBooking(4, alice.id); const o = outcome(() => cancelBooking(staff, 4)); return (o === "403" || o === "404") && statusOf(4) === "booked"; }],
  ["REG staff cannot learn that a booking exists (same 404 as missing)", () => { reset(); addBooking(5, alice.id); return outcome(() => cancelBooking(staff, 5)) === outcome(() => cancelBooking(staff, 999)) || outcome(() => cancelBooking(staff, 5)) === "403"; }],
];

let ownFails = 0, regFails = 0;
console.log(`-- ${which}: the folder's own tests`);
for (const [name, fn] of own) { let ok = false; try { ok = fn(); } catch {} if (!ok) ownFails++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); }
console.log(`-- ${which}: hidden regression suite`);
for (const [name, fn] of cases) { let ok = false; try { ok = fn(); } catch {} if (!ok) regFails++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); }
console.log(`\n${which}: own tests failing ${ownFails}, regression failing ${regFails}`);
// Expected: start = the original bug (1 own + 1 regression failure); ai-patched = own tests green but regression red;
//           fixed = everything green.
const okExit = which === "start" ? ownFails === 1 && regFails === 1
  : which === "ai-patched" ? ownFails === 0 && regFails >= 2
  : ownFails === 0 && regFails === 0;
process.exit(okExit ? 0 : 1);
