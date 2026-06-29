# Middar Non-Core DB Integration Guide

Purpose: help external project devs build Middar-compatible apps without access to Middar core source.

Integration target:

- Company code: `sales`
- Database / DB identifier: `sales1_system`

Read order:

1. `01-architecture-and-connection.md` — mental model, DB/API auth, tenant rules.
2. `02-core-db-contract.md` — required shared tables, IDs, naming.
3. `03-users-auth-permissions.md` — users, login, permissions, access checks.
4. `04-config-system.md` — DB-driven config, visibility, public table config.
5. `05-reusable-apis.md` — generic CRUD/list/report API patterns.
6. `06-reports.md` — report config, frontend usage, setup.
7. `08-integration-checklist.md` — build/QA checklist.

Scope:
- NON-core integration only.
- No internal backend implementation dependency.
- Treat DB/API contracts here as the stable integration surface.

Source: analyzed Middar platform docs, then generalized for external project DB/schema ownership.

Note: module-specific table refs intentionally excluded. Each external dev owns their project DB/schema.
