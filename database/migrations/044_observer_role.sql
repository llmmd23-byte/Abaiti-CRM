ALTER TABLE users
  MODIFY role ENUM('admin', 'affiliate', 'sales', 'support', 'observer') NOT NULL DEFAULT 'affiliate';

INSERT INTO roles (slug, name_ar, name_en, role_type, is_system, is_active)
VALUES ('observer', 'متابع', 'Observer', 'admin', 1, 1)
ON DUPLICATE KEY UPDATE
  name_ar = VALUES(name_ar),
  name_en = VALUES(name_en),
  role_type = VALUES(role_type),
  is_system = VALUES(is_system),
  is_active = VALUES(is_active);

DELETE p FROM permissions p
JOIN roles r ON r.id = p.role_id OR r.slug = p.subject_id
WHERE p.subject_type = 'role'
  AND r.slug = 'observer'
  AND p.permission_key NOT IN (
    'page.admin.dashboard',
    'page.admin.accounts',
    'page.admin.booths',
    'page.admin.tags',
    'table.users',
    'table.tag_types',
    'table.tags',
    'table.booths',
    'table.rental_booths'
  );

INSERT INTO permissions (
  subject_type,
  subject_id,
  role_id,
  permission_key,
  can_view,
  can_create,
  can_edit,
  can_delete,
  can_approve,
  can_reports,
  can_dashboard,
  data_scope
)
SELECT
  'role',
  'observer',
  r.id,
  p.permission_key,
  1,
  0,
  0,
  0,
  0,
  0,
  CASE WHEN p.permission_key LIKE 'page.admin.%' THEN 1 ELSE 0 END,
  'company'
FROM roles r
JOIN (
  SELECT 'page.admin.dashboard' permission_key UNION ALL
  SELECT 'page.admin.accounts' UNION ALL
  SELECT 'page.admin.booths' UNION ALL
  SELECT 'page.admin.tags' UNION ALL
  SELECT 'table.users' UNION ALL
  SELECT 'table.tag_types' UNION ALL
  SELECT 'table.tags' UNION ALL
  SELECT 'table.booths' UNION ALL
  SELECT 'table.rental_booths'
) p
WHERE r.slug = 'observer'
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  can_view = VALUES(can_view),
  can_create = VALUES(can_create),
  can_edit = VALUES(can_edit),
  can_delete = VALUES(can_delete),
  can_approve = VALUES(can_approve),
  can_reports = VALUES(can_reports),
  can_dashboard = VALUES(can_dashboard),
  data_scope = VALUES(data_scope);
