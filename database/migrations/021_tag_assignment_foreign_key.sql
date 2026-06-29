USE sales1_system;

DELETE lta FROM lead_tag_assignments lta
 LEFT JOIN tags tag ON tag.id = lta.tag_id
 WHERE tag.id IS NULL;

DROP PROCEDURE IF EXISTS add_tag_assignment_foreign_key;

DELIMITER //
CREATE PROCEDURE add_tag_assignment_foreign_key()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'lead_tag_assignments'
       AND CONSTRAINT_NAME = 'fk_lead_tag_assignments_tag'
  ) THEN
    ALTER TABLE lead_tag_assignments
      ADD CONSTRAINT fk_lead_tag_assignments_tag
      FOREIGN KEY (tag_id) REFERENCES tags(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END//
DELIMITER ;

CALL add_tag_assignment_foreign_key();
DROP PROCEDURE IF EXISTS add_tag_assignment_foreign_key;
