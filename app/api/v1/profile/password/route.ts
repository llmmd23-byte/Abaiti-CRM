import { createHash, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

import { apiError, apiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";

async function matchesCurrentPassword(password: string, passwordHash: string) {
  if (/^\$2[aby]\$/.test(passwordHash)) {
    return bcrypt.compare(password, passwordHash);
  }

  if (/^[a-f\d]{64}$/i.test(passwordHash)) {
    const calculated = createHash("sha256").update(password, "utf8").digest();
    const expected = Buffer.from(passwordHash, "hex");
    return (
      calculated.length === expected.length &&
      timingSafeEqual(calculated, expected)
    );
  }

  return false;
}

export async function PUT(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    if (!currentPassword || newPassword.length < 6 || newPassword.length > 128) {
      return NextResponse.json({ error: "INVALID_PASSWORD" }, { status: 422 });
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
      [Number(session.sub)],
    );
    const passwordHash = String(rows[0]?.password_hash ?? "");
    if (!(await matchesCurrentPassword(currentPassword, passwordHash))) {
      return NextResponse.json({ error: "CURRENT_PASSWORD_INCORRECT" }, { status: 422 });
    }

    const nextHash = await bcrypt.hash(newPassword, 12);
    const [result] = await db.execute<ResultSetHeader>(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [nextHash, Number(session.sub)],
    );
    if (!result.affectedRows) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    return apiError(error);
  }
}
