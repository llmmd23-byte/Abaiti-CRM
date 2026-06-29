import {NextResponse} from "next/server";
import type {ResultSetHeader, RowDataPacket} from "mysql2";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
import {hasPermission} from "@/lib/permissions";

const allowedStatuses = new Set(["active", "inactive", "pending", "suspended"]);

export async function PUT(request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
  if (session.role !== "admin") return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  if (!(await hasPermission(session, "table.users", "can_edit")))
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({error: "INVALID_ID"}, {status: 422});

  const body = await request.json();
  const name = String(body.name ?? "").trim().slice(0, 160);
  const role = String(body.role ?? "");
  const status = String(body.status ?? "");
  if (!name || !role || !allowedStatuses.has(status)) {
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

  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE users SET name=?, role_id=?, status=?, is_active=? WHERE id=?",
    [name, roleId, status, status === "active" ? 1 : 0, id]
  );
  if (!result.affectedRows) return NextResponse.json({error: "NOT_FOUND"}, {status: 404});

  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT u.id,u.name,u.email,u.phone,COALESCE(r.slug,'affiliate') role,u.status,u.is_active,u.created_at,u.last_login_at FROM users u LEFT JOIN roles r ON r.id=u.role_id WHERE u.id=? LIMIT 1",
    [id]
  );
  return NextResponse.json({data: rows[0]});
}
