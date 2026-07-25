import {NextResponse} from "next/server";
import type {ResultSetHeader, RowDataPacket} from "mysql2";
import {getSession, isAdminSession} from "@/lib/auth";
import {db} from "@/lib/db";
import {hasPermission} from "@/lib/permissions";

const allowedStatuses = new Set(["active", "inactive", "pending", "suspended"]);
const allowedLocales = new Set(["ar", "en"]);
const allowedLicenseTypes = new Set(["none", "verified", "e_marketing", "fal"]);
const allowedLicenseStatuses = new Set(["pending", "verified", "rejected"]);

async function addColumnIfMissing(
  tableName: string,
  columnName: string,
  alterSql: string,
) {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
    [tableName, columnName],
  );

  if (columns.length) return;

  try {
    await db.execute(alterSql);
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_FIELDNAME") return;
    throw error;
  }
}

function nullableString(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim().slice(0, maxLength);
  return text || null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nullableDate(value: unknown) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export async function PUT(request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
  if (!isAdminSession(session)) return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  if (!(await hasPermission(session, "table.users", "can_edit")))
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({error: "INVALID_ID"}, {status: 422});

  const body = await request.json();
  const name = String(body.name ?? "").trim().slice(0, 160);
  const email = String(body.email ?? "").trim().slice(0, 190);
  const role = String(body.role ?? "");
  const status = String(body.status ?? "");
  const preferredLocale = String(body.preferred_locale ?? "ar");
  const licenseType = String(body.license_type ?? "none");
  const licenseStatus = String(body.license_status ?? "pending");
  const commissionPercentage =
    body.comission_percentage === null ||
    body.comission_percentage === undefined ||
    body.comission_percentage === ""
      ? 20
      : Number(body.comission_percentage);
  const companyId = nullableNumber(body.company_id);
  const managerId = nullableNumber(body.manager_id);
  if (
    !name ||
    !email ||
    !role ||
    !allowedStatuses.has(status) ||
    !allowedLocales.has(preferredLocale) ||
    !allowedLicenseTypes.has(licenseType) ||
    !allowedLicenseStatuses.has(licenseStatus) ||
    !Number.isFinite(commissionPercentage)
  ) {
    return NextResponse.json({error: "VALIDATION_ERROR"}, {status: 422});
  }
  const [roles] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM roles WHERE slug = ? AND is_active = 1 LIMIT 1",
    [role],
  );
  const roleId = roles[0]?.id ?? null;
  if (!roleId) return NextResponse.json({error: "INVALID_ROLE"}, {status: 422});

  if (id === Number(session.sub) && (role !== "admin" || status !== "active")) {
    return NextResponse.json({error: "CANNOT_DISABLE_CURRENT_ADMIN"}, {status: 422});
  }

  await addColumnIfMissing(
    "users",
    "username",
    "ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER email",
  );

  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE users
        SET name=?,
            email=?,
            username=?,
            phone=?,
            role_id=?,
            status=?,
            is_active=?,
            preferred_locale=?,
            city=?,
            district=?,
            referral_code=?,
            landing_slug=?,
            CompanyID=?,
            manager_id=?,
            level=?,
            comission_percentage=?,
            license_type=?,
            license_status=?,
            license_file_url=?,
            skills_experience=?,
            skills_courses=?,
            joined_at=?
      WHERE id=?`,
    [
      name,
      email,
      nullableString(body.username, 100),
      nullableString(body.phone, 40),
      roleId,
      status,
      status === "active" ? 1 : 0,
      preferredLocale,
      nullableString(body.city, 120),
      nullableString(body.district, 120),
      nullableString(body.referral_code, 80),
      nullableString(body.landing_slug, 120),
      companyId,
      managerId && managerId !== id ? managerId : null,
      nullableString(body.level, 80),
      commissionPercentage,
      licenseType,
      licenseStatus,
      nullableString(body.license_file_url, 500),
      nullableString(body.skills_experience, 2000),
      nullableString(body.skills_courses, 2000),
      nullableDate(body.joined_at),
      id,
    ]
  );
  if (!result.affectedRows) return NextResponse.json({error: "NOT_FOUND"}, {status: 404});

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
    [id]
  );
  return NextResponse.json({data: rows[0]});
}

export async function DELETE(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
  if (!isAdminSession(session)) return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  if (!(await hasPermission(session, "table.users", "can_delete")))
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({error: "INVALID_ID"}, {status: 422});

  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id,email FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  const existing = rows[0];
  if (!existing) return NextResponse.json({error: "NOT_FOUND"}, {status: 404});

  if (String(existing.email ?? "").toLowerCase() === "admin@middar.com") {
    return NextResponse.json({error: "DEFAULT_ADMIN_PROTECTED"}, {status: 422});
  }

  if (id === Number(session.sub)) {
    return NextResponse.json({error: "CANNOT_DELETE_CURRENT_ADMIN"}, {status: 422});
  }

  const [result] = await db.execute<ResultSetHeader>(
    "DELETE FROM users WHERE id = ?",
    [id],
  );
  if (!result.affectedRows) return NextResponse.json({error: "NOT_FOUND"}, {status: 404});

  return NextResponse.json({success: true});
}
