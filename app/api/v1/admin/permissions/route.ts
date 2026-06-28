import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  allPermissionKeys,
  ensurePermissionsTable,
  hasPermission,
  listRoles,
  permissionKeysByRoleType,
  roleIdForSlug,
  type DataScope,
  type RoleType,
} from "@/lib/permissions";

const allowedActions = [
  "can_view",
  "can_create",
  "can_edit",
  "can_delete",
  "can_approve",
  "can_reports",
  "can_dashboard",
] as const;

const allowedScopes = new Set(["own", "team", "company", "all"]);

type PermissionRow = RowDataPacket & {
  subject_type: "role" | "user";
  subject_id: string;
  role_id: number | null;
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

type RoleOption = {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  role_type: RoleType;
};

async function adminCompanyId(userId: number) {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  return rows[0]?.CompanyID ?? null;
}

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await hasPermission(session, "page.admin.permissions", "can_view")))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  await ensurePermissionsTable();
  const roles = (await listRoles()) as RoleOption[];
  const companyId = await adminCompanyId(Number(session.sub));
  const userWhere =
    companyId === null || companyId === undefined
      ? "id = ?"
      : "(CompanyID = ? OR id = ?)";
  const userParams =
    companyId === null || companyId === undefined
      ? [Number(session.sub)]
      : [companyId, Number(session.sub)];

  const [[permissions], [users]] = await Promise.all([
    db.execute<PermissionRow[]>(
      `SELECT subject_type,subject_id,permission_key,can_view,can_create,can_edit,
              can_delete,can_approve,can_reports,can_dashboard,data_scope,role_id
         FROM permissions
        ORDER BY subject_type, subject_id, permission_key`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT u.id,u.name,u.email,u.username,COALESCE(r.slug,u.role) role,u.status,u.CompanyID AS company_id
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
        WHERE ${userWhere}
        ORDER BY u.name ASC, u.email ASC`,
      userParams,
    ),
  ]);

  return NextResponse.json({
    data: {
      permissionKeys: allPermissionKeys,
      permissionKeysByRoleType,
      permissions,
      roles,
      users,
    },
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await hasPermission(session, "page.admin.permissions", "can_edit")))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const subjectType = String(body.subject_type ?? "");
  const subjectId = String(body.subject_id ?? "");
  const permissionKey = String(body.permission_key ?? "");
  const dataScope = String(body.data_scope ?? "own");

  if (subjectType !== "role" && subjectType !== "user")
    return NextResponse.json({ error: "INVALID_SUBJECT" }, { status: 422 });
  if (!allPermissionKeys.includes(permissionKey))
    return NextResponse.json({ error: "INVALID_PERMISSION" }, { status: 422 });
  if (!allowedScopes.has(dataScope))
    return NextResponse.json({ error: "INVALID_SCOPE" }, { status: 422 });
  const roleId = subjectType === "role" ? await roleIdForSlug(subjectId) : null;
  if (subjectType === "role" && !roleId)
    return NextResponse.json({ error: "INVALID_ROLE" }, { status: 422 });

  if (subjectType === "role") {
    const roles = (await listRoles()) as RoleOption[];
    const role = roles.find((item) => item.slug === subjectId);
    const allowedKeys = permissionKeysByRoleType[role?.role_type ?? "user"];
    if (!allowedKeys.includes(permissionKey)) {
      return NextResponse.json(
        { error: "PERMISSION_NOT_ALLOWED_FOR_ROLE_TYPE" },
        { status: 422 },
      );
    }
  }

  if (subjectType === "user") {
    const userId = Number(subjectId);
    if (!Number.isInteger(userId) || userId < 1)
      return NextResponse.json({ error: "INVALID_USER" }, { status: 422 });
    const companyId = await adminCompanyId(Number(session.sub));
    const [users] = await db.execute<RowDataPacket[]>(
      companyId === null || companyId === undefined
        ? `SELECT u.id, COALESCE(r.role_type, CASE WHEN u.role = 'admin' THEN 'admin' ELSE 'user' END) role_type
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
            WHERE u.id = ? LIMIT 1`
        : `SELECT u.id, COALESCE(r.role_type, CASE WHEN u.role = 'admin' THEN 'admin' ELSE 'user' END) role_type
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
            WHERE u.id = ? AND (u.CompanyID = ? OR u.id = ?) LIMIT 1`,
      companyId === null || companyId === undefined
        ? [userId]
        : [userId, companyId, Number(session.sub)],
    );
    if (!users.length)
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    const allowedKeys =
      permissionKeysByRoleType[String(users[0].role_type) === "admin" ? "admin" : "user"];
    if (!allowedKeys.includes(permissionKey)) {
      return NextResponse.json(
        { error: "PERMISSION_NOT_ALLOWED_FOR_ROLE_TYPE" },
        { status: 422 },
      );
    }
  }

  await ensurePermissionsTable();
  const values = allowedActions.map((action) =>
    body[action] === true || Number(body[action]) === 1 ? 1 : 0,
  );

  await db.execute(
    `INSERT INTO permissions
       (subject_type,subject_id,role_id,permission_key,can_view,can_create,can_edit,can_delete,
        can_approve,can_reports,can_dashboard,data_scope)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       role_id=VALUES(role_id),
       can_view=VALUES(can_view),
       can_create=VALUES(can_create),
       can_edit=VALUES(can_edit),
       can_delete=VALUES(can_delete),
       can_approve=VALUES(can_approve),
       can_reports=VALUES(can_reports),
       can_dashboard=VALUES(can_dashboard),
       data_scope=VALUES(data_scope),
       updated_at=CURRENT_TIMESTAMP`,
    [subjectType, subjectId, roleId, permissionKey, ...values, dataScope],
  );

  return NextResponse.json({ ok: true });
}
