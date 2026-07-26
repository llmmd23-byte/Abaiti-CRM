ALTER TABLE rental_contracts
  MODIFY COLUMN payment_status ENUM('unpaid', 'pending_payment', 'paid') NOT NULL DEFAULT 'unpaid';

UPDATE rental_contracts
SET payment_status = 'unpaid'
WHERE payment_status IS NULL;

UPDATE rental_booths rb
JOIN rental_contracts rc ON rc.id = rb.rental_contract_id
SET rb.status = CASE
  WHEN COALESCE(rc.payment_status, 'unpaid') = 'paid' THEN 'booked'
  ELSE 'pending_payment'
END;
