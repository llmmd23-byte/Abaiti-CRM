-- Add commission type to distinguish direct sales commissions from supervision commissions.

USE sales1_system;

ALTER TABLE commissions
  ADD COLUMN commission_type VARCHAR(80) NOT NULL DEFAULT 'عمولة مبيعات' AFTER currency;
