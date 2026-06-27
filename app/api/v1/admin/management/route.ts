import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

async function ensureQuoteReceiptColumn() {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotes' AND COLUMN_NAME = 'payment_receipt_url' LIMIT 1",
  );
  if (!columns.length)
    await db.execute(
      "ALTER TABLE quotes ADD COLUMN payment_receipt_url VARCHAR(500) NULL",
    );

  const [invoiceColumns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotes' AND COLUMN_NAME = 'sales_invoice_number' LIMIT 1",
  );
  if (!invoiceColumns.length)
    await db.execute(
      "ALTER TABLE quotes ADD COLUMN sales_invoice_number VARCHAR(80) NULL",
    );

  const [salesColumns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'receipt_url' LIMIT 1",
  );
  if (!salesColumns.length)
    await db.execute(
      "ALTER TABLE sales ADD COLUMN receipt_url VARCHAR(500) NULL",
    );

  const [salesInvoiceColumns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'sales_invoice_number' LIMIT 1",
  );
  if (!salesInvoiceColumns.length) {
    await db.execute(
      "ALTER TABLE sales ADD COLUMN sales_invoice_number VARCHAR(80) NULL AFTER id",
    );
    await db.execute(
      "UPDATE sales SET sales_invoice_number = CONCAT('S-', id) WHERE sales_invoice_number IS NULL",
    );
  }

  const [commissionColumns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'commissions' AND COLUMN_NAME = 'payment_reference' LIMIT 1",
  );
  if (!commissionColumns.length)
    await db.execute(
      "ALTER TABLE commissions ADD COLUMN payment_reference VARCHAR(255) NULL",
    );

  const [commissionTypeColumns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'commissions' AND COLUMN_NAME = 'commission_type' LIMIT 1",
  );
  if (!commissionTypeColumns.length)
    await db.execute(
      "ALTER TABLE commissions ADD COLUMN commission_type VARCHAR(80) NOT NULL DEFAULT 'عمولة مبيعات' AFTER currency",
    );
}

