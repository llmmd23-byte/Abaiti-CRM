USE sales1_system;

CREATE TABLE IF NOT EXISTS educational_assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  asset_type ENUM('image','video','document') NOT NULL,
  url VARCHAR(500) NULL,
  thumbnail_url VARCHAR(500) NULL,
  duration VARCHAR(20) NULL,
  description TEXT NULL,
  status ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_educational_assets_type_status (asset_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO educational_assets (title, asset_type, duration, description)
SELECT 'Getting started with Middar', 'video', '04:20', 'A quick introduction to the Middar sales workflow'
WHERE NOT EXISTS (SELECT 1 FROM educational_assets);
