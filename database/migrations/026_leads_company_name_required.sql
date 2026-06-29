UPDATE leads
   SET company_name = COALESCE(NULLIF(TRIM(company_name), ''), NULLIF(TRIM(name), ''), '—')
 WHERE company_name IS NULL OR TRIM(company_name) = '';

ALTER TABLE leads
  MODIFY COLUMN name VARCHAR(190) NULL,
  MODIFY COLUMN company_name VARCHAR(190) NOT NULL;
