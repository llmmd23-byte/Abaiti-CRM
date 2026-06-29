ALTER TABLE sales
  ADD COLUMN sales_invoice_number VARCHAR(80) NULL AFTER id;

UPDATE sales
   SET sales_invoice_number = CONCAT('S-', id)
 WHERE sales_invoice_number IS NULL;
