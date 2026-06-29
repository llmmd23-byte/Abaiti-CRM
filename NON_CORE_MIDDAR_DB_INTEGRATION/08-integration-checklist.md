# 08 — Integration Checklist

Use this before handing external Middar-compatible project to QA/devops.

## 1. Environment

- [ ] `VITE_API_BASE_URL` set.
- [ ] API version `/api/v1` set.
- [ ] Company code is `sales`.
- [ ] Database / DB identifier is `sales1_system`.
- [ ] MySQL endpoint `84.8.112.83:3306` is reachable from the approved backend environment.
- [ ] Database credentials are loaded from an ignored backend environment file or secret manager.
- [ ] No DB credentials in frontend.
- [ ] Public anon key only used for public endpoints.

## 2. Core tables

- [ ] `Users`/`users` exists.
- [ ] `permissions` exists.
- [ ] `globalconfig` exists.
- [ ] Config/report registry table exists (`custom_config_dbs` or equivalent).
- [ ] Project custom tables created.
- [ ] Tenant field exists on all tenant data.
- [ ] Audit fields exist.
- [ ] Indexes exist for tenant/status/date filters.

## 3. Users/auth

- [ ] Login works.
- [ ] JWT stored.
- [ ] JWT sent on all private calls.
- [ ] Logout clears JWT.
- [ ] 401 logs user out.
- [ ] User profile loads.
- [ ] User id/company id resolved from trusted token/session.

## 4. Permissions

- [ ] Module permission columns added.
- [ ] Admin has all needed permissions.
- [ ] Normal user has limited permissions.
- [ ] UI hides forbidden routes/actions.
- [ ] API blocks forbidden actions with 403.
- [ ] CRUD maps to correct permission suffix.
- [ ] Reports require `<module>_reports`.
- [ ] Approval actions require `<module>_approve`.

## 5. Config

- [ ] Required `globalconfig` defaults seeded.
- [ ] Config is company-scoped.
- [ ] Invalid/missing config falls back safely.
- [ ] Sidebar/page visibility works.
- [ ] Tab visibility works.
- [ ] Config + permissions both required for feature visibility.

## 6. Generic APIs

- [ ] `/api/v1/{table}/list` works.
- [ ] `/api/v1/get/{table}/{id}` works.
- [ ] `/api/v1/add/{table}` works.
- [ ] `/api/v1/update/{table}/{id}` works.
- [ ] `/api/v1/delete/{table}/{id}` behavior known.
- [ ] Pagination normalized.
- [ ] Filters/search/sort documented.
- [ ] Joined display fields handled read-only.

## 7. Public APIs

- [ ] Public endpoint needed? If no, skip.
- [ ] Public table config seeded.
- [ ] Allowed methods explicit.
- [ ] Allowed columns explicit.
- [ ] Sensitive columns excluded.
- [ ] Anon key required.
- [ ] Rate limit configured.
- [ ] Tenant/company filter enforced.

## 8. Reports

- [ ] Report config seeded per company.
- [ ] Query uses named params.
- [ ] Required params listed.
- [ ] Optional params/defaults listed.
- [ ] Columns listed or returned by API.
- [ ] Permission required.
- [ ] SQL injection tested.
- [ ] Large report strategy decided: pagination/export.

## 9. Project DB/schema

- [ ] Developer has access to `sales1_system`.
- [ ] Project tables created in that DB/schema.
- [ ] Project lookup tables populated.
- [ ] Project workflows/business rules documented.
- [ ] Special endpoints documented if generic CRUD is not enough.
- [ ] Owner/manager/user data scope tested if project needs row-level scope.

## 10. QA scenarios

- [ ] Admin can access all configured pages.
- [ ] Scoped user sees only allowed project rows.
- [ ] User without permission gets 403.
- [ ] Hidden config page cannot be opened by URL.
- [ ] Missing config does not crash.
- [ ] API network failure shows retry/error state.
- [ ] Arabic/English labels display if localized fields exist.
- [ ] Export/report output matches DB data.

## 11. Handoff package

External dev should receive:

- [ ] This `NON_CORE_MIDDAR_DB_INTEGRATION` folder.
- [ ] API base URL + environment names.
- [ ] Company id/code.
- [ ] Anon key if public APIs needed.
- [ ] DB migration scripts for custom tables/config.
- [ ] Seed SQL for permissions/config/reports.
- [ ] Test user accounts per role.
- [ ] Table list + primary keys.
- [ ] Known special endpoints.

## 12. Minimum seed example

```sql
-- 1) permissions for custom module
ALTER TABLE permissions ADD
  partner_view BIT DEFAULT 0,
  partner_add_edit BIT DEFAULT 0,
  partner_delete BIT DEFAULT 0,
  partner_dashboard BIT DEFAULT 0,
  partner_reports BIT DEFAULT 0,
  partner_approve BIT DEFAULT 0;

-- 2) feature visibility
INSERT INTO globalconfig
(ConfigKey, ConfigValue, ConfigType, CompanyID, UpdatedBy, UpdatedDate)
VALUES
('partner_sidebar', '{"partnerProjects":true,"partnerReports":true}', 'page_visibility', 1, 1, GETDATE());

-- 3) report config
INSERT INTO custom_config_dbs
(db_identifier, table_name, config_type, config_value)
VALUES
('sales1_system', 'partner_projects_report', 'report_config',
 '{"query":"SELECT ProjectCode, ProjectName, Status FROM partner_project WHERE CompanyID = :company_id","params":["company_id"],"columns":["ProjectCode","ProjectName","Status"],"required_permissions":["partner_reports"]}');
```
