/* Detects the five Week 5 lab bugs. Usage: node labs/week-5/check.mjs [broken|fixed]
   The "model" is a worst-case stub (../corpus.mjs) that obeys instructions found in documents. No API key, no network. */
process.env.TZ = "UTC";                      // makes the time-zone bug deterministic
import path from "node:path";
import { fileURLToPath } from "node:url";
import { obedientModel } from "./corpus.mjs";

const which = process.argv[2] ?? "fixed";
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), which);
const { createReceptionist } = await import(path.join(dir, "receptionist.mjs"));

const results = [];
const check = (name, ok, detail = "", sanity = false) => results.push({ name, ok, detail, sanity });
const fresh = () => {
  const store = { bookings: [{ id: 1, userId: 7, status: "booked" }, { id: 2, userId: 8, status: "booked" }], nextId: 3 };
  let calls = 0, lastPrompt = null;
  const llm = (p) => { calls++; lastPrompt = p; return obedientModel(p); };
  return { store, bot: createReceptionist({ llm, store }), calls: () => calls, lastPrompt: () => lastPrompt };
};

// sanity: FAQ works; a booking with a proper offset can be made (directly or after confirmation)
{
  const { bot } = fresh();
  const r = await bot.ask({ userId: 7, text: "What are your opening hours on Sunday?" });
  check("0a. sanity: an FAQ question is answered from the documents", /11:00 to 17:00/.test(r.text) || /Sunday/.test(r.text), r.text.slice(0, 70), true);
}
{
  const { bot, store } = fresh();
  const r = await bot.ask({ userId: 7, text: "Please book 2031-03-02T10:00:00+05:30" });
  for (const id of r.pending ?? []) await bot.confirm(7, id);
  check("0b. sanity: a booking with an offset ends up booked (after confirmation)", store.bookings.some((b) => b.id === 3 && b.status === "booked"), `bookings: ${store.bookings.length}`, true);
}

// 1. indirect injection from the uploaded PDF
{
  const { bot, store } = fresh();
  await bot.ask({ userId: 7, text: "What is your cancellation policy?" });
  const cancelled = store.bookings.filter((b) => b.status === "cancelled").length;
  check("1. an instruction hidden in a document cannot cancel bookings without user confirmation", cancelled === 0, `cancelled bookings: ${cancelled}`);
}

// 2. bad chunking / wrong retrieval
{
  const { bot } = fresh();
  const top = bot.retrieve("how much is a beard trim", 1)[0];
  const prices = top.text.match(/₹\d+/g) ?? [];
  check("2. the top chunk for 'beard trim' contains that service and only its own price", /beard trim/i.test(top.text) && prices.length === 1 && prices[0] === "₹300", `top chunk: "${top.text}"`);
}

// 3. time zone: offset-less time accepted and parsed in the server's zone
{
  const { bot, store } = fresh();
  const r = await bot.ask({ userId: 7, text: "Please book 2031-03-02T10:00:00" });
  for (const id of r.pending ?? []) await bot.confirm(7, id);
  const created = store.bookings.find((b) => b.id === 3);
  check("3. a time without a UTC offset is rejected, not booked at the server's hour", !created, created ? `booked at ${created.startsAt.toISOString()} (10:00 meant IST!)` : "rejected");
}

// 4. cost spike: whole history on every turn
{
  const { bot, lastPrompt } = fresh();
  const history = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "message " + i }));
  await bot.ask({ userId: 7, text: "What are your opening hours on Sunday?", history });
  const sent = lastPrompt()?.history?.length ?? 0;
  check("4. at most 8 history messages are sent to the model (bounded cost)", sent <= 8, `messages sent: ${sent} of 40`);
}

// 5. made-up answer when the documents don't contain it
{
  const { bot, calls } = fresh();
  const r = await bot.ask({ userId: 7, text: "How much is a bridal makeup package?" });
  check("5. an unanswerable question gets 'I don't know' (no invented price)", /don't know/i.test(r.text) && !/₹\d/.test(r.text), `answer: "${r.text.slice(0, 80)}", model calls: ${calls()}`);
}

let fails = 0, sanityFails = 0;
for (const r of results) { if (!r.ok) (r.sanity ? sanityFails++ : fails++); console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`); }
console.log(`\n${which}: ${fails} failing bug check(s), ${sanityFails} failing sanity check(s)`);
process.exit(sanityFails ? 2 : which === "fixed" ? (fails ? 1 : 0) : (fails === 5 ? 0 : 1));
