USE sales1_system;

DROP PROCEDURE IF EXISTS drop_tag_type_id_from_lead_tag_assignments;

DELIMITER //
CREATE PROCEDURE drop_tag_type_id_from_lead_tag_assignments()
BEGIN
  DELETE newer
    FROM lead_tag_assignments newer
    JOIN lead_tag_assignments older
      ON older.lead_id = newer.lead_id
     AND older.tag_id = newer.tag_id
     AND older.id < newer.id;

  DELETE newer
    FROM lead_tag_assignments newer
    JOIN lead_tag_assignments older
      ON older.lead_id = newer.lead_id
     AND older.id < newer.id
    JOIN tags newer_tag ON newer_tag.id = newer.tag_id
    JOIN tags older_tag ON older_tag.id = older.tag_id
     AND older_tag.tag_type_id = newer_tag.tag_type_id
   WHERE newer_tag.tag_type_id IS NOT NULL;

  IF EXISTS (
    SELECT 1
      FROM information_schema.key_column_usage
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
       AND column_name = 'tag_type_id'
       AND referenced_table_name IS NOT NULL
       AND constraint_name = 'fk_lead_tag_assignments_tag_type'
  ) THEN
    ALTER TABLE lead_tag_assignments DROP FOREIGN KEY fk_lead_tag_assignments_tag_type;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
       AND index_name = 'uq_lead_tag_assignments_type'
  ) THEN
    ALTER TABLE lead_tag_assignments DROP INDEX uq_lead_tag_assignments_type;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
       AND index_name = 'idx_lead_tag_assignments_tag_type_id'
  ) THEN
    ALTER TABLE lead_tag_assignments DROP INDEX idx_lead_tag_assignments_tag_type_id;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
       AND column_name = 'tag_type_id'
  ) THEN
    ALTER TABLE lead_tag_assignments DROP COLUMN tag_type_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
       AND index_name = 'uq_lead_tag_assignments'
  ) THEN
    ALTER TABLE lead_tag_assignments ADD UNIQUE KEY uq_lead_tag_assignments (lead_id, tag_id);
  END IF;
END//
DELIMITER ;

CALL drop_tag_type_id_from_lead_tag_assignments();
DROP PROCEDURE IF EXISTS drop_tag_type_id_from_lead_tag_assignments;
