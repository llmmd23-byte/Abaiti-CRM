USE sales1_system;

DROP PROCEDURE IF EXISTS migrate_tags_to_company_scope;

DELIMITER //
CREATE PROCEDURE migrate_tags_to_company_scope()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND column_name = 'company_id'
  ) THEN
    ALTER TABLE tags ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND column_name = 'affiliate_user_id'
  ) THEN
    UPDATE tags t
      JOIN users u ON u.id = t.affiliate_user_id
       SET t.company_id = COALESCE(u.CompanyID, u.id)
     WHERE t.company_id IS NULL;
  END IF;

  UPDATE tags
     SET company_id = 0
   WHERE company_id IS NULL;

  UPDATE tags t
    JOIN tag_types tt ON tt.id = t.tag_type_id
     SET t.company_id = tt.company_id
   WHERE t.tag_type_id IS NOT NULL
     AND t.company_id <> tt.company_id;

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
        ON canonical_tag.company_id = duplicate_tag.company_id
       AND canonical_tag.tag_name = duplicate_tag.tag_name
       AND canonical_tag.id < duplicate_tag.id
      JOIN lead_tag_assignments older
        ON older.lead_id = newer.lead_id
       AND older.affiliate_user_id = newer.affiliate_user_id
       AND older.tag_id = canonical_tag.id;

    UPDATE lead_tag_assignments lta
      JOIN tags duplicate_tag ON duplicate_tag.id = lta.tag_id
      JOIN tags canonical_tag
        ON canonical_tag.company_id = duplicate_tag.company_id
       AND canonical_tag.tag_name = duplicate_tag.tag_name
       AND canonical_tag.id < duplicate_tag.id
       SET lta.tag_id = canonical_tag.id;
  END IF;

  DELETE duplicate_tag
    FROM tags duplicate_tag
    JOIN tags canonical_tag
      ON canonical_tag.company_id = duplicate_tag.company_id
     AND canonical_tag.tag_name = duplicate_tag.tag_name
     AND canonical_tag.id < duplicate_tag.id;

  IF EXISTS (
    SELECT 1
      FROM information_schema.table_constraints
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND constraint_name = 'fk_tags_affiliate_user'
  ) THEN
    ALTER TABLE tags DROP FOREIGN KEY fk_tags_affiliate_user;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND index_name = 'uq_tags_name'
  ) THEN
    ALTER TABLE tags DROP INDEX uq_tags_name;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND index_name = 'idx_tags_affiliate_user_id'
  ) THEN
    ALTER TABLE tags DROP INDEX idx_tags_affiliate_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND index_name = 'idx_tags_company_id'
  ) THEN
    ALTER TABLE tags ADD INDEX idx_tags_company_id (company_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND index_name = 'uq_tags_company_name'
  ) THEN
    ALTER TABLE tags ADD UNIQUE KEY uq_tags_company_name (company_id, tag_name);
  END IF;

  ALTER TABLE tags MODIFY company_id BIGINT UNSIGNED NOT NULL;

  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
       AND column_name = 'affiliate_user_id'
  ) THEN
    ALTER TABLE tags DROP COLUMN affiliate_user_id;
  END IF;
END//
DELIMITER ;

CALL migrate_tags_to_company_scope();
DROP PROCEDURE IF EXISTS migrate_tags_to_company_scope;
