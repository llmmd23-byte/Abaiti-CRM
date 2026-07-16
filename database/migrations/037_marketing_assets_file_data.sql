SET @marketing_assets_file_data_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'marketing_assets'
    AND COLUMN_NAME = 'file_data'
);

SET @marketing_assets_file_data_sql = IF(
  @marketing_assets_file_data_exists = 0,
  'ALTER TABLE marketing_assets ADD COLUMN file_data LONGBLOB NULL AFTER file_path',
  'SELECT 1'
);

PREPARE marketing_assets_file_data_stmt FROM @marketing_assets_file_data_sql;
EXECUTE marketing_assets_file_data_stmt;
DEALLOCATE PREPARE marketing_assets_file_data_stmt;
