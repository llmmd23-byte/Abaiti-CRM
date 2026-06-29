CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id BIGINT UNSIGNED NOT NULL,
  email_new_lead TINYINT(1) NOT NULL DEFAULT 1,
  email_quote_opened TINYINT(1) NOT NULL DEFAULT 1,
  email_commission_approved TINYINT(1) NOT NULL DEFAULT 1,
  payout_status_updates TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_notification_settings_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
