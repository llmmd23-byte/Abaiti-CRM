USE sales1_system;

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  affiliate_user_id BIGINT UNSIGNED NOT NULL,
  tag_type_id BIGINT UNSIGNED NULL,
  tag_name VARCHAR(120) NOT NULL,
  tag_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_name (affiliate_user_id, tag_name),
  KEY idx_tags_tag_type_id (tag_type_id),
  KEY idx_tags_affiliate_user_id (affiliate_user_id),
  CONSTRAINT fk_tags_affiliate_user
    FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tag_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  affiliate_user_id BIGINT UNSIGNED NOT NULL,
  type_name VARCHAR(120) NOT NULL,
  type_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_types_name (affiliate_user_id, type_name),
  KEY idx_tag_types_affiliate_user_id (affiliate_user_id),
  CONSTRAINT fk_tag_types_affiliate_user
    FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_tag_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  tag_type_id BIGINT UNSIGNED NULL,
  affiliate_user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lead_tag_assignments (lead_id, tag_id, affiliate_user_id),
  UNIQUE KEY uq_lead_tag_assignments_type (lead_id, tag_type_id, affiliate_user_id),
  KEY idx_lead_tag_assignments_lead_id (lead_id),
  KEY idx_lead_tag_assignments_tag_id (tag_id),
  KEY idx_lead_tag_assignments_tag_type_id (tag_type_id),
  KEY idx_lead_tag_assignments_affiliate_user_id (affiliate_user_id),
  CONSTRAINT fk_lead_tag_assignments_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_lead_tag_assignments_tag
    FOREIGN KEY (tag_id) REFERENCES tags(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_lead_tag_assignments_tag_type
    FOREIGN KEY (tag_type_id) REFERENCES tag_types(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_lead_tag_assignments_affiliate_user
    FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
