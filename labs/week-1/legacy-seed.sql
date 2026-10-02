-- "Production" data that already exists when your fix migration runs.
INSERT INTO customers (id, name, email) VALUES (1, 'Ann', 'ann@example.com'), (2, 'Ben', 'ben@example.com');
INSERT INTO services (id, name, price) VALUES (1, 'Haircut', '100'), (2, 'Trim', '20'), (3, 'Wax', '9');
INSERT INTO staff (id, name) VALUES (1, 'Sam');
INSERT INTO staff_hours (staff_id, weekday) VALUES (1,1),(1,2),(1,3),(1,4),(1,5);
INSERT INTO bookings (id, customer_id, service_id, staff_id, slot, status) VALUES
  (1, 1, 1, 1, '2030-01-07 10:00+05:30', 'booked'),
  (2, 2, 1, 1, '2030-01-07 12:00+05:30', 'booked'),
  (3, 1, 2, 1, '2030-01-08 10:00+05:30', 'booked'),
  (4, 2, 2, 1, '2030-01-08 12:00+05:30', 'cancelled'),
  (5, 999, 3, 1, '2030-01-09 10:00+05:30', 'booked');   -- orphan: customer 999 was deleted
SELECT setval('customers_id_seq', 2); SELECT setval('services_id_seq', 3); SELECT setval('staff_id_seq', 1); SELECT setval('bookings_id_seq', 5);
