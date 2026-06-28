USE sales1_system;

CREATE TABLE IF NOT EXISTS tag_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  affiliate_user_id BIGINT UNSIGNED NOT NULL,
  type_name VARCHAR(120) NOT NULL,
  type_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_types_name (affiliate_user_id, type_name),
  KEY idx_tag_types_affiliate_user_id (affiliate_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS add_tag_type_id_to_tags;

DELIMITER //
CREATE PROCEDURE add_tag_type_id_to_tags()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND column_name = 'tag_type_id'
  ) THEN
    ALTER TABLE tags ADD COLUMN tag_type_id BIGINT UNSIGNED NULL AFTER affiliate_user_id;
    ALTER TABLE tags ADD INDEX idx_tags_tag_type_id (tag_type_id);
  END IF;
END//
DELIMITER ;

CALL add_tag_type_id_to_tags();
DROP PROCEDURE IF EXISTS add_tag_type_id_to_tags;
