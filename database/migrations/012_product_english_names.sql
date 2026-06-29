ALTER TABLE products
  ADD COLUMN name_en VARCHAR(180) NULL AFTER name;

UPDATE products
   SET name_en = CASE TRIM(name)
     WHEN 'نظام المطاعم' THEN 'Restaurant System'
     WHEN 'نظام الخدمات' THEN 'Services System'
     WHEN 'نظام التجزئة' THEN 'Retail System'
     ELSE name_en
   END
 WHERE TRIM(name) IN ('نظام المطاعم', 'نظام الخدمات', 'نظام التجزئة');
