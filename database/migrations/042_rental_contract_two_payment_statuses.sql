UPDATE rental_contracts
SET payment_status = 'pending_payment'
WHERE payment_status = 'unpaid'
   OR payment_status IS NULL;

ALTER TABLE rental_contracts
  MODIFY COLUMN payment_status ENUM('pending_payment', 'paid') NOT NULL DEFAULT 'pending_payment';

UPDATE rental_booths rb
JOIN rental_contracts rc ON rc.id = rb.rental_contract_id
SET rb.status = CASE
  WHEN COALESCE(rc.payment_status, 'pending_payment') = 'paid' THEN 'booked'
  ELSE 'pending_payment'
END;
