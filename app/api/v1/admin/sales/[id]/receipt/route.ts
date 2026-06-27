import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const extensionByType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

async function ensureReceiptColumn() {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'receipt_url' LIMIT 1",
  );
  if (!columns.length) {
    await db.execute(
      "ALTER TABLE sales ADD COLUMN receipt_url VARCHAR(500) NULL",
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!(await hasPermission(session, "table.sales", "can_edit")))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const saleId = Number((await params).id);
  if (!Number.isInteger(saleId) || saleId < 1) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 422 });
  }

  const formData = await request.formData().catch(() => null);
  const receipt = formData?.get("receipt");
  if (!(receipt instanceof File) || receipt.size < 1) {
    return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
  }
  if (!allowedTypes.has(receipt.type)) {
    return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 415 });
  }
  if (receipt.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
  }

  await ensureReceiptColumn();
  const [sales] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM sales WHERE id = ? LIMIT 1",
    [saleId],
  );
  if (!sales.length)
    return NextResponse.json({ error: "SALE_NOT_FOUND" }, { status: 404 });

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "sales-receipts",
  );
  await mkdir(uploadDir, { recursive: true });
  const extension =
    extensionByType[receipt.type] ??
    (path.extname(receipt.name).toLowerCase() || ".bin");
  const filename = `sale-${saleId}-${randomUUID()}${extension}`;
  await writeFile(
    path.join(uploadDir, filename),
    Buffer.from(await receipt.arrayBuffer()),
  );

  const receiptUrl = `/uploads/sales-receipts/${filename}`;
  await db.execute<ResultSetHeader>(
    "UPDATE sales SET receipt_url = ? WHERE id = ?",
    [receiptUrl, saleId],
  );

  return NextResponse.json({ data: { receipt_url: receiptUrl } });
}
