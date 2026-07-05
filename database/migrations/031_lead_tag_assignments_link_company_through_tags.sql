USE sales1_system;

DROP PROCEDURE IF EXISTS link_lead_tag_assignments_company_through_tags;

DELIMITER //
CREATE PROCEDURE link_lead_tag_assignments_company_through_tags()
BEGIN
  UPDATE lead_tag_assignments lta
    JOIN tags t ON t.id = lta.tag_id
     SET lta.tag_type_id = t.tag_type_id
   WHERE lta.tag_type_id IS NULL
     AND t.tag_type_id IS NOT NULL;

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
     AND older.tag_type_id = newer.tag_type_id
     AND older.id < newer.id
   WHERE newer.tag_type_id IS NOT NULL;

  IF EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
       AND index_name = 'uq_lead_tag_assignments'
  ) THEN
    ALTER TABLE lead_tag_assignments DROP INDEX uq_lead_tag_assignments;
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
       AND index_name = 'idx_lead_tag_assignments_affiliate_user_id'
  ) THEN
    ALTER TABLE lead_tag_assignments DROP INDEX idx_lead_tag_assignments_affiliate_user_id;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
       AND column_name = 'affiliate_user_id'
  ) THEN
    ALTER TABLE lead_tag_assignments DROP COLUMN affiliate_user_id;
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

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
       AND index_name = 'uq_lead_tag_assignments_type'
  ) THEN
    ALTER TABLE lead_tag_assignments ADD UNIQUE KEY uq_lead_tag_assignments_type (lead_id, tag_type_id);
  END IF;
END//
DELIMITER ;

CALL link_lead_tag_assignments_company_through_tags();
DROP PROCEDURE IF EXISTS link_lead_tag_assignments_company_through_tags;
