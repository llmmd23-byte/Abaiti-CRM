USE sales1_system;

DROP PROCEDURE IF EXISTS link_tags_company_through_tag_types;

DELIMITER //
CREATE PROCEDURE link_tags_company_through_tag_types()
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
  ) THEN
    DELETE newer
      FROM lead_tag_assignments newer
      JOIN tags duplicate_tag ON duplicate_tag.id = newer.tag_id
      JOIN tags canonical_tag
        ON canonical_tag.tag_type_id = duplicate_tag.tag_type_id
       AND canonical_tag.tag_name = duplicate_tag.tag_name
       AND canonical_tag.id < duplicate_tag.id
      JOIN lead_tag_assignments older
        ON older.lead_id = newer.lead_id
       AND older.affiliate_user_id = newer.affiliate_user_id
       AND older.tag_id = canonical_tag.id;

    UPDATE lead_tag_assignments lta
      JOIN tags duplicate_tag ON duplicate_tag.id = lta.tag_id
      JOIN tags canonical_tag
        ON canonical_tag.tag_type_id = duplicate_tag.tag_type_id
       AND canonical_tag.tag_name = duplicate_tag.tag_name
       AND canonical_tag.id < duplicate_tag.id
       SET lta.tag_id = canonical_tag.id;
  END IF;

  DELETE duplicate_tag
    FROM tags duplicate_tag
    JOIN tags canonical_tag
      ON canonical_tag.tag_type_id = duplicate_tag.tag_type_id
     AND canonical_tag.tag_name = duplicate_tag.tag_name
     AND canonical_tag.id < duplicate_tag.id;

  IF EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND index_name = 'uq_tags_company_name'
  ) THEN
    ALTER TABLE tags DROP INDEX uq_tags_company_name;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND index_name = 'idx_tags_company_id'
  ) THEN
    ALTER TABLE tags DROP INDEX idx_tags_company_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND index_name = 'uq_tags_type_name'
  ) THEN
    ALTER TABLE tags ADD UNIQUE KEY uq_tags_type_name (tag_type_id, tag_name);
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND column_name = 'company_id'
  ) THEN
    ALTER TABLE tags DROP COLUMN company_id;
  END IF;
END//
DELIMITER ;

CALL link_tags_company_through_tag_types();
DROP PROCEDURE IF EXISTS link_tags_company_through_tag_types;
