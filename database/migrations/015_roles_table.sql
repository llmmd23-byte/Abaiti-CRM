USE sales1_system;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(80) NOT NULL,
  name_ar VARCHAR(120) NOT NULL,
  name_en VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (slug, name_ar, name_en)
VALUES
  ('admin', 'مشرف', 'Admin'),
  ('affiliate', 'مسوق', 'Affiliate'),
  ('sales', 'مبيعات', 'Sales'),
  ('support', 'دعم', 'Support')
ON DUPLICATE KEY UPDATE
  name_ar = VALUES(name_ar),
  name_en = VALUES(name_en),
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role_id BIGINT UNSIGNED NULL AFTER role;

UPDATE users u
JOIN roles r ON r.slug = u.role
SET u.role_id = r.id
WHERE u.role_id IS NULL;

ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS role_id BIGINT UNSIGNED NULL AFTER subject_id;

UPDATE permissions p
JOIN roles r ON r.slug = p.subject_id
SET p.role_id = r.id
WHERE p.subject_type = 'role' AND p.role_id IS NULL;
