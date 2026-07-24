import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

function normalizeIds(value: unknown) {
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const canEditLeads = await hasPermission(session, "table.leads", "can_edit");
  const canViewAdminDashboard = await hasPermission(
    session,
    "page.admin.dashboard",
    "can_view",
  );
  if (!canEditLeads && !canViewAdminDashboard) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const adminId = Number(session.sub);
  const body = await request.json().catch(() => ({}));
  const leadIds = normalizeIds(body.lead_ids);
  const targetUserId = Number(body.target_user_id);
  if (!leadIds.length || !Number.isInteger(targetUserId) || targetUserId < 1) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 422 });
  }

  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [adminId],
  );
  const adminCompanyId =
    adminRows[0]?.CompanyID === null || adminRows[0]?.CompanyID === undefined
      ? adminId
      : Number(adminRows[0].CompanyID);

  const [targetRows] = await db.execute<RowDataPacket[]>(
    `SELECT id, CompanyID
       FROM users
      WHERE id = ?
        AND (CompanyID = ? OR id = ? OR CompanyID IS NULL)
      LIMIT 1`,
    [targetUserId, adminCompanyId, adminId],
  );
  if (!targetRows.length) {
    return NextResponse.json({ error: "INVALID_TARGET_USER" }, { status: 422 });
  }
  if (targetRows[0]?.CompanyID === null || targetRows[0]?.CompanyID === undefined) {
    await db.execute("UPDATE users SET CompanyID = ? WHERE id = ?", [
      adminCompanyId,
      targetUserId,
    ]);
  }

  const placeholders = leadIds.map(() => "?").join(",");
  const [allowedLeads] = await db.execute<RowDataPacket[]>(
    `SELECT l.id
       FROM leads l
       LEFT JOIN users owner ON owner.id = l.affiliate_user_id
      WHERE l.id IN (${placeholders})
        AND (
          owner.CompanyID = ?
          OR owner.id = ?
          OR owner.CompanyID IS NULL
          OR l.affiliate_user_id IS NULL
        )`,
    [...leadIds, adminCompanyId, adminId],
  );
  const allowedIds = allowedLeads.map((row) => Number(row.id));
  if (!allowedIds.length) {
    return NextResponse.json({ error: "NO_ALLOWED_CLIENTS" }, { status: 422 });
  }

  const allowedPlaceholders = allowedIds.map(() => "?").join(",");
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE leads
        SET affiliate_user_id = ?, assigned_user_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${allowedPlaceholders})`,
    [targetUserId, targetUserId, ...allowedIds],
  );

  return NextResponse.json({
    ok: true,
    data: {
      requested: leadIds.length,
      transferred: result.affectedRows,
    },
  });
}
