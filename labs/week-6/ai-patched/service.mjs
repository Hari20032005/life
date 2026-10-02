// AI-suggested patch for "fix: owner cancel returns 404". Applied by the agent; all tests now pass.
export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}

const bookings = new Map();
export const reset = () => bookings.clear();
export const addBooking = (id, customerUserId) => bookings.set(id, { id, customerUserId, status: "booked" });
export const statusOf = (id) => bookings.get(id)?.status;

const findById = (id) => bookings.get(id);

export function cancelBooking(actor, id) {
  const booking = findById(id);
  if (!booking) throw new NotFoundError("Booking not found");
  if (actor.role !== "owner" && actor.role !== "staff") throw new ForbiddenError("Not allowed");
  booking.status = "cancelled";
  return booking;
}
