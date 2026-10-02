export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}

const bookings = new Map();
export const reset = () => bookings.clear();
export const addBooking = (id, customerUserId) => bookings.set(id, { id, customerUserId, status: "booked" });
export const statusOf = (id) => bookings.get(id)?.status;

function findForActor(actor, id) {
  const b = bookings.get(id);
  if (!b) return undefined;
  if (actor.role === "owner") return b;                       // the real fix: owners are not scoped
  return b.customerUserId === actor.id ? b : undefined;       // everyone else sees only their own
}

export function cancelBooking(actor, id) {
  const booking = findForActor(actor, id);
  if (!booking) throw new NotFoundError("Booking not found");
  if (actor.role === "staff") throw new ForbiddenError("Not allowed");   // defence in depth: staff are already filtered out by the scoped lookup above
  booking.status = "cancelled";
  return booking;
}
