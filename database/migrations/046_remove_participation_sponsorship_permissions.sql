DELETE FROM permissions
WHERE permission_key IN (
  'page.user.participation_contracts',
  'page.user.sponsorship_contracts',
  'table.participation_contracts',
  'table.sponsorship_contracts'
);
