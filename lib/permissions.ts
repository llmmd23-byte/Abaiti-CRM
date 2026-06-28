import "server-only";

import type { RowDataPacket } from "mysql2";

import type { MiddarSession } from "@/lib/auth";
import { db } from "@/lib/db";

export type PermissionAction =
  | "can_view"
  | "can_create"
  | "can_edit"
  | "can_delete"
  | "can_approve"
  | "can_reports"
  | "can_dashboard";

export type DataScope = "own" | "team" | "company" | "all";
export type RoleType = "admin" | "user";

type PermissionRow = RowDataPacket & {
  permission_key: string;
  can_view: number;
  can_create: number;
  can_edit: number;
  can_delete: number;
  can_approve: number;
  can_reports: number;
  can_dashboard: number;
  data_scope: DataScope;
};

type RoleRow = RowDataPacket & {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  role_type: RoleType;
};

type PermissionSeed = {
  key: string;
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  approve?: boolean;
  reports?: boolean;
  dashboard?: boolean;
  scope?: DataScope;
};

export const pagePermissions = [
  "page.admin.dashboard",
  "page.admin.tickets",
  "page.admin.accounts",
  "page.admin.products",
  "page.admin.tags",
  "page.admin.activities",
  "page.admin.content",
  "page.admin.permissions",
  "page.user.overview",
  "page.user.marketing",
  "page.user.customers",
  "page.user.quotes",
  "page.user.sales",
  "page.user.activation",
  "page.user.education",
  "page.user.support",
  "page.user.accounts",
  "page.user.settings",
];

export const tablePermissions = [
  "table.users",
  "table.products",
  "table.industries",
  "table.educational_assets",
  "table.leads",
  "table.lead_contacts",
  "table.lead_notes",
  "table.tag_types",
  "table.tags",
  "table.lead_tag_assignments",
  "table.demo_requests",
  "table.quotes",
  "table.sales",
  "table.commissions",
  "table.support_tickets",
  "table.support_ticket_events",
  "table.team_members",
  "table.social_accounts",
  "table.payout_methods",
];

export const specialPermissions = [
  "data.team_members",
  "commission.percentage",
];

export const allPermissionKeys = [
  ...pagePermissions,
  ...tablePermissions,
  ...specialPermissions,
];

export const adminPermissionKeys = allPermissionKeys.filter(
  (key) =>
    key.startsWith("page.admin.") ||
    key === "table.users" ||
    key === "table.products" ||
    key === "table.industries" ||
    key === "table.tag_types" ||
    key === "table.tags" ||
    key === "table.lead_tag_assignments" ||
    key === "table.educational_assets" ||
    key === "table.support_tickets" ||
    key === "table.support_ticket_events" ||
    key === "commission.percentage",
);

export const userPermissionKeys = allPermissionKeys.filter(
  (key) =>
    key.startsWith("page.user.") ||
    key === "data.team_members" ||
    [
      "table.products",
      "table.industries",
      "table.educational_assets",
      "table.leads",
      "table.lead_contacts",
      "table.lead_notes",
      "table.tag_types",
      "table.tags",
      "table.lead_tag_assignments",
      "table.demo_requests",
      "table.quotes",
      "table.sales",
      "table.commissions",
      "table.support_tickets",
      "table.support_ticket_events",
      "table.team_members",
      "table.social_accounts",
      "table.payout_methods",
    ].includes(key),
);

export const permissionKeysByRoleType: Record<RoleType, string[]> = {
  admin: adminPermissionKeys,
  user: userPermissionKeys,
};

const userTableScopes = new Set([
  "table.leads",
  "table.lead_contacts",
  "table.lead_notes",
  "table.tag_types",
  "table.tags",
  "table.lead_tag_assignments",
  "table.demo_requests",
  "table.quotes",
  "table.sales",
  "table.commissions",
]);

const userWritableTables = new Set([
  "table.leads",
  "table.lead_contacts",
  "table.lead_notes",
  "table.tag_types",
  "table.tags",
  "table.lead_tag_assignments",
  "table.demo_requests",
  "table.quotes",
  "table.support_tickets",
  "table.team_members",
  "table.social_accounts",
  "table.payout_methods",
]);

