-- Remove legacy company_code and db_identifier fields.
-- Company scoping is handled only through users.CompanyID.

USE sales1_system;

ALTER TABLE users
  DROP INDEX idx_users_company_active,
  DROP COLUMN company_code,
  DROP COLUMN db_identifier,
  ADD KEY idx_users_company_active (CompanyID, is_active);
