-- Fix 1: bookings pointed at customers that no longer exist. Quarantine them (do not silently destroy data), then add the FK.
CREATE TABLE bookings_orphans AS
  SELECT b.* FROM bookings b WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = b.customer_id);
DELETE FROM bookings b WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = b.customer_id);
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;

-- Fix 2: price was text, so ORDER BY price put '100' before '20'.
ALTER TABLE services ALTER COLUMN price TYPE integer USING price::integer;
ALTER TABLE services ADD CONSTRAINT services_price_nonneg CHECK (price >= 0);
