USE sales1_system;

DROP PROCEDURE IF EXISTS drop_users_role_column;

DELIMITER //
CREATE PROCEDURE drop_users_role_column()
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'role_id'
  ) THEN
    ALTER TABLE users ADD COLUMN role_id BIGINT UNSIGNED NULL AFTER password_hash;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'role'
  ) THEN
    UPDATE users u
      JOIN roles r ON r.slug = u.role
       SET u.role_id = r.id
     WHERE u.role_id IS NULL;

    ALTER TABLE users DROP COLUMN role;
  END IF;

  UPDATE users
     SET role_id = (SELECT id FROM roles WHERE slug = 'affiliate' LIMIT 1)
   WHERE role_id IS NULL;
END//
DELIMITER ;

CALL drop_users_role_column();
DROP PROCEDURE IF EXISTS drop_users_role_column;
