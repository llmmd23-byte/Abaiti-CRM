SET @rental_contract_payment_status_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rental_contracts'
    AND COLUMN_NAME = 'payment_status'
);

SET @rental_contract_payment_status_sql = IF(
  @rental_contract_payment_status_exists = 0,
  'ALTER TABLE rental_contracts ADD COLUMN payment_status ENUM(''pending_payment'', ''paid'') NOT NULL DEFAULT ''pending_payment'' AFTER payment_method',
  'SELECT 1'
);

PREPARE rental_contract_payment_status_stmt FROM @rental_contract_payment_status_sql;
EXECUTE rental_contract_payment_status_stmt;
DEALLOCATE PREPARE rental_contract_payment_status_stmt;

SET @rental_booth_status_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rental_booths'
    AND COLUMN_NAME = 'status'
);

SET @rental_booth_status_sql = IF(
  @rental_booth_status_exists = 0,
  'ALTER TABLE rental_booths ADD COLUMN status ENUM(''pending_payment'', ''booked'') NOT NULL DEFAULT ''pending_payment'' AFTER booth_id',
  'SELECT 1'
);

PREPARE rental_booth_status_stmt FROM @rental_booth_status_sql;
EXECUTE rental_booth_status_stmt;
DEALLOCATE PREPARE rental_booth_status_stmt;

UPDATE rental_booths rb
JOIN rental_contracts rc ON rc.id = rb.rental_contract_id
SET rb.status = CASE
  WHEN COALESCE(rc.payment_status, 'pending_payment') = 'paid' THEN 'booked'
  ELSE 'pending_payment'
END;
