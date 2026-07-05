USE sales1_system;

DROP PROCEDURE IF EXISTS migrate_tag_types_to_company_scope;

DELIMITER //
CREATE PROCEDURE migrate_tag_types_to_company_scope()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'tag_types'
       AND column_name = 'company_id'
  ) THEN
    ALTER TABLE tag_types ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'tag_types'
       AND column_name = 'affiliate_user_id'
  ) THEN
    UPDATE tag_types tt
      JOIN users u ON u.id = tt.affiliate_user_id
       SET tt.company_id = COALESCE(u.CompanyID, u.id)
     WHERE tt.company_id IS NULL;
  END IF;

  UPDATE tag_types
     SET company_id = 0
   WHERE company_id IS NULL;

  IF EXISTS (
    SELECT 1
      FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name = 'tags'
  ) THEN
    UPDATE tags t
      JOIN tag_types duplicate_type ON duplicate_type.id = t.tag_type_id
      JOIN tag_types canonical_type
        ON canonical_type.company_id = duplicate_type.company_id
       AND canonical_type.type_name = duplicate_type.type_name
       AND canonical_type.id < duplicate_type.id
       SET t.tag_type_id = canonical_type.id;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name = 'lead_tag_assignments'
  ) THEN
    UPDATE lead_tag_assignments lta
      JOIN tag_types duplicate_type ON duplicate_type.id = lta.tag_type_id
      JOIN tag_types canonical_type
        ON canonical_type.company_id = duplicate_type.company_id
       AND canonical_type.type_name = duplicate_type.type_name
       AND canonical_type.id < duplicate_type.id
       SET lta.tag_type_id = canonical_type.id;
  END IF;

  DELETE duplicate_type
    FROM tag_types duplicate_type
    JOIN tag_types canonical_type
      ON canonical_type.company_id = duplicate_type.company_id
     AND canonical_type.type_name = duplicate_type.type_name
     AND canonical_type.id < duplicate_type.id;

  IF EXISTS (
    SELECT 1
      FROM information_schema.table_constraints
     WHERE table_schema = DATABASE()
       AND table_name = 'tag_types'
       AND constraint_name = 'fk_tag_types_affiliate_user'
  ) THEN
    ALTER TABLE tag_types DROP FOREIGN KEY fk_tag_types_affiliate_user;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tag_types'
       AND index_name = 'uq_tag_types_name'
  ) THEN
    ALTER TABLE tag_types DROP INDEX uq_tag_types_name;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tag_types'
       AND index_name = 'idx_tag_types_affiliate_user_id'
  ) THEN
    ALTER TABLE tag_types DROP INDEX idx_tag_types_affiliate_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tag_types'
       AND index_name = 'idx_tag_types_company_id'
  ) THEN
    ALTER TABLE tag_types ADD INDEX idx_tag_types_company_id (company_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'tag_types'
       AND index_name = 'uq_tag_types_company_name'
  ) THEN
    ALTER TABLE tag_types ADD UNIQUE KEY uq_tag_types_company_name (company_id, type_name);
  END IF;

  ALTER TABLE tag_types MODIFY company_id BIGINT UNSIGNED NOT NULL;

  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'tag_types'
       AND column_name = 'affiliate_user_id'
  ) THEN
    ALTER TABLE tag_types DROP COLUMN affiliate_user_id;
  END IF;
END//
DELIMITER ;

CALL migrate_tag_types_to_company_scope();
DROP PROCEDURE IF EXISTS migrate_tag_types_to_company_scope;
