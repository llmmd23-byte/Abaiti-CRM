SET @company_landing_asset_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'company'
    AND COLUMN_NAME = 'landing_page_asset_id'
);

SET @company_landing_asset_sql = IF(
  @company_landing_asset_exists = 0,
  'ALTER TABLE company ADD COLUMN landing_page_asset_id BIGINT UNSIGNED NULL AFTER notes',
  'SELECT 1'
);

PREPARE company_landing_asset_stmt FROM @company_landing_asset_sql;
EXECUTE company_landing_asset_stmt;
DEALLOCATE PREPARE company_landing_asset_stmt;

SET @company_landing_external_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'company'
    AND COLUMN_NAME = 'landing_page_external_url'
);

SET @company_landing_external_sql = IF(
  @company_landing_external_exists = 0,
  'ALTER TABLE company ADD COLUMN landing_page_external_url VARCHAR(500) NULL AFTER landing_page_asset_id',
  'SELECT 1'
);

PREPARE company_landing_external_stmt FROM @company_landing_external_sql;
EXECUTE company_landing_external_stmt;
DEALLOCATE PREPARE company_landing_external_stmt;

SET @company_landing_asset_index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'company'
    AND INDEX_NAME = 'idx_company_landing_page_asset'
);

SET @company_landing_asset_index_sql = IF(
  @company_landing_asset_index_exists = 0,
  'ALTER TABLE company ADD KEY idx_company_landing_page_asset (landing_page_asset_id)',
  'SELECT 1'
);

PREPARE company_landing_asset_index_stmt FROM @company_landing_asset_index_sql;
EXECUTE company_landing_asset_index_stmt;
DEALLOCATE PREPARE company_landing_asset_index_stmt;
