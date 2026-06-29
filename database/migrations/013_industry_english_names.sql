ALTER TABLE industries
  ADD COLUMN name_en VARCHAR(180) NULL AFTER name;

UPDATE industries
   SET name_en = CASE TRIM(name)
     WHEN 'نشاط التجزئة' THEN 'Retail'
     WHEN 'الشاليهات والمنتجعات' THEN 'Chalets and Resorts'
     WHEN 'الصوالين النسائية' THEN 'Women''s Salons'
     WHEN 'المطاعم والكافئهات' THEN 'Restaurants and Cafes'
     WHEN 'other' THEN 'Other'
     ELSE name_en
   END
 WHERE TRIM(name) IN ('نشاط التجزئة', 'الشاليهات والمنتجعات', 'الصوالين النسائية', 'المطاعم والكافئهات', 'other');
