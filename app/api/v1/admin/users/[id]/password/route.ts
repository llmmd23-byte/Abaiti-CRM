import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { ResultSetHeader } from "mysql2";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await hasPermission(session, "table.users", "can_edit")))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 422 });
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? "");
  if (password.length < 6 || password.length > 128) {
    return NextResponse.json({ error: "INVALID_PASSWORD" }, { status: 422 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [passwordHash, id],
  );
  if (!result.affectedRows) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: { id } });
}
