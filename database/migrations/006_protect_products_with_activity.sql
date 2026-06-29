-- Products referenced by quotes or sales must not be deleted.
ALTER TABLE quotes
  DROP FOREIGN KEY fk_quotes_product;

ALTER TABLE quotes
  ADD CONSTRAINT fk_quotes_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE sales
  DROP FOREIGN KEY fk_sales_product;

ALTER TABLE sales
  ADD CONSTRAINT fk_sales_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;
