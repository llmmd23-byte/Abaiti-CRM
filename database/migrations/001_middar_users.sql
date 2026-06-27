-- Middar-compatible identity fields for the sales company.
-- Target database: sales1_system (MySQL 8)

USE sales1_system;

ALTER TABLE users
  ADD COLUMN username VARCHAR(100) NULL AFTER email,
  ADD COLUMN CompanyID BIGINT UNSIGNED NULL AFTER username,
  ADD COLUMN manager_id BIGINT UNSIGNED NULL AFTER CompanyID,
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER manager_id,
  ADD UNIQUE KEY uq_users_username (username),
  ADD KEY idx_users_company_active (CompanyID, is_active),
  ADD KEY idx_users_manager (manager_id),
  ADD CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
