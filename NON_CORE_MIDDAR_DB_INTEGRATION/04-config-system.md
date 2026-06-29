# 04 — Config System

Middar uses DB-driven config so external projects can change behavior without core code changes.

## `globalconfig`

Observed schema:

| Column | Type | Description |
|---|---|---|
| `ConfigID` | int PK | config id |
| `ConfigKey` | string | key name |
| `ConfigValue` | json | JSON settings |
| `ConfigType` | string | `tab_visibility`, `page_visibility`, etc |
| `CompanyID` | int | company/tenant |
| `UpdatedBy` | int | user id |
| `UpdatedDate` | datetime | last update |

Recommended unique key:

```sql
CREATE UNIQUE INDEX UX_globalconfig_company_type_key
ON globalconfig (CompanyID, ConfigType, ConfigKey);
```

## Config row pattern

```sql
INSERT INTO globalconfig
(ConfigKey, ConfigValue, ConfigType, CompanyID, UpdatedBy, UpdatedDate)
VALUES
('partner_project_tabs', '{"overview":true,"records":true,"reports":true}', 'tab_visibility', 1, 1, GETDATE());
```

## Frontend config loading

```ts
type ConfigValue = Record<string, unknown>;

async function getGlobalConfig(configType: string, configKey: string, companyId: number) {
  const res = await api.get('/globalconfig/list', {
    params: { ConfigType: configType, ConfigKey: configKey, CompanyID: companyId }
  });
  const row = res.data?.data?.[0];
  return row ? JSON.parse(row.ConfigValue) as ConfigValue : null;
}
```

## Visibility config

Each external module defines its own UI config keys in its own DB/schema.

Example tabs:

```ts
type PartnerProjectTab =
  | 'overview'
  | 'records'
  | 'reports'
  | 'settings';
```

Default:

```json
{
  "overview": true,
  "records": true,
  "reports": true,
  "settings": false
}
```

Example sidebar/page keys:

```json
{
  "partnerProjects": true,
  "partnerReports": true,
  "partnerSettings": false
}
```

## Config + permissions rule

Visible if both true:

```ts
const visible = config.partnerProjects === true && can(perms, 'partner_view');
```

Config controls availability. Permission controls user access.

## Public config tables

Used for public/anon APIs and table behavior. Docs mention DB-configured access using:

- `db_identifier`
- `table_name`
- `config_type`
- `config_value`

Pattern:

```sql
INSERT INTO custom_config_dbs
(db_identifier, table_name, config_type, config_value)
VALUES
('sales1_system', 'sales_report', 'report_config', '{"query":"SELECT ...","params":[]}');
```

Recommended config table shape:

```sql
CREATE TABLE custom_config_dbs (
  id INT IDENTITY(1,1) PRIMARY KEY,
  db_identifier NVARCHAR(100) NOT NULL,
  table_name NVARCHAR(128) NOT NULL,
  config_type NVARCHAR(100) NOT NULL,
  config_value NVARCHAR(MAX) NOT NULL,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME NULL
);
```

## Public API config fields

For public table/API exposure, config should define:

```json
{
  "enabled": true,
  "allowed_methods": ["GET", "POST"],
  "required_anon_key": true,
  "select_columns": ["id", "name", "created_at"],
  "insert_columns": ["name", "email", "message"],
  "where_clause": "is_public = 1",
  "rate_limit_per_minute": 60
}
```

Do not expose sensitive columns:

- password/password_hash
- tokens/secrets
- salary/private financial fields
- internal notes
- permissions
- admin-only flags

## Image/table config

Docs include image/table config guides. Use config rows for:

- image column mapping
- upload path/bucket
- thumbnail rules
- multiple image column names
- table columns visible in list/detail/forms

Example:

```json
{
  "multiple_images_column": "Images",
  "allowed_types": ["image/jpeg", "image/png", "image/webp"],
  "max_size_mb": 5,
  "thumbnail": true
}
```

## Config fallback strategy

Always ship code fallback:

```ts
const effectiveConfig = dbConfig ?? DEFAULT_CONFIG;
```

If config JSON invalid:

1. log error
2. use default
3. show admin warning only in settings

## Config QA

- Missing config row -> default works.
- Invalid JSON -> app does not crash.
- Different companies get different config.
- Hidden page not visible even if route typed manually.
- Permission denied even if config says visible.
