SET @leads_website_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'leads'
    AND COLUMN_NAME = 'website'
);

SET @leads_website_sql = IF(
  @leads_website_exists = 0,
  'ALTER TABLE leads ADD COLUMN website VARCHAR(255) NULL AFTER phone',
  'SELECT 1'
);

PREPARE leads_website_stmt FROM @leads_website_sql;
EXECUTE leads_website_stmt;
DEALLOCATE PREPARE leads_website_stmt;
