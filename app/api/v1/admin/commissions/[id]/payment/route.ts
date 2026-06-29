import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

async function ensurePaymentReferenceColumn() {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'commissions' AND COLUMN_NAME = 'payment_reference' LIMIT 1",
  );
  if (!columns.length) {
    await db.execute(
      "ALTER TABLE commissions ADD COLUMN payment_reference VARCHAR(255) NULL",
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await hasPermission(session, "table.commissions", "can_edit")))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const commissionId = Number((await params).id);
  const body = await request.json().catch(() => ({}));
  const paymentReference = String(body.payment_reference ?? "").trim();
  if (!Number.isInteger(commissionId) || commissionId < 1) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 422 });
  }
  if (!paymentReference || paymentReference.length > 255) {
    return NextResponse.json(
      { error: "INVALID_PAYMENT_REFERENCE" },
      { status: 422 },
    );
  }

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
    [commissionId, ...companyParams],
  );
  if (!visibleRows.length) {
    return NextResponse.json(
      { error: "COMMISSION_NOT_FOUND" },
      { status: 404 },
    );
  }

  await ensurePaymentReferenceColumn();
  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE commissions SET payment_reference = ?, status = 'paid', paid_at = COALESCE(paid_at, NOW()) WHERE id = ? AND status = 'approved'",
    [paymentReference, commissionId],
  );
  if (!result.affectedRows) {
    const [commissions] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM commissions WHERE id = ? LIMIT 1",
      [commissionId],
    );
    if (commissions.length) {
      return NextResponse.json(
        { error: "COMMISSION_NOT_APPROVED" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "COMMISSION_NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      id: commissionId,
      payment_reference: paymentReference,
      status: "paid",
    },
  });
}
