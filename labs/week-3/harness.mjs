// Builds a variant (broken|fixed) with esbuild and serves it: server-side rendered HTML + client bundle + a tiny cookie-auth API.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const SEED = () => [
  { id: 1, service: "Haircut", startsAt: "2030-01-07T04:30:00.000Z", status: "booked" },   // 10:00 in Asia/Kolkata
  { id: 2, service: "Beard trim", startsAt: "2030-01-07T06:30:00.000Z", status: "booked" },
  { id: 3, service: "Facial", startsAt: "2030-01-07T08:30:00.000Z", status: "booked" },
];

export async function serve(variant) {
  const out = path.join(here, `.build-${variant}`);               // inside the repo so Node can resolve react from node_modules
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const app = path.join(here, variant, "App.jsx").replace(/\\/g, "/");
  const common = { bundle: true, jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' }, logLevel: "silent" };   // PRODUCTION build: Strict Mode's double effects are not in play
  fs.writeFileSync(path.join(out, "client-entry.jsx"), `import { hydrateRoot } from "react-dom/client"; import { App } from "${app}";
    hydrateRoot(document.getElementById("root"), <App {...window.__DATA__} />);`);
  fs.writeFileSync(path.join(out, "ssr-entry.jsx"), `import { renderToString } from "react-dom/server"; import { App } from "${app}";
    export const render = (props) => renderToString(<App {...props} />);`);
  const nodePaths = [path.join(here, "..", "..", "node_modules")];
  await build({ ...common, entryPoints: [path.join(out, "client-entry.jsx")], outfile: path.join(out, "client.js"), platform: "browser", format: "iife", nodePaths });
  await build({ ...common, entryPoints: [path.join(out, "ssr-entry.jsx")], outfile: path.join(out, "ssr.mjs"), platform: "node", format: "esm", nodePaths, packages: "external" });
  const { render } = await import(pathToFileURL(path.join(out, "ssr.mjs")).href);

  let bookings = SEED();
  const stats = { bookingGets: 0, bookingPosts: 0, logins: 0 };
  const json = (res, code, body, headers = {}) => { res.writeHead(code, { "content-type": "application/json", ...headers }); res.end(JSON.stringify(body)); };
  const readBody = (req) => new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => r(d ? JSON.parse(d) : {})); });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/") {
      const data = { initialBookings: bookings.filter((b) => b.status === "booked") };    // no personalised data in the shell
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Bookings</title></head><body><div id="root">${render(data)}</div>
        <script>window.__DATA__=${JSON.stringify(data)}</script><script src="/client.js"></script></body></html>`;
      res.writeHead(200, { "content-type": "text/html" }); return res.end(html);
    }
    if (url.pathname === "/client.js") { res.writeHead(200, { "content-type": "text/javascript" }); return res.end(fs.readFileSync(path.join(out, "client.js"))); }
    if (url.pathname === "/__reset") { bookings = SEED(); Object.assign(stats, { bookingGets: 0, bookingPosts: 0, logins: 0 }); return json(res, 200, { ok: true }); }
    if (url.pathname === "/__stats") return json(res, 200, stats);
    if (url.pathname === "/api/bookings" && req.method === "GET") { stats.bookingGets++; return json(res, 200, bookings.filter((b) => b.status === (url.searchParams.get("status") ?? "booked"))); }
    if (url.pathname === "/api/bookings" && req.method === "POST") { stats.bookingPosts++; await readBody(req); return json(res, 201, { ok: true }); }
    const m = url.pathname.match(/^\/api\/bookings\/(\d+)$/);
    if (m && req.method === "PATCH") { const b = bookings.find((x) => x.id === Number(m[1])); const body = await readBody(req); if (b) b.status = body.status; return json(res, 200, { ok: true }); }
    if (url.pathname === "/api/login" && req.method === "POST") { stats.logins++; await readBody(req); return json(res, 200, { email: "asha@example.com" }, { "set-cookie": "session=abc; Path=/; HttpOnly; SameSite=Lax" }); }
    if (url.pathname === "/api/me") return /session=abc/.test(req.headers.cookie ?? "") ? json(res, 200, { email: "asha@example.com" }) : json(res, 401, { error: "Please log in" });
    res.writeHead(404); res.end("not found");
  });
  await new Promise((r) => server.listen(0, r));
  return { base: `http://localhost:${server.address().port}`, close: () => { server.closeAllConnections?.(); server.close(); fs.rmSync(out, { recursive: true, force: true }); } };
}
