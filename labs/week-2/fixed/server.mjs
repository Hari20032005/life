// Week 2 lab - reference solution. Compare with ../broken/server.mjs.
import http from "node:http";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("JWT_SECRET is required");           // secrets come from the environment, never from source

const b64 = (x) => Buffer.from(x).toString("base64url");
const hmac = (data) => crypto.createHmac("sha256", SECRET).update(data).digest();
function sign(payload) {
  const body = b64(JSON.stringify({ alg: "HS256", typ: "JWT" })) + "." + b64(JSON.stringify(payload));
  return body + "." + hmac(body).toString("base64url");
}
function verify(token) {
  const [h, p, s] = String(token).split(".");
  if (!h || !p || !s) return null;
  const given = Buffer.from(s, "base64url"), expected = hmac(h + "." + p);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;   // constant-time compare
  const claims = JSON.parse(Buffer.from(p, "base64url").toString());
  if (typeof claims.exp !== "number" || claims.exp < Math.floor(Date.now() / 1000)) return null;   // expired or missing exp
  return claims;
}
export const signForTest = sign; // harness helper

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return salt.toString("hex") + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
}
function checkPassword(pw, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const given = crypto.scryptSync(pw, Buffer.from(salt, "hex"), 64), want = Buffer.from(hash, "hex");
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}
const DUMMY = hashPassword("dummy-password");                      // keeps timing similar for unknown emails

export function start() {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, password_hash TEXT NOT NULL);
           CREATE UNIQUE INDEX users_email ON users (lower(email));
           CREATE TABLE bookings (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), slot TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'booked');`);

  const send = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  const readBody = (req) => new Promise((r, j) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { r(d ? JSON.parse(d) : {}); } catch (e) { j(e); } }); });

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://x");
      const body = req.method === "POST" ? await readBody(req) : {};
      const claims = verify((req.headers.authorization ?? "").replace("Bearer ", ""));

      if (req.method === "POST" && url.pathname === "/signup") {
        if (typeof body.email !== "string" || typeof body.password !== "string" || body.password.length < 8) return send(res, 400, { error: "Invalid input" });
        try { db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(body.email, hashPassword(body.password)); }
        catch { return send(res, 409, { error: "Email already registered" }); }
        return send(res, 201, { ok: true });
      }
      if (req.method === "POST" && url.pathname === "/login") {
        const user = db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(String(body.email));   // parameterised
        const ok = checkPassword(String(body.password), user ? user.password_hash : DUMMY);
        if (!user || !ok) return send(res, 401, { error: "Invalid email or password" });                       // same message for both
        const now = Math.floor(Date.now() / 1000);
        return send(res, 200, { token: sign({ sub: user.id, iat: now, exp: now + 3600 }) });
      }
      if (!claims) return send(res, 401, { error: "Please log in" });

      if (req.method === "POST" && url.pathname === "/bookings") {
        const r = db.prepare("INSERT INTO bookings (user_id, slot) VALUES (?, ?)").run(claims.sub, String(body.slot));
        return send(res, 201, { id: Number(r.lastInsertRowid) });
      }
      const m = url.pathname.match(/^\/bookings\/(\d+)\/cancel$/);
      if (req.method === "POST" && m) {
        const r = db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ?").run(Number(m[1]), claims.sub);   // ownership in the query
        return r.changes ? send(res, 200, { ok: true }) : send(res, 404, { error: "Booking not found" });                                // don't reveal existence
      }
      send(res, 404, { error: "Not found" });
    } catch {
      send(res, 500, { error: "Something went wrong" });
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, db, base: `http://localhost:${server.address().port}` })));
}
