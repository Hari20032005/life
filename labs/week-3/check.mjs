/* Detects the five Week 3 lab bugs in a real browser. Usage: node labs/week-3/check.mjs [broken|fixed]
   The server renders in UTC (hydration bug), the browser runs as Asia/Kolkata, and the bundle is a PRODUCTION build. */
process.env.TZ = "UTC";
import { chromium } from "playwright-core";
import { serve } from "./harness.mjs";

const which = process.argv[2] ?? "fixed";
const { base, close } = await serve(which);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const results = [];
const check = (name, ok, detail = "", sanity = false) => results.push({ name, ok, detail, sanity });

async function freshPage() {
  await fetch(base + "/__reset");
  const ctx = await browser.newContext({ timezoneId: "Asia/Kolkata", locale: "en-US" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return { page, ctx, errors };
}
const stats = async () => (await fetch(base + "/__stats")).json();

// --- sanity: list renders, cancel works, valid booking posts, login shows the user
{
  const { page, ctx } = await freshPage();
  await page.goto(base + "/", { waitUntil: "load" }); await page.waitForSelector("li[data-booking]"); await page.waitForTimeout(400);
  const rows = await page.$$("li[data-booking]");
  await page.getByRole("button", { name: "Cancel booking 2" }).click();
  const after = await page.$$("li[data-booking]");
  await page.getByLabel("Your name").fill("Asha");
  await page.getByRole("button", { name: "Request booking" }).click();
  await page.getByText("Booking requested").waitFor();
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByText("Signed in as asha@example.com").waitFor();
  const s = await stats();
  check("0. sanity: 3 rows, cancel removes one, a valid request posts once, login shows the user", rows.length === 3 && after.length === 2 && s.bookingPosts === 1, `rows ${rows.length}->${after.length}, posts ${s.bookingPosts}`, true);
  await ctx.close();
}

// 1. effect with an unstable dependency refetches forever
{
  const { page, ctx } = await freshPage();
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const s = await stats();
  check("1. the bookings list is fetched a small, fixed number of times (no refetch loop)", s.bookingGets <= 3, `GET /api/bookings x${s.bookingGets} in 1.5s`);
  await ctx.close();
}

// 2. index keys: a row's local state follows the wrong booking after a removal
{
  const { page, ctx } = await freshPage();
  await page.goto(base + "/", { waitUntil: "load" }); await page.waitForSelector("li[data-booking]"); await page.waitForTimeout(400);
  await page.getByLabel("Note for booking 3").fill("VIP");
  await page.getByRole("button", { name: "Cancel booking 1" }).click();
  await page.waitForTimeout(300);
  const owner = await page.$$eval("li[data-booking]", (lis) => lis.find((li) => li.querySelector("input").value === "VIP")?.dataset.booking ?? "none");
  check("2. after cancelling booking 1, the 'VIP' note is still on booking 3 (stable keys)", owner === "3", `'VIP' now sits on booking: ${owner}`);
  await ctx.close();
}

// 3. auth state lost on refresh
{
  const { page, ctx } = await freshPage();
  await page.goto(base + "/", { waitUntil: "load" }); await page.waitForSelector("li[data-booking]"); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByText("Signed in as asha@example.com").waitFor();
  await page.reload({ waitUntil: "load" }); await page.waitForSelector("li[data-booking]"); await page.waitForTimeout(400);
  await page.waitForTimeout(300);
  const still = await page.getByText("Signed in as asha@example.com").count();
  check("3. the user is still signed in after a page refresh (session restored)", still === 1, still ? "" : "header shows the logged-out state");
  await ctx.close();
}

// 4. form submits without validation
{
  const { page, ctx } = await freshPage();
  await page.goto(base + "/", { waitUntil: "load" }); await page.waitForSelector("li[data-booking]"); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Request booking" }).click();
  await page.waitForTimeout(300);
  const s = await stats();
  const alert = await page.getByRole("alert").count();
  check("4. an empty name is not sent and an error message is shown", s.bookingPosts === 0 && alert === 1, `POSTs: ${s.bookingPosts}, alert shown: ${alert}`);
  await ctx.close();
}

// 5. hydration mismatch from a date rendered in the server's time zone
{
  const { page, ctx, errors } = await freshPage();
  const html = await (await fetch(base + "/")).text();
  await page.goto(base + "/", { waitUntil: "load" }); await page.waitForSelector("li[data-booking]"); await page.waitForTimeout(400);
  await page.waitForTimeout(300);
  const hydrationErr = errors.filter((e) => /hydrat|Minified React error #(418|419|422|423|425)/i.test(e));
  const ssrHas1000 = /10:00/.test(html.split("<time")[1] ?? "");
  const shown = await page.$eval("li[data-booking='1'] time", (t) => t.textContent);
  check("5. server HTML and browser agree on the time (10:00 business time), no hydration error", ssrHas1000 && /10:00/.test(shown) && hydrationErr.length === 0,
    `server time text: "${(html.match(/<time[^>]*>([^<]*)</) ?? [])[1]}", browser shows "${shown}", hydration errors: ${hydrationErr.length}`);
  await ctx.close();
}

await browser.close(); close();
let fails = 0, sanityFails = 0;
for (const r of results) { if (!r.ok) (r.sanity ? sanityFails++ : fails++); console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`); }
console.log(`\n${which}: ${fails} failing bug check(s), ${sanityFails} failing sanity check(s)`);
process.exit(sanityFails ? 2 : which === "fixed" ? (fails ? 1 : 0) : (fails === 5 ? 0 : 1));
