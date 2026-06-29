import {NextResponse} from "next/server";
import type {ResultSetHeader, RowDataPacket} from "mysql2";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
import {hasPermission} from "@/lib/permissions";

export async function PUT(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
  if (session.role !== "admin") return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  if (!(await hasPermission(session, "table.commissions", "can_approve")))
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({error: "INVALID_ID"}, {status: 422});

  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [Number(session.sub)],
  );
  const adminCompanyId = adminRows[0]?.CompanyID ?? null;
  const companyScope =
    adminCompanyId !== null && adminCompanyId !== undefined
      ? "(recipient.CompanyID = ? OR recipient.id = ?) AND (sale_user.CompanyID = ? OR sale_user.id = ?)"
      : "recipient.id = ? AND sale_user.id = ?";
  const companyParams =
    adminCompanyId !== null && adminCompanyId !== undefined
      ? [adminCompanyId, Number(session.sub), adminCompanyId, Number(session.sub)]
      : [Number(session.sub), Number(session.sub)];
  const [visibleRows] = await db.execute<RowDataPacket[]>(
    `SELECT c.id
       FROM commissions c
       JOIN users recipient ON recipient.id = c.affiliate_user_id
       JOIN sales s ON s.id = c.sale_id
       JOIN users sale_user ON sale_user.id = s.affiliate_user_id
      WHERE c.id = ? AND ${companyScope}
      LIMIT 1`,
    [id, ...companyParams],
  );
  if (!visibleRows.length) return NextResponse.json({error: "COMMISSION_NOT_FOUND"}, {status: 404});

  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE commissions SET status='approved', approved_at=NOW() WHERE id=? AND status='pending'",
    [id]
  );
  if (!result.affectedRows) return NextResponse.json({error: "COMMISSION_NOT_PENDING"}, {status: 409});
  return NextResponse.json({ok: true});
}
