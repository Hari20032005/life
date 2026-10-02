// Week 3 lab - a small booking UI with FIVE bugs. Build + serve it with the checker, then debug in the browser (no AI).
import { useEffect, useState } from "react";

function Row({ booking, onCancel }) {
  // Time shown to the customer
  const time = new Date(booking.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <li data-booking={booking.id}>
      <time>{time}</time> {booking.service}{" "}
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

  const filters = { status: "booked" };
  useEffect(() => {
    fetch("/api/bookings?status=" + filters.status).then((r) => r.json()).then(setBookings);
  }, [filters]);

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
    await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
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
        {bookings.filter((b) => b.status === "booked").map((b, i) => (
          <Row key={i} booking={b} onCancel={cancel} />
        ))}
      </ul>
      <form onSubmit={submit} noValidate>
        <label htmlFor="name">Your name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">Request booking</button>
        <p role="status">{message}</p>
      </form>
    </main>
  );
}
