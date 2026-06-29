ALTER TABLE commissions
  ADD COLUMN payment_reference VARCHAR(255) NULL AFTER status;
