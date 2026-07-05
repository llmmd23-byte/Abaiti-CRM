USE sales1_system;

UPDATE permissions p
  JOIN roles r ON r.id = p.role_id OR r.slug = p.subject_id
   SET p.can_delete = 1
 WHERE p.subject_type = 'role'
   AND r.role_type = 'user'
   AND p.permission_key = 'table.lead_tag_assignments';
