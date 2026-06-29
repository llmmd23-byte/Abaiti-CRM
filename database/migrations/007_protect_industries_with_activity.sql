-- Activities must remain available while linked customer or demo data exists.
ALTER TABLE leads
  DROP FOREIGN KEY fk_leads_industry;

ALTER TABLE leads
  ADD CONSTRAINT fk_leads_industry
    FOREIGN KEY (industry_id) REFERENCES industries(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE demo_requests
  DROP FOREIGN KEY fk_demo_requests_industry;

ALTER TABLE demo_requests
  ADD CONSTRAINT fk_demo_requests_industry
    FOREIGN KEY (industry_id) REFERENCES industries(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;
