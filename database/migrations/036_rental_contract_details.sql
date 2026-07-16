ALTER TABLE rental_contracts
  ADD COLUMN event_name VARCHAR(190) NULL AFTER affiliate_user_id,
  ADD COLUMN event_dates VARCHAR(190) NULL AFTER event_name,
  ADD COLUMN event_location VARCHAR(190) NULL AFTER event_dates,
  ADD COLUMN first_party_cr VARCHAR(80) NULL AFTER event_location,
  ADD COLUMN first_party_representative VARCHAR(190) NULL AFTER first_party_cr,
  ADD COLUMN second_party_cr VARCHAR(80) NULL AFTER first_party_representative,
  ADD COLUMN second_party_representative VARCHAR(190) NULL AFTER second_party_cr,
  ADD COLUMN booth_number VARCHAR(80) NULL AFTER second_party_representative,
  ADD COLUMN participation_category VARCHAR(120) NULL AFTER booth_number,
  ADD COLUMN booth_size VARCHAR(80) NULL AFTER participation_category;
