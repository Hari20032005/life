// Week 5 lab - AI receptionist pipeline with FIVE bugs. The model is injected (see ../corpus.mjs). Find the bugs without AI.
import { DOCS } from "../corpus.mjs";

const STOP = new Set(["the", "a", "an", "is", "are", "of", "to", "on", "do", "you", "what", "how", "much", "your", "for", "in", "and", "at", "me", "i", "can", "does"]);
const words = (s) => s.toLowerCase().match(/[a-z0-9₹]+/g)?.filter((w) => !STOP.has(w)) ?? [];
const vec = (s) => { const m = new Map(); for (const w of words(s)) m.set(w, (m.get(w) ?? 0) + 1); return m; };
const cosine = (a, b) => { let dot = 0, na = 0, nb = 0; for (const [k, v] of a) { na += v * v; dot += v * (b.get(k) ?? 0); } for (const v of b.values()) nb += v * v; return na && nb ? dot / Math.sqrt(na * nb) : 0; };

// chunking: fixed number of words per chunk
function chunk(doc, size = 12) {
  const w = doc.text.split(/\s+/);
  const out = [];
  for (let i = 0; i < w.length; i += size) out.push({ doc: doc.name, text: w.slice(i, i + size).join(" ") });
  return out;
}
const chunks = DOCS.flatMap((d) => chunk(d)).map((c) => ({ ...c, v: vec(c.text) }));

export function retrieve(question, k = 1) {
  const q = vec(question);
  return chunks.map((c) => ({ ...c, score: cosine(q, c.v) })).sort((a, b) => b.score - a.score).slice(0, k);
}

export function createReceptionist({ llm, store }) {
  // store: { bookings: [{ id, userId, startsAt?, status }], nextId }
  async function ask({ userId, text, history = [] }) {
    const top = retrieve(text, 1);
    const prompt = {
      system: "You are the receptionist.",
      documents: top.map((t) => t.text),
      history,                                   // the whole conversation, every turn
      user: text,
    };
    const res = await llm(prompt);
    for (const call of res.toolCalls ?? []) {
      if (call.name === "cancel_booking") {
        for (const b of store.bookings) if (call.input.all || b.id === call.input.id) b.status = "cancelled";
      }
      if (call.name === "create_booking") {
        const startsAt = new Date(call.input.startsAt);
        store.bookings.push({ id: store.nextId++, userId, startsAt, status: "booked" });
      }
    }
    return { text: res.text, promptMessages: history.length + 1 };
  }
  async function confirm() { return { ok: false }; }
  return { ask, confirm, retrieve };
}
