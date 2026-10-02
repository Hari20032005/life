import { cancelBooking, addBooking, reset, statusOf, NotFoundError, ForbiddenError } from "./service.mjs";
const owner = { id: 1, role: "owner" }, alice = { id: 2, role: "customer" }, bob = { id: 3, role: "customer" }, staff = { id: 4, role: "staff" };
const throws = (fn, E) => { try { fn(); } catch (e) { return e instanceof E; } return false; };

export default [
  ["owner can cancel any booking", () => { reset(); addBooking(10, alice.id); cancelBooking(owner, 10); return statusOf(10) === "cancelled"; }],
  ["customer can cancel their own booking", () => { reset(); addBooking(11, alice.id); cancelBooking(alice, 11); return statusOf(11) === "cancelled"; }],
  ["customer cannot cancel another customer's booking", () => { reset(); addBooking(12, alice.id); return throws(() => cancelBooking(bob, 12), NotFoundError) && statusOf(12) === "booked"; }],
];
