USE sales1_system;

UPDATE tag_types tt
  JOIN users legacy_user ON legacy_user.id = tt.company_id
  LEFT JOIN users company_user ON company_user.CompanyID = tt.company_id
   SET tt.company_id = legacy_user.CompanyID
 WHERE legacy_user.CompanyID IS NOT NULL
   AND company_user.id IS NULL;
