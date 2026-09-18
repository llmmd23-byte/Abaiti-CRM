import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { getSession, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

async function adminCompanyIdForSession(adminId: number) {
  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [adminId],
  );
  return adminRows[0]?.CompanyID === null || adminRows[0]?.CompanyID === undefined
    ? adminId
    : Number(adminRows[0].CompanyID);
}

async function findTeam(teamId: number, adminCompanyId: number, adminId: number) {
  const [teams] = await db.execute<RowDataPacket[]>(
    `SELECT t.id, t.leader_user_id, t.company_id
       FROM teams t
       JOIN users leader ON leader.id = t.leader_user_id
      WHERE t.id = ?
        AND (leader.CompanyID = ? OR leader.id = ? OR leader.CompanyID IS NULL)
      LIMIT 1`,
    [teamId, adminCompanyId, adminId],
  );
  return teams[0] ?? null;
}

export async function PUT(
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
  const leaderUserId = Number(body.leader_user_id);
  if (
    !Number.isInteger(teamId) ||
    teamId < 1 ||
    !Number.isInteger(leaderUserId) ||
    leaderUserId < 1
  ) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 422 });
  }

  const adminId = Number(session.sub);
  const adminCompanyId = await adminCompanyIdForSession(adminId);
  const currentTeam = await findTeam(teamId, adminCompanyId, adminId);
  if (!currentTeam) return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });

  const [leaders] = await db.execute<RowDataPacket[]>(
    `SELECT id, name, email, CompanyID
       FROM users
      WHERE id = ?
        AND (CompanyID = ? OR id = ? OR CompanyID IS NULL)
      LIMIT 1`,
    [leaderUserId, adminCompanyId, adminId],
  );
  const leader = leaders[0];
  if (!leader) return NextResponse.json({ error: "INVALID_LEADER" }, { status: 422 });

  const [otherLeaderTeam] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM teams WHERE leader_user_id = ? AND id <> ? LIMIT 1",
    [leaderUserId, teamId],
  );
  if (otherLeaderTeam.length) {
    return NextResponse.json({ error: "LEADER_ALREADY_HAS_TEAM" }, { status: 409 });
  }

  const oldLeaderId = Number(currentTeam.leader_user_id);
  const leaderName = String(leader.name || leader.email || leaderUserId).trim();
  const nameAr =
    String(body.name_ar ?? "").trim().slice(0, 160) ||
    `\u0641\u0631\u064a\u0642 ${leaderName}`;
  const nameEn =
    String(body.name_en ?? "").trim().slice(0, 160) ||
    `Team ${leaderName}`;
  const description = String(body.description ?? "").trim() || null;
  const status = String(body.status ?? "active") === "inactive" ? "inactive" : "active";
  const companyId = Number(currentTeam.company_id ?? adminCompanyId);

  await db.execute(
    `UPDATE teams
        SET leader_user_id = ?, name_ar = ?, name_en = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [leaderUserId, nameAr, nameEn, description, status, teamId],
  );
  if (oldLeaderId !== leaderUserId) {
    await db.execute("UPDATE users SET manager_id = ? WHERE manager_id = ?", [
      leaderUserId,
      oldLeaderId,
    ]);
  }
  if (leader.CompanyID === null || leader.CompanyID === undefined) {
    await db.execute("UPDATE users SET CompanyID = ? WHERE id = ?", [
      companyId,
      leaderUserId,
    ]);
  }

  return NextResponse.json({ ok: true, data: { id: teamId } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const canDeleteTeams = await hasPermission(session, "table.teams", "can_delete");
  if (!canDeleteTeams) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId < 1) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 422 });
  }

  const adminId = Number(session.sub);
  const adminCompanyId = await adminCompanyIdForSession(adminId);
  const team = await findTeam(teamId, adminCompanyId, adminId);
  if (!team) return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });

  await db.execute("UPDATE users SET manager_id = NULL WHERE manager_id = ?", [
    Number(team.leader_user_id),
  ]);
  const [result] = await db.execute<ResultSetHeader>("DELETE FROM teams WHERE id = ?", [
    teamId,
  ]);

  return NextResponse.json({ ok: true, data: { deleted: result.affectedRows } });
}
