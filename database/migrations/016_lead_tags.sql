USE sales1_system;

CREATE TABLE IF NOT EXISTS lead_tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  affiliate_user_id BIGINT UNSIGNED NOT NULL,
  tag_name VARCHAR(120) NOT NULL,
  tag_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lead_tags_name (lead_id, affiliate_user_id, tag_name),
  KEY idx_lead_tags_lead_id (lead_id),
  KEY idx_lead_tags_affiliate_user_id (affiliate_user_id),
  CONSTRAINT fk_lead_tags_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_lead_tags_affiliate_user
    FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
