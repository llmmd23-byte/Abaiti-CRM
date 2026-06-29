# 06 — Reports

Middar report system is DB/config-driven with backend fallback configs.

## Report API

Docs define:

```http
GET /api/v1/report/{report_type}
```

Example:

```http
GET /api/v1/report/sales_summary?from_date=2026-01-01&to_date=2026-01-31
Authorization: Bearer <token>
```

## Report config model

A report config should define:

```json
{
  "query": "SELECT ... WHERE CompanyID = :company_id AND CreatedDate BETWEEN :from_date AND :to_date",
  "params": ["company_id", "from_date", "to_date"],
  "optional_params": {
    "status": null,
    "owner_user_id": null
  },
  "columns": ["Name", "Amount", "CreatedDate"],
  "required_permissions": ["partner_reports"]
}
```

## Config storage pattern

Docs mention insertion like:

```sql
INSERT INTO custom_config_dbs
(db_identifier, table_name, config_type, config_value)
VALUES
(
  'sales1_system',
  'sales_report',
  'report_config',
  '{"query":"SELECT ...","params":["from_date","to_date"]}'
);
```

Alternative dedicated table:

```sql
CREATE TABLE report_configs (
  ReportConfigID INT IDENTITY(1,1) PRIMARY KEY,
  db_identifier NVARCHAR(100) NOT NULL,
  report_name NVARCHAR(128) NOT NULL,
  config_value NVARCHAR(MAX) NOT NULL,
  is_active BIT DEFAULT 1,
  updated_by INT NULL,
  updated_at DATETIME DEFAULT GETDATE()
);
```

## Backend helper functions referenced in docs

Docs reference these helpers:

```py
get_report_query(report_name, company_code=None)
get_report_params(report_name, company_code=None)
get_report_optional_params(report_name, company_code=None)
get_report_columns(report_name, company_code=None)
has_report_config(report_name, company_code=None)
```

External dev should structure config so these functions can resolve:

- report name/type
- tenant/company code
- SQL query
- required params
- optional params/defaults
- columns

## Setup script pattern

Docs mention:

```bash
python setup_report_config.py sales setup
```

External project should provide seed script:

```bash
python setup_report_config.py sales setup
python setup_report_config.py sales validate
```

## Required permission

Report routes require `<module>_reports`.

```ts
if (!can(permissions, 'partner_reports')) return <AccessDenied />;
```

Backend should also enforce:

```sql
EXISTS (
  SELECT 1 FROM permissions p
  WHERE p.userid = :user_id AND p.partner_reports = 1
)
```

## Parameter safety

Never concatenate raw user input into SQL.

Bad:

```sql
WHERE Status = '${status}'
```

Good:

```sql
WHERE (:status IS NULL OR Status = :status)
```

Allowed param types:

- string enum/status
- int id
- date/date range
- boolean

## Report frontend usage

```ts
async function getReport<T>(reportType: string, params: Record<string, string | number>) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  return request<{ data: T[]; columns?: string[] }>(`/report/${reportType}?${qs}`);
}
```

## Report UI contract

A report page should define:

- filter form from required/optional params
- columns from config or response
- table display
- export button if allowed
- empty state
- error state for missing config

## Example: partner projects report

Config:

```json
{
  "query": "SELECT ProjectCode, ProjectName, Status, CreatedDate FROM partner_project WHERE CompanyID = :company_id AND CreatedDate BETWEEN :from_date AND :to_date AND (:status IS NULL OR Status = :status)",
  "params": ["company_id", "from_date", "to_date"],
  "optional_params": { "status": null },
  "columns": ["ProjectCode", "ProjectName", "Status", "CreatedDate"],
  "required_permissions": ["partner_reports"]
}
```

Seed:

```sql
INSERT INTO custom_config_dbs
(db_identifier, table_name, config_type, config_value)
VALUES
('sales1_system', 'partner_projects_report', 'report_config', '<json above>');
```

Call:

```http
GET /api/v1/report/partner_projects_report?company_id=1&from_date=2026-01-01&to_date=2026-01-31
```

## Report QA

- Missing required param -> clear validation error.
- Optional param omitted -> default used.
- Different company -> different config/result.
- User without reports permission -> 403.
- SQL injection strings -> treated as param values, not SQL.
- Large reports -> pagination/export strategy.
