import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { getSession, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

async function ensureTeamsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS teams (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company_id BIGINT UNSIGNED NULL,
      leader_user_id BIGINT UNSIGNED NOT NULL,
      name_ar VARCHAR(160) NOT NULL,
      name_en VARCHAR(160) NOT NULL,
      description TEXT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_teams_leader_user (leader_user_id),
      KEY idx_teams_company_status (company_id, status),
      CONSTRAINT fk_teams_leader_user FOREIGN KEY (leader_user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const canCreateTeams = await hasPermission(session, "table.teams", "can_create");
  const canViewTeams = await hasPermission(session, "page.admin.teams", "can_view");
  if (!canCreateTeams && !canViewTeams) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await ensureTeamsTable();

  const adminId = Number(session.sub);
  const body = await request.json().catch(() => ({}));
  const leaderUserId = Number(body.leader_user_id);
  const status = String(body.status ?? "active") === "inactive" ? "inactive" : "active";
  if (!Number.isInteger(leaderUserId) || leaderUserId < 1) {
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
  if (adminRows[0]?.CompanyID === null || adminRows[0]?.CompanyID === undefined) {
    await db.execute("UPDATE users SET CompanyID = ? WHERE id = ?", [
      adminCompanyId,
      adminId,
    ]);
  }

  const [leaders] = await db.execute<RowDataPacket[]>(
    `SELECT id, name, email, CompanyID
       FROM users
      WHERE id = ?
        AND (CompanyID = ? OR id = ? OR CompanyID IS NULL)
      LIMIT 1`,
    [leaderUserId, adminCompanyId, adminId],
  );
  const leader = leaders[0];
  if (!leader) {
    return NextResponse.json({ error: "INVALID_LEADER" }, { status: 422 });
  }
  if (leader.CompanyID === null || leader.CompanyID === undefined) {
    await db.execute("UPDATE users SET CompanyID = ? WHERE id = ?", [
      adminCompanyId,
      leaderUserId,
    ]);
  }

  const leaderName = String(leader.name || leader.email || leaderUserId).trim();
  const nameAr =
    String(body.name_ar ?? "").trim().slice(0, 160) ||
    `\u0641\u0631\u064a\u0642 ${leaderName}`;
  const nameEn =
    String(body.name_en ?? "").trim().slice(0, 160) ||
    `Team ${leaderName}`;
  const description = String(body.description ?? "").trim() || null;

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO teams (company_id, leader_user_id, name_ar, name_en, description, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminCompanyId, leaderUserId, nameAr, nameEn, description, status],
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT
          t.id,
          t.company_id,
          t.leader_user_id,
          t.name_ar,
          t.name_en,
          t.description,
          t.status,
          t.created_at,
          t.updated_at,
          leader.name leader_name,
          leader.email leader_email,
          COUNT(member.id) members_count
         FROM teams t
         JOIN users leader ON leader.id = t.leader_user_id
         LEFT JOIN users member ON member.manager_id = leader.id
        WHERE t.id = ?
        GROUP BY t.id,t.company_id,t.leader_user_id,t.name_ar,t.name_en,t.description,t.status,t.created_at,t.updated_at,leader.name,leader.email
        LIMIT 1`,
      [result.insertId],
    );
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "LEADER_ALREADY_HAS_TEAM" },
        { status: 409 },
      );
    }
    throw error;
  }
}
