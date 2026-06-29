ALTER TABLE quotes
  ADD COLUMN sales_invoice_number VARCHAR(80) NULL;

UPDATE quotes q
JOIN sales s ON s.quote_id = q.id
SET q.sales_invoice_number = CONCAT('S-', s.id)
WHERE q.sales_invoice_number IS NULL;
