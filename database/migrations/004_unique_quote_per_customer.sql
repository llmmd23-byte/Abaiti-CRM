ALTER TABLE quotes
  ADD UNIQUE KEY uq_quotes_affiliate_customer (affiliate_user_id, lead_id);
