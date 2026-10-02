// Week 3 lab - reference solution.
import { useEffect, useState } from "react";

const BUSINESS_TZ = "Asia/Kolkata";
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TZ, hour: "2-digit", minute: "2-digit" });   // explicit zone: same text on server and browser

function Row({ booking, onCancel }) {
  return (
    <li data-booking={booking.id}>
      <time dateTime={booking.startsAt}>{timeFmt.format(new Date(booking.startsAt))}</time> {booking.service}{" "}
      <input aria-label={`Note for booking ${booking.id}`} defaultValue="" />{" "}
      <button type="button" onClick={() => onCancel(booking.id)}>Cancel booking {booking.id}</button>
    </li>
  );
}

export function App({ initialBookings }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const status = "booked";                                   // primitive dependency: the effect runs once per change, not once per render
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/bookings?status=" + status, { signal: controller.signal }).then((r) => r.json()).then(setBookings).catch(() => {});
    return () => controller.abort();
  }, [status]);

  useEffect(() => {                                           // restore the session after a refresh
    fetch("/api/me", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((u) => u && setUser(u)).catch(() => {});
  }, []);

  async function cancel(id) {
    await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
    setBookings((all) => all.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
  }
  async function login(e) {
    e.preventDefault();
    const r = await fetch("/api/login", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "asha@example.com", password: "pw" }) });
    if (r.ok) setUser(await r.json());
  }
  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name"); setMessage(""); return; }   // validate before sending
    setError("");
    await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
    setMessage("Booking requested");
    setName("");
  }

  return (
    <main>
      <header>
        {user ? <p>Signed in as {user.email}</p> : <form onSubmit={login}><button type="submit">Log in</button></form>}
      </header>
      <h1>Upcoming bookings</h1>
      <ul>
        {/* key = the booking id (stable), never the array index */}
        {bookings.filter((b) => b.status === "booked").map((b) => (
          <Row key={b.id} booking={b} onCancel={cancel} />
        ))}
      </ul>
      <form onSubmit={submit} noValidate>
        <label htmlFor="name">Your name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "name-error" : undefined} />
        <button type="submit">Request booking</button>
        {error && <p id="name-error" role="alert">{error}</p>}
        <p role="status">{message}</p>
      </form>
    </main>
  );
}
