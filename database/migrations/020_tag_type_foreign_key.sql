USE sales1_system;

DROP PROCEDURE IF EXISTS add_tag_type_foreign_key;

DELIMITER //
CREATE PROCEDURE add_tag_type_foreign_key()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'tags'
       AND CONSTRAINT_NAME = 'fk_tags_tag_type'
  ) THEN
    ALTER TABLE tags
      ADD CONSTRAINT fk_tags_tag_type
      FOREIGN KEY (tag_type_id) REFERENCES tag_types(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END//
DELIMITER ;

CALL add_tag_type_foreign_key();
DROP PROCEDURE IF EXISTS add_tag_type_foreign_key;
