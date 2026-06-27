import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

type QuoteRow = RowDataPacket & {
  id: number;
  lead_id: number | null;
  product_id: number | null;
  affiliate_user_id: number | null;
  amount: number;
  currency: string;
  status: string;
  sales_invoice_number: string | null;
};

async function ensureSalesInvoiceColumn() {
  const [quoteColumns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotes' AND COLUMN_NAME = 'sales_invoice_number' LIMIT 1",
  );
  if (!quoteColumns.length) {
    await db.execute(
      "ALTER TABLE quotes ADD COLUMN sales_invoice_number VARCHAR(80) NULL",
    );
  }

  const [salesColumns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'sales_invoice_number' LIMIT 1",
  );
  if (!salesColumns.length) {
    await db.execute(
      "ALTER TABLE sales ADD COLUMN sales_invoice_number VARCHAR(80) NULL AFTER id",
    );
    await db.execute(
      "UPDATE sales SET sales_invoice_number = CONCAT('S-', id) WHERE sales_invoice_number IS NULL",
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
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await hasPermission(session, "table.sales", "can_create")))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const quoteId = Number(body.quote_id);
  if (!Number.isInteger(quoteId) || quoteId <= 0)
    return NextResponse.json({ error: "INVALID_QUOTE" }, { status: 400 });

  await ensureSalesInvoiceColumn();

  const [quotes] = await db.execute<QuoteRow[]>(
    "SELECT id,lead_id,product_id,affiliate_user_id,amount,currency,status,sales_invoice_number FROM quotes WHERE id = ? LIMIT 1",
    [quoteId],
  );
  const quote = quotes[0];
  if (!quote)
    return NextResponse.json({ error: "QUOTE_NOT_FOUND" }, { status: 404 });
  if (quote.status !== "paid")
    return NextResponse.json({ error: "QUOTE_NOT_PAID" }, { status: 409 });
  if (quote.sales_invoice_number)
    return NextResponse.json({ error: "SALE_ALREADY_EXISTS" }, { status: 409 });

  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT id,sales_invoice_number FROM sales WHERE quote_id = ? LIMIT 1",
    [quoteId],
  );
  if (existing.length)
    return NextResponse.json({ error: "SALE_ALREADY_EXISTS" }, { status: 409 });

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO sales (quote_id,lead_id,affiliate_user_id,product_id,sale_amount,currency,status,sold_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())",
    [
      quote.id,
      quote.lead_id,
      quote.affiliate_user_id,
      quote.product_id,
      quote.amount,
      quote.currency,
    ],
  );
  const salesInvoiceNumber = `S-${result.insertId}`;
  await db.execute(
    "UPDATE sales SET sales_invoice_number = ? WHERE id = ? AND sales_invoice_number IS NULL",
    [salesInvoiceNumber, result.insertId],
  );
  await db.execute(
    "UPDATE quotes SET sales_invoice_number = ? WHERE id = ? AND sales_invoice_number IS NULL",
    [salesInvoiceNumber, quote.id],
  );
  const [salesCountRows] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) total FROM sales WHERE affiliate_user_id = ?",
    [quote.affiliate_user_id],
  );
  const level = levelForSalesCount(Number(salesCountRows[0]?.total ?? 0));
  await db.execute("UPDATE users SET level = ? WHERE id = ?", [
    level,
    quote.affiliate_user_id,
  ]);

  return NextResponse.json(
    {
      data: {
        id: result.insertId,
        sales_invoice_number: salesInvoiceNumber,
        level,
      },
    },
    { status: 201 },
  );
}
