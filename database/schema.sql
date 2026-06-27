-- Sales System MySQL schema
-- Run with: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS sales1_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sales1_system;

CREATE TABLE IF NOT EXISTS educational_assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  asset_type ENUM('image','video','document') NOT NULL,
  url VARCHAR(500) NULL,
  thumbnail_url VARCHAR(500) NULL,
  duration VARCHAR(20) NULL,
  description TEXT NULL,
  status ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_educational_assets_type_status (asset_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  username VARCHAR(100) NULL,
  CompanyID BIGINT UNSIGNED NULL,
  manager_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'affiliate', 'sales', 'support') NOT NULL DEFAULT 'affiliate',
  status ENUM('active', 'inactive', 'pending', 'suspended') NOT NULL DEFAULT 'active',
  preferred_locale ENUM('ar', 'en') NOT NULL DEFAULT 'ar',
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role_status (role, status),
  KEY idx_users_company_active (CompanyID, is_active),
  KEY idx_users_manager (manager_id),
  CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  city VARCHAR(120) NULL,
  district VARCHAR(120) NULL,
  referral_code VARCHAR(80) NOT NULL,
  landing_slug VARCHAR(120) NOT NULL,
  license_type ENUM('none', 'verified', 'e_marketing', 'fal') NOT NULL DEFAULT 'none',
  license_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  joined_at DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_affiliate_profiles_user_id (user_id),
  UNIQUE KEY uq_affiliate_profiles_referral_code (referral_code),
  UNIQUE KEY uq_affiliate_profiles_landing_slug (landing_slug),
  CONSTRAINT fk_affiliate_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS affiliate_social_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  affiliate_profile_id BIGINT UNSIGNED NOT NULL,
  platform ENUM('tiktok', 'snapchat', 'x', 'facebook', 'linkedin', 'instagram', 'other') NOT NULL,
  handle VARCHAR(160) NULL,
  url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_affiliate_social_platform (affiliate_profile_id, platform),
  CONSTRAINT fk_affiliate_social_profile
    FOREIGN KEY (affiliate_profile_id) REFERENCES affiliate_profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS affiliate_payout_methods (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  affiliate_profile_id BIGINT UNSIGNED NOT NULL,
  bank_name VARCHAR(160) NOT NULL,
  account_holder_name VARCHAR(160) NOT NULL,
  iban VARCHAR(40) NOT NULL,
  minimum_payout_amount DECIMAL(12,2) NOT NULL DEFAULT 500.00,
  currency CHAR(3) NOT NULL DEFAULT 'SAR',
  is_default TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payout_methods_profile (affiliate_profile_id),
  CONSTRAINT fk_payout_methods_profile
    FOREIGN KEY (affiliate_profile_id) REFERENCES affiliate_profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  affiliate_profile_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  status ENUM('active', 'pending', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_team_members_profile_status (affiliate_profile_id, status),
  CONSTRAINT fk_team_members_profile
    FOREIGN KEY (affiliate_profile_id) REFERENCES affiliate_profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  name_en VARCHAR(180) NULL,
  slug VARCHAR(140) NOT NULL,
  description TEXT NULL,
  status ENUM('active', 'inactive', 'draft') NOT NULL DEFAULT 'active',
  base_price DECIMAL(12,2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'SAR',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS industries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  name_en VARCHAR(180) NULL,
  slug VARCHAR(140) NOT NULL,
  landing_url VARCHAR(500) NULL,
  description TEXT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_industries_slug (slug),
  KEY idx_industries_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  affiliate_profile_id BIGINT UNSIGNED NULL,
  assigned_user_id BIGINT UNSIGNED NULL,
  industry_id BIGINT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  company_name VARCHAR(180) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  source VARCHAR(160) NULL,
  stage ENUM('new', 'interested', 'proposal', 'won', 'lost') NOT NULL DEFAULT 'interested',
  potential_value DECIMAL(12,2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'SAR',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leads_affiliate_stage (affiliate_profile_id, stage),
  KEY idx_leads_assigned_user (assigned_user_id),
  KEY idx_leads_industry (industry_id),
  KEY idx_leads_email_phone (email, phone),
  CONSTRAINT fk_leads_affiliate_profile
    FOREIGN KEY (affiliate_profile_id) REFERENCES affiliate_profiles(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_leads_assigned_user
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_leads_industry
    FOREIGN KEY (industry_id) REFERENCES industries(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS demo_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NULL,
  affiliate_profile_id BIGINT UNSIGNED NULL,
  product_id BIGINT UNSIGNED NULL,
  industry_id BIGINT UNSIGNED NULL,
  company_name VARCHAR(180) NOT NULL,
  contact_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  address VARCHAR(255) NULL,
  requirements TEXT NULL,
  status ENUM('new', 'contacted', 'scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_demo_requests_status (status),
  KEY idx_demo_requests_lead (lead_id),
  KEY idx_demo_requests_affiliate (affiliate_profile_id),
  CONSTRAINT fk_demo_requests_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_demo_requests_affiliate
    FOREIGN KEY (affiliate_profile_id) REFERENCES affiliate_profiles(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_demo_requests_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_demo_requests_industry
    FOREIGN KEY (industry_id) REFERENCES industries(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quote_number VARCHAR(80) NOT NULL,
  lead_id BIGINT UNSIGNED NULL,
  product_id BIGINT UNSIGNED NULL,
  affiliate_profile_id BIGINT UNSIGNED NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'SAR',
  valid_until DATE NULL,
  status ENUM('draft', 'sent', 'accepted', 'paid', 'expired', 'cancelled') NOT NULL DEFAULT 'draft',
  sales_invoice_number VARCHAR(80) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quotes_number (quote_number),
  KEY idx_quotes_status (status),
  KEY idx_quotes_lead (lead_id),
  KEY idx_quotes_affiliate (affiliate_profile_id),
  CONSTRAINT fk_quotes_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_quotes_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_quotes_affiliate
    FOREIGN KEY (affiliate_profile_id) REFERENCES affiliate_profiles(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sales_invoice_number VARCHAR(80) NULL,
  quote_id BIGINT UNSIGNED NULL,
  lead_id BIGINT UNSIGNED NULL,
  affiliate_profile_id BIGINT UNSIGNED NULL,
  product_id BIGINT UNSIGNED NULL,
  sale_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'SAR',
  status ENUM('pending', 'approved', 'paid', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  sold_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sales_status_date (status, sold_at),
  KEY idx_sales_affiliate (affiliate_profile_id),
  CONSTRAINT fk_sales_quote
    FOREIGN KEY (quote_id) REFERENCES quotes(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sales_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sales_affiliate
    FOREIGN KEY (affiliate_profile_id) REFERENCES affiliate_profiles(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sales_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_id BIGINT UNSIGNED NOT NULL,
  affiliate_profile_id BIGINT UNSIGNED NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'SAR',
  commission_type VARCHAR(80) NOT NULL DEFAULT 'عمولة مبيعات',
  status ENUM('pending', 'approved', 'paid', 'rejected') NOT NULL DEFAULT 'pending',
  payment_reference VARCHAR(255) NULL,
  approved_at DATETIME NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_commissions_affiliate_status (affiliate_profile_id, status),
  KEY idx_commissions_sale (sale_id),
  CONSTRAINT fk_commissions_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_commissions_affiliate
    FOREIGN KEY (affiliate_profile_id) REFERENCES affiliate_profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_number VARCHAR(80) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  affiliate_profile_id BIGINT UNSIGNED NULL,
  category VARCHAR(120) NOT NULL,
  subject VARCHAR(180) NOT NULL,
  details TEXT NOT NULL,
  notes TEXT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_tickets_number (ticket_number),
  KEY idx_support_tickets_status_priority (status, priority),
  KEY idx_support_tickets_user (user_id),
  KEY idx_support_tickets_affiliate (affiliate_profile_id),
  CONSTRAINT fk_support_tickets_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_support_tickets_affiliate
    FOREIGN KEY (affiliate_profile_id) REFERENCES affiliate_profiles(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO products (name, slug, description, status, base_price, currency)
VALUES
  ('Lead Attribution CRM', 'lead-attribution-crm', 'CRM for affiliate lead tracking.', 'active', NULL, 'SAR'),
  ('Quotes and Payment Links', 'quotes-payment-links', 'Quote generation and payment-link workflow.', 'active', NULL, 'SAR'),
  ('Commission Management', 'commission-management', 'Commission approval and payout visibility.', 'active', NULL, 'SAR'),
  ('Affiliate Help Desk', 'affiliate-help-desk', 'Structured support tickets for affiliates.', 'active', NULL, 'SAR')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO industries (name, slug, landing_url, description, status)
VALUES
  ('Home Services', 'home-services', 'https://www.middar.com/ar/home-services', 'Home services sector.', 'active'),
  ('Chalets and Resorts', 'chalets-resorts', 'https://www.middar.com/ar/chalets', 'Chalets and resorts sector.', 'active'),
  ('Car Wash', 'car-wash', 'https://www.middar.com/ar/car-wash', 'Car wash sector.', 'active'),
  ('Restaurants and Cafes', 'restaurants-cafes', 'https://www.middar.com/ar/restaurants', 'Restaurants and cafes sector.', 'active'),
  ('Retail', 'retail', 'https://www.middar.com/ar/retail', 'Retail sector.', 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  landing_url = VALUES(landing_url),
  description = VALUES(description),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;