async function ensureSupportTicketEventsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS support_ticket_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      ticket_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      actor_user_id BIGINT UNSIGNED NULL,
      event_type VARCHAR(80) NOT NULL,
      old_status VARCHAR(80) NULL,
      new_status VARCHAR(80) NULL,
      note TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_support_ticket_events_ticket_id (ticket_id),
      INDEX idx_support_ticket_events_user_id (user_id),
      INDEX idx_support_ticket_events_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  await ensureQuoteReceiptColumn();
  await ensureSupportTicketEventsTable();

  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [Number(session.sub)],
  );
  const adminCompanyId = adminRows[0]?.CompanyID ?? null;
  const adminUserId = Number(session.sub);
  const usersWhereClause =
    adminCompanyId !== null && adminCompanyId !== undefined
      ? "(CompanyID = ? OR CompanyID = ? OR id = ?)"
      : "id = ?";
  const usersWhereValues =
    adminCompanyId !== null && adminCompanyId !== undefined
      ? [adminCompanyId, adminUserId, adminUserId]
      : [adminUserId];

  const [
    [users],
    [tickets],
    [products],
    [content],
    [industries],
    [clients],
    [demos],
    [quotes],
    [sales],
    [commissions],
    [ticketEvents],
  ] = await Promise.all([
    db.execute<RowDataPacket[]>(
      `SELECT id,name,email,username,phone,role,status,is_active,CompanyID AS company_id,created_at,last_login_at
         FROM users
        WHERE ${usersWhereClause}
        ORDER BY created_at DESC`,
      usersWhereValues,
    ),
    db.execute<RowDataPacket[]>(
      "SELECT id,ticket_number,category,subject,details,notes,status,user_id,created_at FROM support_tickets ORDER BY created_at DESC LIMIT 250",
    ),
    db.execute<RowDataPacket[]>(
      "SELECT id,name,name_en,slug,base_price,currency,status,created_at FROM products ORDER BY created_at DESC LIMIT 250",
    ),
    db.execute<RowDataPacket[]>(
      "SELECT id,title,asset_type,status,url,created_at FROM educational_assets ORDER BY created_at DESC LIMIT 250",
    ),
    db.execute<RowDataPacket[]>(
      "SELECT id,name,slug,description,status,created_at FROM industries ORDER BY created_at DESC LIMIT 250",
    ),
    db.execute<RowDataPacket[]>(
      `SELECT l.id,l.name,l.company_name,l.phone,l.email,l.stage,l.industry_id,l.address,l.requirements,l.created_at,
              i.name industry_name,i.name_en industry_name_en,
              COALESCE(NULLIF(u.name, ''), NULLIF(u.username, ''), NULLIF(u.email, '')) affiliate_user_name
         FROM leads l
         LEFT JOIN industries i ON i.id=l.industry_id
         LEFT JOIN users u ON u.id=l.affiliate_user_id
        ORDER BY l.created_at DESC LIMIT 250`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT d.id,d.contact_name,d.company_name,d.phone,d.status,d.created_at,d.affiliate_user_id,
              COALESCE(NULLIF(u.name, ''), NULLIF(u.username, ''), NULLIF(u.email, '')) affiliate_user_name
         FROM demo_requests d
         LEFT JOIN users u ON u.id=d.affiliate_user_id
        ORDER BY d.created_at DESC LIMIT 250`,
    ),
    db.execute<RowDataPacket[]>(
       `SELECT q.id,q.quote_number,q.amount,q.currency,q.status,q.valid_until,q.payment_receipt_url,q.sales_invoice_number,q.created_at,q.affiliate_user_id,l.name customer_name,p.name product_name,p.name_en product_name_en,p.base_price product_base_price,
               COALESCE(NULLIF(u.name, ''), NULLIF(u.username, ''), NULLIF(u.email, '')) affiliate_user_name
         FROM quotes q
         LEFT JOIN leads l ON l.id=q.lead_id
         LEFT JOIN products p ON p.id=q.product_id
         LEFT JOIN users u ON u.id=q.affiliate_user_id
        ORDER BY q.created_at DESC LIMIT 250`,
    ),
    db.execute<RowDataPacket[]>(
       `SELECT s.id,s.sales_invoice_number,s.sale_amount,s.currency,s.status,s.receipt_url,s.sold_at,s.created_at,s.affiliate_user_id,c.id commission_id,l.name customer_name,p.name product_name,p.name_en product_name_en,
               COALESCE(NULLIF(u.name, ''), NULLIF(u.username, ''), NULLIF(u.email, '')) affiliate_user_name,u.level affiliate_user_level,COALESCE(sc.sale_count,0) affiliate_sales_count,q.quote_number
         FROM sales s
         LEFT JOIN leads l ON l.id=s.lead_id
         LEFT JOIN products p ON p.id=s.product_id
         LEFT JOIN users u ON u.id=s.affiliate_user_id
         LEFT JOIN (SELECT affiliate_user_id,COUNT(*) sale_count FROM sales GROUP BY affiliate_user_id) sc ON sc.affiliate_user_id=s.affiliate_user_id
         LEFT JOIN quotes q ON q.id=s.quote_id
         LEFT JOIN (SELECT sale_id,MIN(id) id FROM commissions GROUP BY sale_id) c ON c.sale_id=s.id
       ORDER BY s.created_at DESC LIMIT 250`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT c.id,c.sale_id,s.sales_invoice_number,c.affiliate_user_id,c.commission_amount,c.commission_percent,c.currency,c.commission_type,c.status,c.payment_reference,c.created_at,c.approved_at,c.paid_at,u.name affiliate_user_name
         FROM commissions c
         LEFT JOIN sales s ON s.id=c.sale_id
         LEFT JOIN users u ON u.id=c.affiliate_user_id
        ORDER BY c.created_at DESC LIMIT 250`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT e.id,e.ticket_id,e.user_id,e.actor_user_id,e.event_type,e.old_status,e.new_status,e.note,e.created_at,u.name actor_name
         FROM support_ticket_events e
         LEFT JOIN users u ON u.id=e.actor_user_id
        ORDER BY e.created_at ASC LIMIT 1000`,
    ),
  ]);

  return NextResponse.json({
    data: {
      users,
      tickets,
      products,
      content,
      industries,
      clients,
      demos,
      quotes,
      sales,
      commissions,
      ticketEvents,
    },
  });
}
