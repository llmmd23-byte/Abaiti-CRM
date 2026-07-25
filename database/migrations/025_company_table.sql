USE sales1_system;

CREATE TABLE IF NOT EXISTS company (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_code VARCHAR(60) NOT NULL,
  name VARCHAR(180) NOT NULL,
  legal_name VARCHAR(220) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  website VARCHAR(255) NULL,
  tax_number VARCHAR(80) NULL,
  commercial_registration VARCHAR(80) NULL,
  industry VARCHAR(140) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(120) NULL,
  region VARCHAR(120) NULL,
  country VARCHAR(120) NOT NULL DEFAULT 'Saudi Arabia',
  postal_code VARCHAR(30) NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'SAR',
  status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  landing_page_asset_id BIGINT UNSIGNED NULL,
  landing_page_external_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_code (company_code),
  KEY idx_company_landing_page_asset (landing_page_asset_id),
  KEY idx_company_status (status),
  KEY idx_company_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO company (id, company_code, name)
SELECT source.CompanyID,
       CONCAT('COMP-', source.CompanyID),
       CONCAT('Company ', source.CompanyID)
  FROM (SELECT DISTINCT CompanyID FROM users WHERE CompanyID IS NOT NULL) source
  LEFT JOIN company c ON c.id = source.CompanyID
 WHERE c.id IS NULL;

DROP PROCEDURE IF EXISTS add_users_company_foreign_key;

DELIMITER //
CREATE PROCEDURE add_users_company_foreign_key()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND CONSTRAINT_NAME = 'fk_users_company'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_company
      FOREIGN KEY (CompanyID) REFERENCES company(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END//
DELIMITER ;

CALL add_users_company_foreign_key();
DROP PROCEDURE IF EXISTS add_users_company_foreign_key;
