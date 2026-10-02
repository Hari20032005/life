// Week 1 lab - reference solution (pair with migrations/002_fix_schema.sql).
import http from "node:http";
import pg from "pg";

export async function start({ databaseUrl }) {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });

  const send = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  const readBody = (req) => new Promise((resolve, reject) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { reject(Object.assign(e, { badJson: true })); } }); });

  async function getBooking(id) {
    const r = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
    return r.rows[0];
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://x");

      if (req.method === "GET" && url.pathname === "/services") {
        const order = url.searchParams.get("sort") === "price" ? "price" : "name";     // allow-list, never user text
        const r = await pool.query(`SELECT id, name, price FROM services ORDER BY ${order}`);
        return send(res, 200, r.rows);
      }
      if (req.method === "GET" && url.pathname === "/customers/search") {
        const q = url.searchParams.get("q") ?? "";
        const r = await pool.query("SELECT id, name FROM customers WHERE name ILIKE $1 ORDER BY id", [`%${q}%`]);   // parameterised
        return send(res, 200, r.rows);
      }
      if (req.method === "GET" && url.pathname === "/bookings") {
        const r = await pool.query("SELECT id, customer_id, service_id, status FROM bookings ORDER BY id");        // pool.query releases for us
        return send(res, 200, r.rows);
      }
      const m = url.pathname.match(/^\/bookings\/(\d+)$/);
      if (req.method === "GET" && m) {
        const booking = await getBooking(Number(m[1]));                                                            // await the promise
        if (!booking) return send(res, 404, { error: "Not found" });
        return send(res, 200, booking);
      }
      if (req.method === "POST" && url.pathname === "/bookings") {
        const b = await readBody(req);
        try {
          const r = await pool.query(
            "INSERT INTO bookings (customer_id, service_id, staff_id, slot) VALUES ($1, $2, $3, $4) RETURNING id",
            [b.customerId, b.serviceId, b.staffId ?? 1, b.slot]);
          return send(res, 201, { id: r.rows[0].id });
        } catch (e) {
          if (e.code === "23503") return send(res, 400, { error: "Unknown customer, service or staff" });          // FK violation
          if (e.code === "22P02" || e.code === "22007" || e.code === "23502") return send(res, 400, { error: "Invalid input" });
          throw e;
        }
      }
      if (req.method === "GET" && url.pathname === "/reports/revenue") {
        const r = await pool.query(`
          SELECT s.name AS service, SUM(s.price)::int AS revenue
          FROM bookings b
          JOIN services s ON s.id = b.service_id
          WHERE b.status <> 'cancelled'
          GROUP BY s.id, s.name
          ORDER BY s.name`);                                                                                       // one row per service
        return send(res, 200, r.rows);
      }
      send(res, 404, { error: "Not found" });
    } catch (e) {
      if (e.badJson) return send(res, 400, { error: "Invalid JSON" });
      console.error(e);
      send(res, 500, { error: "Something went wrong" });
    }
  });
  await new Promise((resolve) => server.listen(0, resolve));
  return { server, pool, base: `http://localhost:${server.address().port}` };
}
