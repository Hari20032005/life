CREATE TABLE customers (id serial PRIMARY KEY, name text NOT NULL, email text UNIQUE);
CREATE TABLE services  (id serial PRIMARY KEY, name text NOT NULL, price text NOT NULL);
CREATE TABLE staff     (id serial PRIMARY KEY, name text NOT NULL);
CREATE TABLE staff_hours (id serial PRIMARY KEY, staff_id int NOT NULL REFERENCES staff(id), weekday int NOT NULL);
CREATE TABLE bookings (
  id serial PRIMARY KEY,
  customer_id int NOT NULL,
  service_id int NOT NULL REFERENCES services(id),
  staff_id int NOT NULL REFERENCES staff(id),
  slot timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'booked'
);
