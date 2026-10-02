// Week 1 lab - a small booking API with SEVEN bugs. Find them without AI.
import http from "node:http";
import pg from "pg";

export async function start({ databaseUrl }) {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });

  const send = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  const readBody = (req) => new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => r(d ? JSON.parse(d) : {})); });

  async function getBooking(id) {
    const r = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
    return r.rows[0];
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://x");

      if (req.method === "GET" && url.pathname === "/services") {
        const order = url.searchParams.get("sort") === "price" ? "price" : "name";
        const r = await pool.query(`SELECT id, name, price FROM services ORDER BY ${order}`);
        return send(res, 200, r.rows);
      }
      if (req.method === "GET" && url.pathname === "/customers/search") {
        const q = url.searchParams.get("q") ?? "";
        const r = await pool.query(`SELECT id, name FROM customers WHERE name ILIKE '%${q}%' ORDER BY id`);
        return send(res, 200, r.rows);
      }
      if (req.method === "GET" && url.pathname === "/bookings") {
        const client = await pool.connect();
        const r = await client.query("SELECT id, customer_id, service_id, status FROM bookings ORDER BY id");
        return send(res, 200, r.rows);
      }
      const m = url.pathname.match(/^\/bookings\/(\d+)$/);
      if (req.method === "GET" && m) {
        const booking = getBooking(Number(m[1]));
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
          return send(res, 200, { error: e.message });
        }
      }
      if (req.method === "GET" && url.pathname === "/reports/revenue") {
        const r = await pool.query(`
          SELECT s.name AS service, SUM(s.price::int) AS revenue
          FROM bookings b
          JOIN services s ON s.id = b.service_id
          JOIN customers c ON c.id = b.customer_id
          JOIN staff_hours h ON h.staff_id = b.staff_id
          WHERE b.status <> 'cancelled'
          GROUP BY s.name, h.weekday
          ORDER BY s.name`);
        return send(res, 200, r.rows);
      }
      send(res, 404, { error: "Not found" });
    } catch (e) {
      send(res, 500, { error: "Something went wrong" });
    }
  });
  await new Promise((resolve) => server.listen(0, resolve));
  return { server, pool, base: `http://localhost:${server.address().port}` };
}
