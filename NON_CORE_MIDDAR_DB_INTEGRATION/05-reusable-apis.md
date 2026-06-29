# 05 — Reusable APIs

## Generic CRUD API contract

Docs define base path `/api/v1`.

```http
GET    /api/v1/{table}/list
GET    /api/v1/get/{table}/{id}
POST   /api/v1/add/{table}
PUT    /api/v1/update/{table}/{id}
DELETE /api/v1/delete/{table}/{id}
```

Use table name exactly as backend expects.

## List endpoint

```http
GET /api/v1/partner_project/list?page=0&pageSize=20
Authorization: Bearer <token>
```

Expected response shape:

```ts
interface APIResponse<T> {
  data: T[];
  total: number;      // sometimes totalRows / totalCount
  page: number;       // 0-indexed
  pageSize: number;
}
```

Robust adapter:

```ts
function normalizeList<T>(res: any) {
  return {
    data: res.data ?? [],
    total: res.total ?? res.totalRows ?? res.totalCount ?? 0,
    page: res.page ?? 0,
    pageSize: res.pageSize ?? res.limit ?? 20,
  } as APIResponse<T>;
}
```

## Query params

Common params:

| Param | Purpose |
|---|---|
| `page` | 0-based page |
| `pageSize` | rows per page |
| `search` | keyword search |
| `sortBy` | sort column |
| `sortDir` | `asc`/`desc` |
| field name | equality filter |
| date field from/to | date range |

Example:

```http
GET /api/v1/partner_project/list?page=0&pageSize=20&Status=Pending&CompanyID=1
```

## API client

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (res.status === 403) throw new Error('FORBIDDEN');
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`);
  return res.json();
}
```

## Generic service factory

```ts
export function createCrudApi<T, CreateDto = Partial<T>, UpdateDto = Partial<T>>(
  table: string,
  idField: keyof T
) {
  return {
    list: (params = {}) => request<APIResponse<T>>(`/${table}/list?${new URLSearchParams(params)}`),
    get: (id: number | string) => request<T>(`/get/${table}/${id}`),
    create: (dto: CreateDto) => request<T>(`/add/${table}`, {
      method: 'POST', body: JSON.stringify(dto)
    }),
    update: (id: number | string, dto: UpdateDto) => request<T>(`/update/${table}/${id}`, {
      method: 'PUT', body: JSON.stringify(dto)
    }),
    remove: (id: number | string) => request<void>(`/delete/${table}/${id}`, {
      method: 'DELETE'
    }),
  };
}
```

## Example: custom partner table

```ts
interface PartnerProject {
  ProjectID: number;
  CompanyID: number;
  ProjectCode: string;
  ProjectName: string;
  Status: string;
  IsActive: boolean;
}

export const partnerProjectsApi = createCrudApi<PartnerProject>(
  'partner_project',
  'ProjectID'
);
```

## Special endpoints

If project logic cannot be represented by generic CRUD, create project-specific endpoints.

Examples:

```http
POST /api/v1/partner_project/calculate
POST /api/v1/partner_project/bulk-import
GET/POST document-related endpoints
```

Use special endpoints when business logic is server-side. Do not reimplement sensitive calculations/workflows in frontend.

## Public API flow

Public APIs are DB-configured, anon-key protected.

Headers:

```http
x-anon-key: <anon_key>
Content-Type: application/json
```

Pattern:

```http
GET /api/public/{resource}
POST /api/public/{resource}
```

Public endpoint must be backed by DB config defining allowed table/columns/methods.

## Reusable API checklist

For every new external module:

- [ ] Table exists with PK + tenant field.
- [ ] Permissions columns added.
- [ ] API CRUD works with JWT.
- [ ] List supports pagination.
- [ ] Filters match report/list UI.
- [ ] Create/update set audit fields.
- [ ] Delete behavior known: hard delete vs soft delete.
- [ ] Public API config exists only if anon access needed.
- [ ] No sensitive fields returned publicly.
