UPDATE permissions p
LEFT JOIN roles r ON r.id = p.role_id OR r.slug = p.subject_id
   SET p.can_view = 0,
       p.can_create = 0,
       p.can_edit = 0,
       p.can_delete = 0,
       p.can_approve = 0,
       p.can_reports = 0,
       p.can_dashboard = 0
 WHERE p.permission_key = 'table.demo_requests'
   AND (
     (p.subject_type = 'role' AND r.role_type = 'user')
     OR p.subject_type = 'user'
   );
