USE sales1_system;

DROP PROCEDURE IF EXISTS add_tag_type_to_lead_tag_assignments;

DELIMITER //
CREATE PROCEDURE add_tag_type_to_lead_tag_assignments()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'lead_tag_assignments'
       AND COLUMN_NAME = 'tag_type_id'
  ) THEN
    ALTER TABLE lead_tag_assignments
      ADD COLUMN tag_type_id BIGINT UNSIGNED NULL AFTER tag_id;
  END IF;

  UPDATE lead_tag_assignments lta
    JOIN tags t ON t.id = lta.tag_id
     SET lta.tag_type_id = t.tag_type_id
   WHERE lta.tag_type_id IS NULL
     AND t.tag_type_id IS NOT NULL;

  DELETE newer FROM lead_tag_assignments newer
    JOIN lead_tag_assignments older
      ON older.lead_id = newer.lead_id
     AND older.affiliate_user_id = newer.affiliate_user_id
     AND older.tag_type_id = newer.tag_type_id
     AND older.id < newer.id
   WHERE newer.tag_type_id IS NOT NULL;

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'lead_tag_assignments'
       AND INDEX_NAME = 'idx_lead_tag_assignments_tag_type_id'
  ) THEN
    ALTER TABLE lead_tag_assignments
      ADD INDEX idx_lead_tag_assignments_tag_type_id (tag_type_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'lead_tag_assignments'
       AND INDEX_NAME = 'uq_lead_tag_assignments_type'
  ) THEN
    ALTER TABLE lead_tag_assignments
      ADD UNIQUE KEY uq_lead_tag_assignments_type (lead_id, tag_type_id, affiliate_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'lead_tag_assignments'
       AND CONSTRAINT_NAME = 'fk_lead_tag_assignments_tag_type'
  ) THEN
    ALTER TABLE lead_tag_assignments
      ADD CONSTRAINT fk_lead_tag_assignments_tag_type
      FOREIGN KEY (tag_type_id) REFERENCES tag_types(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END//
DELIMITER ;

CALL add_tag_type_to_lead_tag_assignments();
DROP PROCEDURE IF EXISTS add_tag_type_to_lead_tag_assignments;
