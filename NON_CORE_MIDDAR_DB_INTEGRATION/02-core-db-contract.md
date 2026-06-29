# 02 — Core DB Contract

This is the shared DB surface external projects need.

Target database: `sales1_system` for company code `sales`.

## Required shared tables

Minimum platform tables:

| Table | Purpose | External use |
|---|---|---|
| `Users` / `users` | login identity/profile | auth, ownership, audit |
| `permissions` | per-user/module permissions | route/API access |
| `globalconfig` | JSON config by key/type/company | UI visibility, feature flags |
| `custom_config_dbs` | company-specific config DB registry | reports/public configs |
| `report_configs` or config rows | report SQL/config | reports |
| `public_table_configs` / public config tables | public API exposure | anon/public APIs |
| project-owned business tables | external project records | CRUD/list/report data |

## Common audit columns

Recommended for all external project tables:

```sql
CompanyID INT NULL,
CreatedBy INT NULL,
CreatedDate DATETIME DEFAULT GETDATE(),
UpdatedBy INT NULL,
UpdatedDate DATETIME NULL,
IsActive BIT DEFAULT 1
```

If company is string-scoped:

```sql
db_identifier NVARCHAR(100) NOT NULL, -- use 'sales1_system'
company_code NVARCHAR(100) NULL
```

## Generic table design

Required:

- One stable PK.
- Tenant discriminator (`CompanyID` or `db_identifier`).
- Human-readable name fields if shown in list/search.
- Status field if workflow exists.
- Audit fields.

Example:

```sql
CREATE TABLE partner_project (
  ProjectID INT IDENTITY(1,1) PRIMARY KEY,
  CompanyID INT NOT NULL,
  ProjectCode NVARCHAR(50) NOT NULL,
  ProjectName NVARCHAR(255) NOT NULL,
  Status NVARCHAR(50) DEFAULT 'Active',
  CreatedBy INT NULL,
  CreatedDate DATETIME DEFAULT GETDATE(),
  UpdatedBy INT NULL,
  UpdatedDate DATETIME NULL,
  IsActive BIT DEFAULT 1
);
```

## ID/reference rules

- `UserID` / `userid` references Middar user identity.
- `CompanyID` references tenant/company.
- `CreatedBy`, `UpdatedBy`, `ApprovedBy`, `owner_user_id`, `manager_id` reference users depending project rules.

Be explicit in code adapter:

```ts
type UserId = number;
type CompanyId = number;
type ProjectId = number;
```

## Joined field rules

List APIs may return joined fields using source table prefix:

```json
{
  "ProjectID": 1,
  "CustomerID": 3,
  "customer_CustomerName": "ACME",
  "lookup_StatusName": "Active"
}
```

Frontend should treat joined fields as read-only display fields.

## Lookup tables

Use project-owned lookup/reference tables for dropdowns. Each dev creates lookups inside their project DB/schema.

Pattern:

```sql
CREATE TABLE my_lookup (
  LookupID INT IDENTITY(1,1) PRIMARY KEY,
  LookupName NVARCHAR(255) NOT NULL,
  Description NVARCHAR(MAX) NULL,
  CompanyID INT NULL,
  IsActive BIT DEFAULT 1
);
```

## Config rows vs app constants

Prefer DB config when:

- Different per company.
- Admin should change it without deploy.
- It affects visibility, reports, public access, images, forms, tables.

Use code constants when:

- Compile-time-only.
- Security-sensitive.
- Rarely changes.

## Migration guidance

External projects should ship migrations for their own tables/config rows:

1. Create custom tables.
2. Seed permissions columns/rows if needed.
3. Seed `globalconfig` defaults.
4. Seed report configs.
5. Seed public table configs only for endpoints safe for anonymous access.
6. Add indexes on tenant + status + date fields.

## Index recommendations

```sql
CREATE INDEX IX_partner_project_Company_Status
ON partner_project (CompanyID, Status, IsActive);

CREATE INDEX IX_partner_project_CreatedDate
ON partner_project (CreatedDate DESC);
```

For reports, index all date/filter columns used in report params.