const affiliatePermissionSeeds: PermissionSeed[] = [
  ...pagePermissions
    .filter((key) => key.startsWith("page.user."))
    .map((key) => ({ key, view: true, dashboard: true, scope: "own" as const })),
  ...tablePermissions.map((key) => ({
    key,
    view:
      userWritableTables.has(key) ||
      userTableScopes.has(key) ||
      key === "table.products" ||
      key === "table.industries" ||
      key === "table.educational_assets" ||
      key === "table.support_ticket_events",
    create: userWritableTables.has(key),
    edit: userWritableTables.has(key),
    delete:
      key === "table.lead_contacts" ||
      key === "table.lead_notes" ||
      key === "table.payout_methods",
    scope: userTableScopes.has(key) ? ("team" as const) : ("own" as const),
  })),
  {
    key: "data.team_members",
    view: true,
    scope: "team",
  },
  {
    key: "commission.percentage",
    view: false,
    edit: false,
    scope: "own",
  },
];

const roleSeeds: Record<string, PermissionSeed[]> = {
  admin: allPermissionKeys.map((key) => ({
    key,
    view: true,
    create: true,
    edit: true,
    delete: true,
    approve: true,
    reports: true,
    dashboard: true,
    scope: "all",
  })),
  affiliate: affiliatePermissionSeeds,
  Leader: affiliatePermissionSeeds,
  sales: affiliatePermissionSeeds,
  support: [
    { key: "page.admin.tickets", view: true, dashboard: true, scope: "company" },
    { key: "page.user.support", view: true, dashboard: true, scope: "own" },
    {
      key: "table.support_tickets",
      view: true,
      create: true,
      edit: true,
      scope: "company",
    },
    {
      key: "table.support_ticket_events",
      view: true,
      create: true,
      scope: "company",
    },
  ],
};

const globalForPermissions = globalThis as typeof globalThis & {
  middarPermissionsReady?: Promise<void>;
};

const seedColumns = (seed: PermissionSeed) => [
  seed.view ? 1 : 0,
  seed.create ? 1 : 0,
  seed.edit ? 1 : 0,
  seed.delete ? 1 : 0,
  seed.approve ? 1 : 0,
  seed.reports ? 1 : 0,
  seed.dashboard ? 1 : 0,
  seed.scope ?? "own",
];

async function prunePermissionsByRoleType() {
  const adminPlaceholders = adminPermissionKeys.map(() => "?").join(",");
  const userPlaceholders = userPermissionKeys.map(() => "?").join(",");

  if (adminPermissionKeys.length) {
    await db.execute(
      `DELETE p FROM permissions p
        JOIN roles r ON r.id = p.role_id OR r.slug = p.subject_id
       WHERE p.subject_type = 'role'
         AND r.role_type = 'admin'
         AND p.permission_key NOT IN (${adminPlaceholders})`,
      adminPermissionKeys,
    );
  }

  if (userPermissionKeys.length) {
    await db.execute(
      `DELETE p FROM permissions p
        JOIN roles r ON r.id = p.role_id OR r.slug = p.subject_id
       WHERE p.subject_type = 'role'
         AND r.role_type = 'user'
         AND p.permission_key NOT IN (${userPlaceholders})`,
      userPermissionKeys,
    );
  }
}

export async function ensureRolesTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS roles (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      slug VARCHAR(80) NOT NULL,
      name_ar VARCHAR(120) NOT NULL,
      name_en VARCHAR(120) NOT NULL,
      role_type ENUM('admin','user') NOT NULL DEFAULT 'user',
      description VARCHAR(255) NULL,
      is_system TINYINT(1) NOT NULL DEFAULT 1,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_roles_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  const [roleTypeColumns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'role_type' LIMIT 1",
  );
  if (!roleTypeColumns.length) {
    await db.execute(
      "ALTER TABLE roles ADD COLUMN role_type ENUM('admin','user') NOT NULL DEFAULT 'user' AFTER name_en",
    );
  }

  const roleRows = [
    ["admin", "مشرف", "Admin"],
    ["affiliate", "مسوق", "Affiliate"],
    ["sales", "مبيعات", "Sales"],
    ["Leader", "قائد فريق", "Team Leader"],
    ["support", "دعم", "Support"],
  ];
  for (const role of roleRows) {
    await db.execute(
      `INSERT INTO roles (slug, name_ar, name_en)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name_ar = VALUES(name_ar),
         name_en = VALUES(name_en),
         is_active = 1`,
      role,
    );
  }
  await db.execute(
    "UPDATE roles SET role_type = 'admin' WHERE slug IN ('admin','support')",
  );
  await db.execute(
    "UPDATE roles SET role_type = 'user' WHERE slug IN ('affiliate','sales','Leader')",
  );

  const [userRoleColumns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role_id' LIMIT 1",
  );
  if (!userRoleColumns.length) {
    await db.execute("ALTER TABLE users ADD COLUMN role_id BIGINT UNSIGNED NULL AFTER role");
  }
  await db.execute(
    `UPDATE users u
       JOIN roles r ON r.slug = u.role
        SET u.role_id = r.id
      WHERE u.role_id IS NULL`,
  );
}

