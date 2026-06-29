# 01 — Architecture & Connection

## Integration model

External project does not import Middar core. It integrates through:

```text
Frontend / External Service
  -> Middar API (`/api/v1/...`)
  -> Middar DB tables/config
```

Use Middar as a platform contract:
- DB tables store tenant data, users, permissions, configs, reports.
- API exposes generic CRUD/list/get/update/delete patterns.
- Config tables control visibility, report SQL, public APIs, images, table behavior.
- Permissions table controls UI + API authorization.

## Base API

Default source docs use:

```ts
const API_BASE_URL = 'https://api.middar.com';
const API_VERSION = '/api/v1';
```

Recommended env:

```env
VITE_API_BASE_URL=https://api.middar.com
VITE_API_VERSION=/api/v1
VITE_COMPANY_CODE=sales
VITE_DB_IDENTIFIER=sales1_system
```

Integration target:

- Company code: `sales`
- Database / DB identifier: `sales1_system`

## Database connection target

The `sales1_system` database is MySQL and is available to approved backend services and migration tools at:

```env
DB_HOST=84.8.112.83
DB_PORT=3306
DB_NAME=sales1_system
DB_USER=sales_user
DB_PASSWORD=<stored in the ignored .env.local file>
```

These variables are backend-only. Never expose them through `VITE_*` or `NEXT_PUBLIC_*` variables, frontend bundles, logs, or documentation.

## Auth header

All private API calls:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

Frontend token pattern:

```ts
const getAuthToken = () => localStorage.getItem('authToken');
const authHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
```

## Tenant/company rules

Most Middar config/data is company-scoped. Always carry at least one tenant discriminator:

- `CompanyID` when numeric company id exists.
- `company_code` is `sales`.
- `db_identifier` is `sales1_system` for config/report systems.
- Avoid cross-company reads by default.

Rules:

1. Every custom table should include tenant field unless it is global lookup.
2. Every report config should be per company when customization needed.
3. Every public table config should specify company/db identifier.
4. Every policy/permission check should respect company scope.

## DB access rule

External project should not write random core tables directly unless contract here says so.

Preferred order:

1. Use Middar API.
2. Use config DB tables documented here.
3. Add project-specific tables with Middar naming/tenant conventions.
4. Direct core table mutation only for integration tables such as users/permissions/configs when approved.

## Naming conventions

Observed Middar conventions:

- API table names often use DB table name directly: `/api/v1/{table}/list`.
- Primary keys may use PascalCase or lower-case variants depending table:
  - `ProjectID`, `OrderID`, `RecordID`
  - `userid`, `permission_id`
- Joined fields may appear as `<table>_<ColumnName>`:
  - `project_ProjectName`
  - `customer_CustomerName`
  - `lookup_LookupName`

External dev rule: preserve DB column names exactly. Do not camelCase API payload fields unless your adapter maps both ways.

## Minimal external app boot flow

```text
1. Load env/base URL.
2. User login -> store JWT.
3. Fetch current user/profile.
4. Fetch permissions for user.
5. Fetch globalconfig/project config.
6. Build UI routes/sidebar from config + permissions.
7. Use generic CRUD APIs for tables.
8. Use report endpoint for report pages.
```

## Error handling expectations

Handle:

- `401` -> token expired/invalid -> logout.
- `403` -> permission denied -> hide/disable feature.
- `404` -> table/record/config missing -> fallback/default config.
- `422`/validation -> show field errors.
- `500` -> show retry + support diagnostics.

## Security minimum

- Never expose DB credentials in frontend.
- Never expose internal JWT secret.
- Public API uses anon key, not private token.
- Report SQL must be configured server-side, never composed from raw user input.
- Filter all tenant data by company.
