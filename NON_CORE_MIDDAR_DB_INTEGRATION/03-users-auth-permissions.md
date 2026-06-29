# 03 — Users, Auth & Permissions

## Auth flow

```text
Login -> signed JWT in HttpOnly cookie -> API validates -> user+permissions loaded
```

Implemented endpoints for the `sales` company:

```http
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

The web sign-in page uses the same server-side authentication service. Credentials are checked against `sales1_system.users`; the password hash and database credentials never reach the browser.

Checklist:

- Login success stores the token in a secure HttpOnly cookie.
- Every private request sends token.
- Logout clears token.
- 401 clears session.
- Session expiration handled.

## Users table contract

Docs reference `Users` and `users`. Treat actual DB casing as environment-specific. Query exact table name from DB.

Common fields inferred/used by policies:

| Field | Purpose |
|---|---|
| `userid` / `UserID` | user PK |
| `username` | login/display |
| `email` | login/contact |
| `password_hash` | backend only |
| `manager_id` | hierarchy/team visibility |
| `CompanyID` | tenant scope |
| `is_active` / `IsActive` | access enabled |
External project should keep separate app profile fields in its own project DB/schema if not core-owned.

## User/profile API pattern

Use generic endpoints if no specialized endpoint exists:

```http
GET /api/v1/users/list?page=0&pageSize=20
GET /api/v1/get/users/{userid}
PUT /api/v1/update/users/{userid}
```

For current user, prefer dedicated endpoint if available; otherwise decode token only for id, then fetch user by id.

## Permissions table

Permissions are numeric flags, usually `0/1`.

Observed module pattern:

| Module | Fields |
|---|---|
| finance | `finance_view`, `finance_add_edit`, `finance_delete`, `finance_dashboard`, `finance_reports`, `finance_approve` |
| sales | `sales_view`, `sales_add_edit`, `sales_delete`, `sales_dashboard`, `sales_reports`, `sales_approve` |
| inventory | `inventory_view`, `inventory_add_edit`, `inventory_delete`, `inventory_dashboard`, `inventory_reports`, `inventory_approve` |
| accounting | `accounting_view`, `accounting_add_edit`, `accounting_delete`, `accounting_dashboard`, `accounting_reports`, `accounting_approve` |
| pos | `pos_view`, `pos_add_edit`, `pos_delete`, `pos_dashboard`, `pos_reports`, `pos_approve` |
| automation | `automation_view`, `automation_add_edit`, `automation_delete`, `automation_dashboard`, `automation_reports`, `automation_approve` |

External/custom module should follow same shape:

```sql
ALTER TABLE permissions ADD
  partner_view BIT DEFAULT 0,
  partner_add_edit BIT DEFAULT 0,
  partner_delete BIT DEFAULT 0,
  partner_dashboard BIT DEFAULT 0,
  partner_reports BIT DEFAULT 0,
  partner_approve BIT DEFAULT 0;
```

## Permission meaning

| Suffix | Means |
|---|---|
| `_view` | can read/list/detail |
| `_add_edit` | can create/update |
| `_delete` | can delete/archive |
| `_dashboard` | can see dashboard widgets |
| `_reports` | can run/export reports |
| `_approve` | can approve workflow records |

## Frontend permission type

```ts
export interface UserPermissions {
  partner_view?: number;
  partner_add_edit?: number;
  partner_delete?: number;
  partner_dashboard?: number;
  partner_reports?: number;
  partner_approve?: number;
}

export const can = (p: UserPermissions | null, key: keyof UserPermissions) =>
  Number(p?.[key] ?? 0) === 1;
```

## Route guard pattern

```ts
if (!can(permissions, 'partner_view')) {
  return <AccessDenied />;
}
```

Hide UI + enforce API. UI hiding is not security.

## Data access roles

Recommended access tiers:

| Tier | Filter |
|---|---|
| Admin/full | `1=1` within company |
| Manager/owner | `manager_id = :user_id` or `owner_user_id = :user_id` |
| Normal user | `userid = :user_id` or project-owned user reference |

## Policy examples

Docs show policy style rows:

```sql
-- user own profile or team members
userid = :user_id OR manager_id = :user_id

-- user updates own profile
userid = :user_id

-- module admin can update records
EXISTS (
  SELECT 1
  FROM permissions p
  WHERE p.userid = :user_id AND p.partner_add_edit = 1
)
```

For custom module:

```sql
EXISTS (
  SELECT 1 FROM permissions p
  WHERE p.userid = :user_id AND p.partner_view = 1
)
```

## API permission checks

CRUD mapping:

| API action | Required permission |
|---|---|
| list/get | `<module>_view` |
| add/update | `<module>_add_edit` |
| delete | `<module>_delete` |
| report endpoint | `<module>_reports` |
| approve action | `<module>_approve` |

## Audit writes

When creating/updating rows:

```ts
payload.CreatedBy = currentUser.userid;
payload.CompanyID = currentUser.CompanyID;
```

Never trust frontend user id for authorization. Backend must derive user id from token.
