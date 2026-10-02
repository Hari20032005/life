// Booking cancellation rules (permission matrix):
//   owner    -> may cancel ANY booking
//   customer -> may cancel only their OWN booking
//   staff    -> may NOT cancel bookings (v2 scope)
export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}

const bookings = new Map();
export const reset = () => bookings.clear();
export const addBooking = (id, customerUserId) => bookings.set(id, { id, customerUserId, status: "booked" });
export const statusOf = (id) => bookings.get(id)?.status;

// Scopes the lookup to what the actor may see.
function findForActor(actor, id) {
  const b = bookings.get(id);
  if (!b) return undefined;
  return b.customerUserId === actor.id ? b : undefined;      // BUG (original): owners are scoped like customers
}

export function cancelBooking(actor, id) {
  const booking = findForActor(actor, id);
  if (!booking) throw new NotFoundError("Booking not found");
  if (actor.role === "staff") throw new ForbiddenError("Not allowed");
  booking.status = "cancelled";
  return booking;
}
