import bcrypt from "bcryptjs";
import {NextResponse} from "next/server";
import type {ResultSetHeader, RowDataPacket} from "mysql2";

import {getSession, isAdminSession} from "@/lib/auth";
import {db} from "@/lib/db";
import {hasPermission} from "@/lib/permissions";

const allowedStatuses = new Set(["active", "inactive", "pending", "suspended"]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
  if (!isAdminSession(session)) return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  if (!(await hasPermission(session, "table.users", "can_create"))) {
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  }

  const adminId = Number(session.sub);
  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [adminId],
  );
  const existingAdminCompanyId = adminRows[0]?.CompanyID;
  const adminCompanyId =
    existingAdminCompanyId === null || existingAdminCompanyId === undefined
      ? adminId
      : Number(existingAdminCompanyId);
  if (existingAdminCompanyId === null || existingAdminCompanyId === undefined) {
    await db.execute("UPDATE users SET CompanyID = ? WHERE id = ?", [
      adminCompanyId,
      adminId,
    ]);
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim().slice(0, 160);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 190);
  const role = String(body.role ?? "");
  const status = String(body.status ?? "active");
  const password = String(body.password ?? "");

  if (!name || !email || !role || !allowedStatuses.has(status) || password.length < 6) {
    return NextResponse.json({error: "VALIDATION_ERROR"}, {status: 422});
  }

  const [roles] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM roles WHERE slug = ? AND is_active = 1 LIMIT 1",
    [role],
  );
  const roleId = roles[0]?.id ?? null;
  if (!roleId) return NextResponse.json({error: "INVALID_ROLE"}, {status: 422});

  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    [email],
  );
  if (existing.length) {
    return NextResponse.json({error: "EMAIL_EXISTS"}, {status: 409});
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO users
      (name, email, password_hash, role_id, status, is_active, preferred_locale, CompanyID)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      email,
      passwordHash,
      roleId,
      status,
      status === "active" ? 1 : 0,
      "ar",
      adminCompanyId,
    ],
  );

  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id,u.name,u.email,u.username,u.phone,u.role_id,COALESCE(r.slug,'affiliate') role,COALESCE(r.role_type,'user') role_type,
            u.status,u.is_active,u.preferred_locale,u.city,u.district,u.referral_code,u.landing_slug,
            u.CompanyID AS company_id,u.manager_id,manager.name manager_name,u.level,u.comission_percentage,
            u.license_type,u.license_status,u.license_file_url,u.skills_experience,u.skills_courses,u.skills_proof_files,
            u.joined_at,u.created_at,u.updated_at,u.last_login_at
       FROM users u
       LEFT JOIN roles r ON r.id=u.role_id
       LEFT JOIN users manager ON manager.id = u.manager_id
      WHERE u.id=? LIMIT 1`,
    [result.insertId],
  );

  return NextResponse.json({data: rows[0]}, {status: 201});
}
