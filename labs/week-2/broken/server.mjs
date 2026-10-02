// Week 2 lab - a tiny booking auth API. It has FIVE security bugs. Find them without AI.
import http from "node:http";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const SECRET = "supersecret123";

const b64 = (x) => Buffer.from(x).toString("base64url");
function sign(payload) {
  const body = b64(JSON.stringify({ alg: "HS256", typ: "JWT" })) + "." + b64(JSON.stringify(payload));
  return body + "." + crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
}
function verify(token) {
  const [h, p, s] = String(token).split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(h + "." + p).digest("base64url");
  if (s !== expected) return null;
  return JSON.parse(Buffer.from(p, "base64url").toString());
}
export const signForTest = sign; // harness helper, not part of the lab bugs

export function start() {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password TEXT);
           CREATE TABLE bookings (id INTEGER PRIMARY KEY, user_id INTEGER, slot TEXT, status TEXT DEFAULT 'booked');`);

  const send = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  const readBody = (req) => new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => r(d ? JSON.parse(d) : {})); });

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://x");
      const body = req.method === "POST" ? await readBody(req) : {};
      const claims = verify((req.headers.authorization ?? "").replace("Bearer ", ""));

      if (req.method === "POST" && url.pathname === "/signup") {
        db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(body.email, body.password);
        return send(res, 201, { ok: true });
      }
      if (req.method === "POST" && url.pathname === "/login") {
        const user = db.prepare(`SELECT * FROM users WHERE email = '${body.email}' AND password = '${body.password}'`).get();
        if (!user) return send(res, 401, { error: "Invalid email or password" });
        return send(res, 200, { token: sign({ sub: user.id, iat: Math.floor(Date.now() / 1000) }) });
      }
      if (!claims) return send(res, 401, { error: "Please log in" });

      if (req.method === "POST" && url.pathname === "/bookings") {
        const r = db.prepare("INSERT INTO bookings (user_id, slot) VALUES (?, ?)").run(claims.sub, body.slot);
        return send(res, 201, { id: Number(r.lastInsertRowid) });
      }
      const m = url.pathname.match(/^\/bookings\/(\d+)\/cancel$/);
      if (req.method === "POST" && m) {
        db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(Number(m[1]));
        return send(res, 200, { ok: true });
      }
      send(res, 404, { error: "Not found" });
    } catch (e) {
      send(res, 500, { error: "Something went wrong" });
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, db, base: `http://localhost:${server.address().port}` })));
}
