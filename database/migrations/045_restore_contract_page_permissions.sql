UPDATE permissions p
JOIN roles r ON r.id = p.role_id OR r.slug = p.subject_id
SET p.can_view = 1,
    p.can_dashboard = 1
WHERE p.subject_type = 'role'
  AND r.role_type = 'user'
  AND p.permission_key IN (
    'page.user.participation_contracts',
    'page.user.sponsorship_contracts'
  );
