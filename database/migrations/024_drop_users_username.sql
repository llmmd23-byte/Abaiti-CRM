USE sales1_system;

DROP PROCEDURE IF EXISTS drop_users_username_column;

DELIMITER //
CREATE PROCEDURE drop_users_username_column()
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'username'
  ) THEN
    ALTER TABLE users DROP COLUMN username;
  END IF;
END//
DELIMITER ;

CALL drop_users_username_column();
DROP PROCEDURE IF EXISTS drop_users_username_column;
