USE sales1_system;

DROP PROCEDURE IF EXISTS add_user_comission_percentage;

DELIMITER //
CREATE PROCEDURE add_user_comission_percentage()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'comission_percentage'
  ) THEN
    ALTER TABLE users
      ADD COLUMN comission_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00 AFTER level;
  END IF;
END//
DELIMITER ;

CALL add_user_comission_percentage();
DROP PROCEDURE IF EXISTS add_user_comission_percentage;
