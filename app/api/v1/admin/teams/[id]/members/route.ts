import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { getSession, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const canEditTeams = await hasPermission(session, "table.teams", "can_edit");
  if (!canEditTeams) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const teamId = Number(id);
  const body = await request.json().catch(() => ({}));
  const userId = Number(body.user_id);
  if (
    !Number.isInteger(teamId) ||
    teamId < 1 ||
    !Number.isInteger(userId) ||
    userId < 1
  ) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 422 });
  }

  const adminId = Number(session.sub);
  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [adminId],
  );
  const adminCompanyId =
    adminRows[0]?.CompanyID === null || adminRows[0]?.CompanyID === undefined
      ? adminId
      : Number(adminRows[0].CompanyID);

  const [teams] = await db.execute<RowDataPacket[]>(
    `SELECT t.id, t.leader_user_id, t.company_id
       FROM teams t
       JOIN users leader ON leader.id = t.leader_user_id
      WHERE t.id = ?
        AND (leader.CompanyID = ? OR leader.id = ? OR leader.CompanyID IS NULL)
      LIMIT 1`,
    [teamId, adminCompanyId, adminId],
  );
  const team = teams[0];
  if (!team) return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });
  if (Number(team.leader_user_id) === userId) {
    return NextResponse.json({ error: "USER_IS_TEAM_LEADER" }, { status: 422 });
  }

  const [memberRows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id, u.CompanyID
       FROM users u
      WHERE u.id = ?
        AND (u.CompanyID = ? OR u.id = ? OR u.CompanyID IS NULL)
      LIMIT 1`,
    [userId, adminCompanyId, adminId],
  );
  const member = memberRows[0];
  if (!member) {
    return NextResponse.json({ error: "INVALID_MEMBER" }, { status: 422 });
  }

  const [leaderTeams] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM teams WHERE leader_user_id = ? LIMIT 1",
    [userId],
  );
  if (leaderTeams.length) {
    return NextResponse.json({ error: "USER_IS_TEAM_LEADER" }, { status: 422 });
  }

  const companyId = Number(team.company_id ?? adminCompanyId);
  if (member.CompanyID === null || member.CompanyID === undefined) {
    await db.execute("UPDATE users SET CompanyID = ? WHERE id = ?", [
      companyId,
      userId,
    ]);
  }

  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE users SET manager_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [Number(team.leader_user_id), userId],
  );

  return NextResponse.json({
    ok: true,
    data: {
      updated: result.affectedRows,
      team_id: teamId,
      user_id: userId,
      leader_user_id: Number(team.leader_user_id),
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const canEditTeams = await hasPermission(session, "table.teams", "can_edit");
  if (!canEditTeams) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const teamId = Number(id);
  const body = await request.json().catch(() => ({}));
  const userId = Number(body.user_id);
  if (
    !Number.isInteger(teamId) ||
    teamId < 1 ||
    !Number.isInteger(userId) ||
    userId < 1
  ) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 422 });
  }

  const adminId = Number(session.sub);
  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [adminId],
  );
  const adminCompanyId =
    adminRows[0]?.CompanyID === null || adminRows[0]?.CompanyID === undefined
      ? adminId
      : Number(adminRows[0].CompanyID);

  const [teams] = await db.execute<RowDataPacket[]>(
    `SELECT t.id, t.leader_user_id
       FROM teams t
       JOIN users leader ON leader.id = t.leader_user_id
      WHERE t.id = ?
        AND (leader.CompanyID = ? OR leader.id = ? OR leader.CompanyID IS NULL)
      LIMIT 1`,
    [teamId, adminCompanyId, adminId],
  );
  const team = teams[0];
  if (!team) return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });

  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE users SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND manager_id = ?",
    [userId, Number(team.leader_user_id)],
  );

  return NextResponse.json({
    ok: true,
    data: {
      updated: result.affectedRows,
      team_id: teamId,
      user_id: userId,
    },
  });
}
