USE sales1_system;

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  affiliate_user_id BIGINT UNSIGNED NOT NULL,
  tag_name VARCHAR(120) NOT NULL,
  tag_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_name (affiliate_user_id, tag_name),
  KEY idx_tags_affiliate_user_id (affiliate_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_tag_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  affiliate_user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lead_tag_assignments (lead_id, tag_id, affiliate_user_id),
  KEY idx_lead_tag_assignments_lead_id (lead_id),
  KEY idx_lead_tag_assignments_tag_id (tag_id),
  KEY idx_lead_tag_assignments_affiliate_user_id (affiliate_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS migrate_legacy_lead_tags;

DELIMITER //
CREATE PROCEDURE migrate_legacy_lead_tags()
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tags'
       AND column_name = 'lead_id'
  ) THEN
    INSERT IGNORE INTO tags (affiliate_user_id, tag_name, tag_color, created_at, updated_at)
    SELECT affiliate_user_id,
           tag_name,
           COALESCE(NULLIF(tag_color, ''), '#00b4d8'),
           MIN(created_at),
           MAX(updated_at)
      FROM lead_tags
     GROUP BY affiliate_user_id, tag_name, COALESCE(NULLIF(tag_color, ''), '#00b4d8');

    INSERT IGNORE INTO lead_tag_assignments (lead_id, tag_id, affiliate_user_id, created_at, updated_at)
    SELECT legacy.lead_id,
           tag.id,
           legacy.affiliate_user_id,
           legacy.created_at,
           legacy.updated_at
      FROM lead_tags legacy
      JOIN tags tag
        ON tag.affiliate_user_id = legacy.affiliate_user_id
       AND tag.tag_name = legacy.tag_name;
  END IF;
END//
DELIMITER ;

CALL migrate_legacy_lead_tags();
DROP PROCEDURE IF EXISTS migrate_legacy_lead_tags;
