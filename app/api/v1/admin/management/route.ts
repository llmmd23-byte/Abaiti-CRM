import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

const globalForAdminManagement = globalThis as typeof globalThis & {
  adminManagementSchemaReady?: Promise<void>;
};

async function addColumnIfMissing(
  tableName: string,
  columnName: string,
  alterSql: string,
) {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
    [tableName, columnName],
  );

  if (columns.length) return;

  try {
    await db.execute(alterSql);
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_FIELDNAME") return;
    throw error;
  }
}

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

async function ensureTagTables() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS tag_types (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company_id BIGINT UNSIGNED NOT NULL,
      type_name VARCHAR(120) NOT NULL,
      type_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_tag_types_company_name (company_id, type_name),
      KEY idx_tag_types_company_id (company_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  await addColumnIfMissing(
    "tag_types",
    "company_id",
    "ALTER TABLE tag_types ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id",
  );
  await db.execute(
    `UPDATE tag_types tt
      JOIN users u ON u.id = tt.affiliate_user_id
       SET tt.company_id = COALESCE(u.CompanyID, u.id)
     WHERE tt.company_id IS NULL`,
  ).catch((error) => {
    if ((error as { code?: string }).code !== "ER_BAD_FIELD_ERROR") throw error;
  });
  await db.execute("UPDATE tag_types SET company_id = 0 WHERE company_id IS NULL");
  await db.execute("ALTER TABLE tag_types MODIFY company_id BIGINT UNSIGNED NOT NULL");

  const [tagTables] = await db.execute<RowDataPacket[]>(
    `SELECT TABLE_NAME
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('tags', 'lead_tag_assignments')`,
  );
  const existingTagTables = new Set(tagTables.map((row) => String(row.TABLE_NAME)));
  if (existingTagTables.has("tags")) {
    await db.execute(
      `UPDATE tags t
        JOIN tag_types duplicate_type ON duplicate_type.id = t.tag_type_id
        JOIN tag_types canonical_type
          ON canonical_type.company_id = duplicate_type.company_id
         AND canonical_type.type_name = duplicate_type.type_name
         AND canonical_type.id < duplicate_type.id
         SET t.tag_type_id = canonical_type.id`,
    );
  }
  if (existingTagTables.has("lead_tag_assignments")) {
    await db.execute(
      `UPDATE lead_tag_assignments lta
        JOIN tag_types duplicate_type ON duplicate_type.id = lta.tag_type_id
        JOIN tag_types canonical_type
          ON canonical_type.company_id = duplicate_type.company_id
         AND canonical_type.type_name = duplicate_type.type_name
         AND canonical_type.id < duplicate_type.id
         SET lta.tag_type_id = canonical_type.id`,
    );
  }
  await db.execute(
    `DELETE duplicate_type
       FROM tag_types duplicate_type
       JOIN tag_types canonical_type
         ON canonical_type.company_id = duplicate_type.company_id
        AND canonical_type.type_name = duplicate_type.type_name
        AND canonical_type.id < duplicate_type.id`,
  );

  const [oldForeignKeys] = await db.execute<RowDataPacket[]>(
    `SELECT CONSTRAINT_NAME
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tag_types'
        AND COLUMN_NAME = 'affiliate_user_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL`,
  );
  for (const row of oldForeignKeys) {
    await db.execute(
      `ALTER TABLE tag_types DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
    );
  }

  const [oldIndexes] = await db.execute<RowDataPacket[]>(
    `SELECT DISTINCT INDEX_NAME
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tag_types'
        AND COLUMN_NAME = 'affiliate_user_id'
        AND INDEX_NAME <> 'PRIMARY'`,
  );
  for (const row of oldIndexes) {
    await db.execute(`ALTER TABLE tag_types DROP INDEX \`${row.INDEX_NAME}\``);
  }

  const [companyIndex] = await db.execute<RowDataPacket[]>(
    `SELECT 1
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tag_types'
        AND INDEX_NAME = 'idx_tag_types_company_id'
      LIMIT 1`,
  );
  if (!companyIndex.length) {
    await db.execute("ALTER TABLE tag_types ADD INDEX idx_tag_types_company_id (company_id)");
  }

  const [companyUnique] = await db.execute<RowDataPacket[]>(
    `SELECT 1
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tag_types'
        AND INDEX_NAME = 'uq_tag_types_company_name'
      LIMIT 1`,
  );
  if (!companyUnique.length) {
    await db.execute(
      "ALTER TABLE tag_types ADD UNIQUE KEY uq_tag_types_company_name (company_id, type_name)",
    );
  }

  const [affiliateColumns] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tag_types'
        AND COLUMN_NAME = 'affiliate_user_id'
      LIMIT 1`,
  );
  if (affiliateColumns.length) {
    await db.execute("ALTER TABLE tag_types DROP COLUMN affiliate_user_id");
  }
  await addColumnIfMissing(
    "tags",
    "tag_type_id",
    "ALTER TABLE tags ADD COLUMN tag_type_id BIGINT UNSIGNED NULL AFTER id",
  );
}

async function ensureAdminManagementSchema() {
  globalForAdminManagement.adminManagementSchemaReady ??= (async () => {
    await addColumnIfMissing(
      "quotes",
      "payment_receipt_url",
      "ALTER TABLE quotes ADD COLUMN payment_receipt_url VARCHAR(500) NULL",
    );
    await addColumnIfMissing(
      "quotes",
      "sales_invoice_number",
      "ALTER TABLE quotes ADD COLUMN sales_invoice_number VARCHAR(80) NULL",
    );
    await addColumnIfMissing(
      "sales",
      "receipt_url",
      "ALTER TABLE sales ADD COLUMN receipt_url VARCHAR(500) NULL",
    );

    const [salesInvoiceColumns] = await db.execute<RowDataPacket[]>(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'sales_invoice_number' LIMIT 1",
    );
    if (!salesInvoiceColumns.length) {
      await addColumnIfMissing(
        "sales",
        "sales_invoice_number",
        "ALTER TABLE sales ADD COLUMN sales_invoice_number VARCHAR(80) NULL AFTER id",
      );
      await db.execute(
        "UPDATE sales SET sales_invoice_number = CONCAT('S-', id) WHERE sales_invoice_number IS NULL",
      );
    }

    await addColumnIfMissing(
      "commissions",
      "payment_reference",
      "ALTER TABLE commissions ADD COLUMN payment_reference VARCHAR(255) NULL",
    );
    await addColumnIfMissing(
      "commissions",
      "commission_type",
      "ALTER TABLE commissions ADD COLUMN commission_type VARCHAR(80) NOT NULL DEFAULT 'عمولة مبيعات' AFTER currency",
    );
    await addColumnIfMissing(
      "users",
      "comission_percentage",
      "ALTER TABLE users ADD COLUMN comission_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00 AFTER level",
    );
    await ensureSupportTicketEventsTable();
    await ensureTagTables();
  })();

  return globalForAdminManagement.adminManagementSchemaReady;
}

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const canViewManagement = (
    await Promise.all([
      hasPermission(session, "page.admin.dashboard", "can_view"),
      hasPermission(session, "page.admin.tickets", "can_view"),
      hasPermission(session, "page.admin.accounts", "can_view"),
      hasPermission(session, "page.admin.products", "can_view"),
      hasPermission(session, "page.admin.industries", "can_view"),
      hasPermission(session, "page.admin.permissions", "can_view"),
    ])
  ).some(Boolean);
  if (!canViewManagement)
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  await ensureAdminManagementSchema();

  const [adminRows] = await db.execute<RowDataPacket[]>(
    "SELECT CompanyID FROM users WHERE id = ? LIMIT 1",
    [Number(session.sub)],
  );
  const adminCompanyId = adminRows[0]?.CompanyID ?? null;
  const adminUserId = Number(session.sub);
  const userScopeClause = (alias: string) =>
    adminCompanyId !== null && adminCompanyId !== undefined
      ? `(${alias}.CompanyID = ? OR ${alias}.id = ?)`
      : `${alias}.id = ?`;
  const userScopeParams =
    adminCompanyId !== null && adminCompanyId !== undefined
      ? [adminCompanyId, adminUserId]
      : [adminUserId];

  const [users] = await db.execute<RowDataPacket[]>(
    `SELECT u.id,u.name,u.email,u.phone,u.role_id,COALESCE(r.slug,'affiliate') role,COALESCE(r.role_type,'user') role_type,u.status,u.is_active,u.CompanyID AS company_id,u.created_at,u.last_login_at
        FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
        WHERE ${userScopeClause("u")}
        ORDER BY u.created_at DESC`,
    userScopeParams,
  );
  const [roles] = await db.execute<RowDataPacket[]>(
    "SELECT id,slug,name_ar,name_en,role_type,is_system,is_active FROM roles WHERE is_active = 1 ORDER BY role_type ASC,id ASC",
  );
  const [tickets] = await db.execute<RowDataPacket[]>(
    `SELECT t.id,t.ticket_number,t.category,t.subject,t.details,t.notes,t.status,t.user_id,t.created_at
       FROM support_tickets t
       JOIN users u ON u.id = t.user_id
      WHERE ${userScopeClause("u")}
      ORDER BY t.created_at DESC LIMIT 250`,
    userScopeParams,
  );
  const [products] = await db.execute<RowDataPacket[]>(
    "SELECT id,name,name_en,slug,base_price,currency,status,created_at FROM products ORDER BY created_at DESC LIMIT 250",
  );
  const [content] = await db.execute<RowDataPacket[]>(
    "SELECT id,title,asset_type,status,url,created_at FROM educational_assets ORDER BY created_at DESC LIMIT 250",
  );
  const [industries] = await db.execute<RowDataPacket[]>(
    "SELECT id,name,slug,description,status,created_at FROM industries ORDER BY created_at DESC LIMIT 250",
  );
  const [clients] = await db.execute<RowDataPacket[]>(
    `SELECT l.id,l.name,l.company_name,l.phone,l.email,l.stage,l.industry_id,l.address,l.requirements,l.created_at,
              i.name industry_name,i.name_en industry_name_en,
              COALESCE(NULLIF(u.name, ''), NULLIF(u.email, '')) affiliate_user_name,
              (SELECT GROUP_CONCAT(DISTINCT t.tag_type_id)
                 FROM lead_tag_assignments lta
                 JOIN tags t ON t.id = lta.tag_id
                WHERE lta.lead_id = l.id) tag_type_ids,
              (SELECT GROUP_CONCAT(DISTINCT lta.tag_id)
                 FROM lead_tag_assignments lta
                WHERE lta.lead_id = l.id) tag_ids,
              (SELECT GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_name SEPARATOR ', ')
                 FROM lead_tag_assignments lta
                 JOIN tags t ON t.id = lta.tag_id
                WHERE lta.lead_id = l.id) tag_names
         FROM leads l
         LEFT JOIN industries i ON i.id=l.industry_id
         JOIN users u ON u.id=l.affiliate_user_id
        WHERE ${userScopeClause("u")}
        ORDER BY l.created_at DESC LIMIT 250`,
    userScopeParams,
  );
  const [demos] = await db.execute<RowDataPacket[]>(
    `SELECT d.id,d.contact_name,d.company_name,d.phone,d.status,d.created_at,d.affiliate_user_id,
              COALESCE(NULLIF(u.name, ''), NULLIF(u.email, '')) affiliate_user_name
         FROM demo_requests d
         JOIN users u ON u.id=d.affiliate_user_id
        WHERE ${userScopeClause("u")}
        ORDER BY d.created_at DESC LIMIT 250`,
    userScopeParams,
  );
  const [quotes] = await db.execute<RowDataPacket[]>(
    `SELECT q.id,q.quote_number,q.amount,q.currency,q.status,q.valid_until,q.payment_receipt_url,q.sales_invoice_number,q.created_at,q.affiliate_user_id,l.name customer_name,p.name product_name,p.name_en product_name_en,p.base_price product_base_price,
               COALESCE(NULLIF(u.name, ''), NULLIF(u.email, '')) affiliate_user_name
         FROM quotes q
         LEFT JOIN leads l ON l.id=q.lead_id
         LEFT JOIN products p ON p.id=q.product_id
         JOIN users u ON u.id=q.affiliate_user_id
        WHERE ${userScopeClause("u")}
        ORDER BY q.created_at DESC LIMIT 250`,
    userScopeParams,
  );
  const [sales] = await db.execute<RowDataPacket[]>(
    `SELECT s.id,s.sales_invoice_number,s.sale_amount,s.currency,s.status,s.receipt_url,s.sold_at,s.created_at,s.affiliate_user_id,c.id commission_id,l.name customer_name,p.name product_name,p.name_en product_name_en,
               COALESCE(NULLIF(u.name, ''), NULLIF(u.email, '')) affiliate_user_name,u.level affiliate_user_level,COALESCE(u.comission_percentage,20) affiliate_comission_percentage,COALESCE(sc.sale_count,0) affiliate_sales_count,q.quote_number
         FROM sales s
         LEFT JOIN leads l ON l.id=s.lead_id
         LEFT JOIN products p ON p.id=s.product_id
         JOIN users u ON u.id=s.affiliate_user_id
         LEFT JOIN (SELECT affiliate_user_id,COUNT(*) sale_count FROM sales GROUP BY affiliate_user_id) sc ON sc.affiliate_user_id=s.affiliate_user_id
         LEFT JOIN quotes q ON q.id=s.quote_id
         LEFT JOIN (SELECT sale_id,MIN(id) id FROM commissions GROUP BY sale_id) c ON c.sale_id=s.id
        WHERE ${userScopeClause("u")}
       ORDER BY s.created_at DESC LIMIT 250`,
    userScopeParams,
  );
  const [commissions] = await db.execute<RowDataPacket[]>(
    `SELECT c.id,c.sale_id,s.sales_invoice_number,c.affiliate_user_id,c.commission_amount,c.commission_percent,c.currency,c.commission_type,c.status,c.payment_reference,c.created_at,c.approved_at,c.paid_at,u.name affiliate_user_name
         FROM commissions c
         JOIN sales s ON s.id=c.sale_id
         JOIN users u ON u.id=c.affiliate_user_id
         JOIN users sale_user ON sale_user.id=s.affiliate_user_id
        WHERE ${userScopeClause("u")}
          AND ${userScopeClause("sale_user")}
        ORDER BY c.created_at DESC LIMIT 250`,
    [...userScopeParams, ...userScopeParams],
  );
  const [ticketEvents] = await db.execute<RowDataPacket[]>(
    `SELECT e.id,e.ticket_id,e.user_id,e.actor_user_id,e.event_type,e.old_status,e.new_status,e.note,e.created_at,u.name actor_name
         FROM support_ticket_events e
         LEFT JOIN users u ON u.id=e.actor_user_id
         JOIN users ticket_user ON ticket_user.id=e.user_id
        WHERE ${userScopeClause("ticket_user")}
        ORDER BY e.created_at ASC LIMIT 1000`,
    userScopeParams,
  );
  const [tagStats] = await db.execute<RowDataPacket[]>(
    `SELECT
        tt.id tag_type_id,
        tt.type_name,
        tt.type_color,
        t.id tag_id,
        t.tag_name,
        t.tag_color,
        COUNT(DISTINCT lta.lead_id) customer_count
        FROM tag_types tt
        LEFT JOIN tags t ON t.tag_type_id = tt.id
        LEFT JOIN lead_tag_assignments lta ON lta.tag_id = t.id
      WHERE tt.company_id = ?
      GROUP BY tt.id,tt.type_name,tt.type_color,t.id,t.tag_name,t.tag_color
      ORDER BY tt.created_at DESC,t.tag_name ASC`,
    [adminCompanyId ?? adminUserId],
  );

  return NextResponse.json({
    data: {
      users,
      roles,
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
      tagStats,
    },
  });
}
