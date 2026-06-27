import {mkdir, writeFile} from "fs/promises";
import path from "path";
import {randomUUID} from "crypto";
import {NextResponse} from "next/server";
import type {ResultSetHeader, RowDataPacket} from "mysql2";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
import {hasPermission} from "@/lib/permissions";

type QuoteRow = RowDataPacket & {id: number; status: string};

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);
const extensionByType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf"
};

async function ensureReceiptColumn() {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotes' AND COLUMN_NAME = 'payment_receipt_url' LIMIT 1"
  );
  if (!columns.length) await db.execute("ALTER TABLE quotes ADD COLUMN payment_receipt_url VARCHAR(500) NULL");
}

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
  if (session.role !== "admin") return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  if (!(await hasPermission(session, "table.quotes", "can_edit")))
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({error: "INVALID_ID"}, {status: 422});

  const formData = await request.formData().catch(() => null);
  const receipt = formData?.get("receipt");
  if (!(receipt instanceof File) || receipt.size < 1) return NextResponse.json({error: "MISSING_FILE"}, {status: 400});
  if (!allowedTypes.has(receipt.type)) return NextResponse.json({error: "INVALID_FILE_TYPE"}, {status: 415});
  if (receipt.size > 10 * 1024 * 1024) return NextResponse.json({error: "FILE_TOO_LARGE"}, {status: 413});

  await ensureReceiptColumn();

  const [quotes] = await db.execute<QuoteRow[]>("SELECT id,status FROM quotes WHERE id = ? LIMIT 1", [id]);
  const quote = quotes[0];
  if (!quote) return NextResponse.json({error: "QUOTE_NOT_FOUND"}, {status: 404});
  if (quote.status !== "accepted") return NextResponse.json({error: "QUOTE_NOT_ACCEPTED"}, {status: 409});

  const uploadDir = path.join(process.cwd(), "public", "uploads", "payment-receipts");
  await mkdir(uploadDir, {recursive: true});
  const extension = extensionByType[receipt.type] ?? (path.extname(receipt.name).toLowerCase() || ".bin");
  const filename = `quote-${id}-${randomUUID()}${extension}`;
  const uploadPath = path.join(uploadDir, filename);
  const bytes = Buffer.from(await receipt.arrayBuffer());
  await writeFile(uploadPath, bytes);

  const receiptUrl = `/uploads/payment-receipts/${filename}`;
  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE quotes SET payment_receipt_url = ?, status = 'paid' WHERE id = ? AND status = 'accepted'",
    [receiptUrl, id]
  );
  if (!result.affectedRows) return NextResponse.json({error: "QUOTE_NOT_ACCEPTED"}, {status: 409});

  return NextResponse.json({data: {payment_receipt_url: receiptUrl, status: "paid"}});
}