export async function listRoles() {
  await ensureRolesTable();
  const [rows] = await db.execute<RoleRow[]>(
    "SELECT id,slug,name_ar,name_en,role_type FROM roles WHERE is_active = 1 ORDER BY role_type ASC, id ASC",
  );
  return rows;
}

export async function roleIdForSlug(slug: string) {
  await ensureRolesTable();
  const [rows] = await db.execute<RoleRow[]>(
    "SELECT id,slug,name_ar,name_en,role_type FROM roles WHERE slug = ? AND is_active = 1 LIMIT 1",
    [slug],
  );
  return rows[0]?.id ? Number(rows[0].id) : null;
}

export async function ensurePermissionsTable() {
  if (globalForPermissions.middarPermissionsReady)
    return globalForPermissions.middarPermissionsReady;

  globalForPermissions.middarPermissionsReady = (async () => {
    await ensureRolesTable();
    await db.execute(
      `CREATE TABLE IF NOT EXISTS permissions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        subject_type ENUM('role','user') NOT NULL DEFAULT 'role',
        subject_id VARCHAR(80) NOT NULL,
        role_id BIGINT UNSIGNED NULL,
        permission_key VARCHAR(160) NOT NULL,
        can_view TINYINT(1) NOT NULL DEFAULT 0,
        can_create TINYINT(1) NOT NULL DEFAULT 0,
        can_edit TINYINT(1) NOT NULL DEFAULT 0,
        can_delete TINYINT(1) NOT NULL DEFAULT 0,
        can_approve TINYINT(1) NOT NULL DEFAULT 0,
        can_reports TINYINT(1) NOT NULL DEFAULT 0,
        can_dashboard TINYINT(1) NOT NULL DEFAULT 0,
        data_scope ENUM('own','team','company','all') NOT NULL DEFAULT 'own',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_permissions_subject_key (subject_type, subject_id, permission_key),
        KEY idx_permissions_key (permission_key),
        KEY idx_permissions_scope (data_scope)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );

    const [roleColumns] = await db.execute<RowDataPacket[]>(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'permissions' AND COLUMN_NAME = 'role_id' LIMIT 1",
    );
    if (!roleColumns.length) {
      await db.execute(
        "ALTER TABLE permissions ADD COLUMN role_id BIGINT UNSIGNED NULL AFTER subject_id",
      );
    }
    await db.execute(
      `UPDATE permissions p
         JOIN roles r ON r.slug = p.subject_id
          SET p.role_id = r.id
        WHERE p.subject_type = 'role' AND p.role_id IS NULL`,
    );

    for (const [role, seeds] of Object.entries(roleSeeds)) {
      const roleId = await roleIdForSlug(role);
      for (const seed of seeds) {
        await db.execute(
          `INSERT INTO permissions
             (subject_type, subject_id, role_id, permission_key, can_view, can_create, can_edit, can_delete,
              can_approve, can_reports, can_dashboard, data_scope)
           VALUES ('role', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             role_id = COALESCE(role_id, VALUES(role_id)),
             permission_key = permission_key`,
          [role, roleId, seed.key, ...seedColumns(seed)],
        );
      }
    }
    await prunePermissionsByRoleType();
  })();

  return globalForPermissions.middarPermissionsReady;
}

function adminFallback(permissionKey: string): PermissionRow {
  return {
    permission_key: permissionKey,
    can_view: 1,
    can_create: 1,
    can_edit: 1,
    can_delete: 1,
    can_approve: 1,
    can_reports: 1,
    can_dashboard: 1,
    data_scope: "all",
  } as PermissionRow;
}

async function permissionRows(session: MiddarSession, permissionKey?: string) {
  await ensurePermissionsTable();
  const params = permissionKey
    ? [String(session.sub), session.role, session.role, permissionKey]
    : [String(session.sub), session.role, session.role];
  const keyClause = permissionKey ? "AND permission_key = ?" : "";
  const [rows] = await db.execute<PermissionRow[]>(
    `SELECT permission_key,can_view,can_create,can_edit,can_delete,can_approve,
            can_reports,can_dashboard,data_scope
       FROM permissions
      WHERE (
        (subject_type='user' AND subject_id = ?)
        OR (
          subject_type='role'
          AND (
            subject_id = ?
            OR role_id = (SELECT id FROM roles WHERE slug = ? LIMIT 1)
          )
        )
      )
        ${keyClause}
      ORDER BY subject_type = 'user' DESC`,
    params,
  );
  return rows;
}

export async function getPermission(
  session: MiddarSession,
  permissionKey: string,
) {
  const rows = await permissionRows(session, permissionKey);
  if (rows[0]) return rows[0];
  if (session.role === "admin") return adminFallback(permissionKey);
  return null;
}

export async function hasPermission(
  session: MiddarSession,
  permissionKey: string,
  action: PermissionAction = "can_view",
) {
  const permission = await getPermission(session, permissionKey);
  return Number(permission?.[action] ?? 0) === 1;
}

export async function requirePermission(
  session: MiddarSession,
  permissionKey: string,
  action: PermissionAction = "can_view",
) {
  if (!(await hasPermission(session, permissionKey, action)))
    throw new Error("FORBIDDEN");
}

export async function getDataScope(
  session: MiddarSession,
  permissionKey: string,
): Promise<DataScope> {
  const permission = await getPermission(session, permissionKey);
  if (permission?.data_scope) return permission.data_scope;
  return session.role === "admin" ? "all" : "own";
}

export async function getSessionUserCompanyId(session: MiddarSession) {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [Number(session.sub)],
  );
  const companyId = rows[0]?.CompanyID;
  return companyId === null || companyId === undefined ? null : Number(companyId);
}

export async function teamUserIds(session: MiddarSession) {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM users WHERE id = ? OR manager_id = ?",
    [Number(session.sub), Number(session.sub)],
  );
  const ids = rows.map((row) => Number(row.id)).filter(Number.isFinite);
  return ids.length ? ids : [Number(session.sub)];
}

export async function ownerIdsForScope(
  session: MiddarSession,
  permissionKey: string,
) {
  const scope = await getDataScope(session, permissionKey);
  if (scope === "all") return null;
  if (scope === "company") {
    const companyId = await getSessionUserCompanyId(session);
    if (companyId === null) return [Number(session.sub)];
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE CompanyID = ? OR id = ?",
      [companyId, Number(session.sub)],
    );
    const ids = rows.map((row) => Number(row.id)).filter(Number.isFinite);
    return ids.length ? ids : [Number(session.sub)];
  }
  if (scope === "team") return teamUserIds(session);
  return [Number(session.sub)];
}

export async function getSessionPermissions(session: MiddarSession) {
  await ensurePermissionsTable();
  const rows = await permissionRows(session);
  const byKey = new Map<string, PermissionRow>();
  for (const row of rows) {
    if (!byKey.has(row.permission_key)) byKey.set(row.permission_key, row);
  }
  if (session.role === "admin") {
    for (const key of allPermissionKeys) {
      if (!byKey.has(key)) byKey.set(key, adminFallback(key));
    }
  }
  return Object.fromEntries(
    Array.from(byKey.entries()).map(([key, row]) => [
      key,
      {
        can_view: Number(row.can_view) === 1,
        can_create: Number(row.can_create) === 1,
        can_edit: Number(row.can_edit) === 1,
        can_delete: Number(row.can_delete) === 1,
        can_approve: Number(row.can_approve) === 1,
        can_reports: Number(row.can_reports) === 1,
        can_dashboard: Number(row.can_dashboard) === 1,
        data_scope: row.data_scope,
      },
    ]),
  );
}
