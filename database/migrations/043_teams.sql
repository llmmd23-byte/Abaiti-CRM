CREATE TABLE IF NOT EXISTS teams (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NULL,
  leader_user_id BIGINT UNSIGNED NOT NULL,
  name_ar VARCHAR(160) NOT NULL,
  name_en VARCHAR(160) NOT NULL,
  description TEXT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teams_leader_user (leader_user_id),
  KEY idx_teams_company_status (company_id, status),
  CONSTRAINT fk_teams_leader_user FOREIGN KEY (leader_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO teams (company_id, leader_user_id, name_ar, name_en, status)
SELECT
  COALESCE(leader.CompanyID, leader.id),
  leader.id,
  CONCAT('فريق ', COALESCE(NULLIF(leader.name, ''), leader.email)),
  CONCAT('Team ', COALESCE(NULLIF(leader.name, ''), leader.email)),
  'active'
FROM users leader
WHERE EXISTS (
  SELECT 1 FROM users member WHERE member.manager_id = leader.id
);
