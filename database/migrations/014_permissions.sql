USE sales1_system;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_type ENUM('role','user') NOT NULL DEFAULT 'role',
  subject_id VARCHAR(80) NOT NULL,
  permission_key VARCHAR(160) NOT NULL,
  can_view TINYINT(1) NOT NULL DEFAULT 0,
  can_create TINYINT(1) NOT NULL DEFAULT 0,
  can_edit TINYINT(1) NOT NULL DEFAULT 0,
  can_delete TINYINT(1) NOT NULL DEFAULT 0,
  can_approve TINYINT(1) NOT NULL DEFAULT 0,
  can_reports TINYINT(1) NOT NULL DEFAULT 0,
  can_dashboard TINYINT(1) NOT NULL DEFAULT 0,
  data_scope ENUM('own','team','company','all') NOT NULL DEFAULT 'own',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_subject_key (subject_type, subject_id, permission_key),
  KEY idx_permissions_key (permission_key),
  KEY idx_permissions_scope (data_scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
