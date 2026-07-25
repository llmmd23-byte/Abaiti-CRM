import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getSession, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

type SaleRow = RowDataPacket & {
  id: number;
  affiliate_user_id: number | null;
  manager_id: number | null;
  CompanyID: number | null;
  sale_amount: number;
  currency: string;
  level: string | null;
  comission_percentage: number | null;
};

const SALES_COMMISSION_TYPE = "\u0639\u0645\u0648\u0644\u0629 \u0645\u0628\u064a\u0639\u0627\u062a";
const SUPERVISION_COMMISSION_TYPE = "\u0639\u0645\u0648\u0644\u0629 \u0625\u0634\u0631\u0627\u0641";
const SUPERVISION_COMMISSION_PERCENT = 5;

async function ensureCommissionTypeColumn() {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'commissions' AND COLUMN_NAME = 'commission_type' LIMIT 1",
  );
  if (!columns.length) {
    await db.execute(
      "ALTER TABLE commissions ADD COLUMN commission_type VARCHAR(80) NOT NULL DEFAULT 'عمولة مبيعات' AFTER currency",
    );
  }
}

async function ensureUserCommissionPercentageColumn() {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'comission_percentage' LIMIT 1",
  );
  if (!columns.length) {
    await db.execute(
      "ALTER TABLE users ADD COLUMN comission_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00 AFTER level",
    );
  }
}

function levelForSalesCount(count: number) {
  if (count >= 90) return "محترف ماسي";
  if (count >= 70) return "محترف ذهبي";
  if (count >= 50) return "محترف فضي";
  if (count >= 30) return "محترف";
  if (count >= 20) return "منجز";
  if (count >= 10) return "نشيط";
  return "مبتدئ";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!isAdminSession(session))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await hasPermission(session, "table.commissions", "can_create")))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  await ensureCommissionTypeColumn();
  await ensureUserCommissionPercentageColumn();

  const body = await request.json().catch(() => ({}));
  const saleId = Number(body.sale_id);
  if (!Number.isInteger(saleId) || saleId <= 0) {
    return NextResponse.json({ error: "INVALID_COMMISSION" }, { status: 400 });
  }

  const [sales] = await db.execute<SaleRow[]>(
    "SELECT s.id,s.affiliate_user_id,s.sale_amount,s.currency,u.level,u.manager_id,u.CompanyID,u.comission_percentage FROM sales s LEFT JOIN users u ON u.id=s.affiliate_user_id WHERE s.id = ? LIMIT 1",
    [saleId],
  );
  const sale = sales[0];
  if (!sale || !sale.affiliate_user_id)
    return NextResponse.json({ error: "SALE_NOT_FOUND" }, { status: 404 });

  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [Number(session.sub)],
  );
  const adminCompanyId = adminRows[0]?.CompanyID ?? null;
  const saleBelongsToAdminCompany =
    adminCompanyId !== null && adminCompanyId !== undefined
      ? Number(sale.CompanyID) === Number(adminCompanyId) ||
        Number(sale.affiliate_user_id) === Number(session.sub)
      : Number(sale.affiliate_user_id) === Number(session.sub);
  if (!saleBelongsToAdminCompany) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM commissions WHERE sale_id = ? AND commission_type = ? LIMIT 1",
    [saleId, SALES_COMMISSION_TYPE],
  );
  if (existing.length)
    return NextResponse.json(
      { error: "COMMISSION_ALREADY_EXISTS" },
      { status: 409 },
    );

  const connection = await db.getConnection();
  let result!: ResultSetHeader;
  try {
    await connection.beginTransaction();

    const [salesCountRows] = await connection.execute<RowDataPacket[]>(
      "SELECT COUNT(*) total FROM sales WHERE affiliate_user_id = ?",
      [sale.affiliate_user_id],
    );
    const level = levelForSalesCount(Number(salesCountRows[0]?.total ?? 0));
    const commissionPercent = Number(sale.comission_percentage ?? 20);
    if (
      !Number.isFinite(commissionPercent) ||
      commissionPercent < 0 ||
      commissionPercent > 100
    ) {
      throw new Error("INVALID_USER_COMMISSION_PERCENTAGE");
    }
    await connection.execute("UPDATE users SET level = ? WHERE id = ?", [
      level,
      sale.affiliate_user_id,
    ]);
    const commissionAmount =
      Math.round(Number(sale.sale_amount) * commissionPercent) / 100;
    const [insertResult] = await connection.execute<ResultSetHeader>(
      "INSERT INTO commissions (sale_id,affiliate_user_id,commission_percent,commission_amount,currency,commission_type,status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [
        sale.id,
        sale.affiliate_user_id,
        commissionPercent,
        commissionAmount,
        sale.currency,
        SALES_COMMISSION_TYPE,
      ],
    );
    result = insertResult;

    if (sale.manager_id && Number(sale.manager_id) !== Number(sale.affiliate_user_id)) {
      const [existingSupervisor] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM commissions WHERE sale_id = ? AND commission_type = ? LIMIT 1",
        [sale.id, SUPERVISION_COMMISSION_TYPE],
      );
      if (!existingSupervisor.length) {
        const supervisionAmount =
          Math.round(Number(sale.sale_amount) * SUPERVISION_COMMISSION_PERCENT) /
          100;
        await connection.execute(
          "INSERT INTO commissions (sale_id,affiliate_user_id,commission_percent,commission_amount,currency,commission_type,status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
          [
            sale.id,
            sale.manager_id,
            SUPERVISION_COMMISSION_PERCENT,
            supervisionAmount,
            sale.currency,
            SUPERVISION_COMMISSION_TYPE,
          ],
        );
      }
    }

    await connection.execute("UPDATE sales SET status = 'approved' WHERE id = ?", [
      sale.id,
    ]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return NextResponse.json(
    { data: { id: result.insertId, sale_status: "approved" } },
    { status: 201 },
  );
}
