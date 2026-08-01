DELETE FROM permissions
WHERE permission_key IN (
  'page.user.sales',
  'page.user.activation',
  'page.user.education'
);
