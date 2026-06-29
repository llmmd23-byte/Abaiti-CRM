import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import type { MiddarSession } from "@/lib/auth";
import {
  ownerIdsForScope,
  requirePermission,
  type PermissionAction,
} from "@/lib/permissions";

export type BackendResource =
  | "products"
  | "industries"
  | "leads"
  | "lead-contacts"
  | "lead-notes"
  | "lead-tag-types"
  | "lead-tags"
  | "lead-tag-assignments"
  | "demo-requests"
  | "quotes"
  | "sales"
  | "commissions"
  | "support-tickets"
  | "support-ticket-events"
  | "team-members"
  | "social-accounts"
  | "payout-methods"
  | "educational-assets";

type ResourceDefinition = {
  table: string;
  ownerField?: "affiliate_user_id" | "user_id";
  permissionKey: string;
  writable: readonly string[];
  defaults?: Record<string, SqlValue>;
};

type SqlValue = string | number | boolean | Date | null;

const resources: Record<BackendResource, ResourceDefinition> = {
  products: {
    table: "products",
    permissionKey: "table.products",
    writable: [
      "name",
      "name_en",
      "slug",
      "description",
      "status",
      "base_price",
      "currency",
    ],
  },
  industries: {
    table: "industries",
    permissionKey: "table.industries",
    writable: ["name", "name_en", "slug", "landing_url", "description", "status"],
  },
  leads: {
    table: "leads",
    ownerField: "affiliate_user_id",
    permissionKey: "table.leads",
    writable: [
      "industry_id",
      "name",
      "company_name",
      "email",
      "phone",
      "source",
      "address",
      "requirements",
      "stage",
      "potential_value",
      "currency",
    ],
    defaults: { stage: "new", currency: "SAR" },
  },
  "lead-contacts": {
    table: "lead_contacts",
    ownerField: "affiliate_user_id",
    permissionKey: "table.lead_contacts",
    writable: ["lead_id", "name", "phone", "email", "job_title"],
  },
  "lead-notes": {
    table: "lead_notes",
    ownerField: "affiliate_user_id",
    permissionKey: "table.lead_notes",
    writable: ["lead_id", "note"],
  },
  "lead-tag-types": {
    table: "tag_types",
    ownerField: "affiliate_user_id",
    permissionKey: "table.tag_types",
    writable: ["type_name", "type_color"],
  },
  "lead-tags": {
    table: "tags",
    ownerField: "affiliate_user_id",
    permissionKey: "table.tags",
    writable: ["tag_type_id", "tag_name", "tag_color"],
  },
  "lead-tag-assignments": {
    table: "lead_tag_assignments",
    ownerField: "affiliate_user_id",
    permissionKey: "table.lead_tag_assignments",
    writable: ["lead_id", "tag_id"],
  },
  "demo-requests": {
    table: "demo_requests",
    ownerField: "affiliate_user_id",
    permissionKey: "table.demo_requests",
    writable: [
      "lead_id",
      "product_id",
      "industry_id",
      "company_name",
      "contact_name",
      "email",
      "phone",
      "address",
      "requirements",
      "status",
    ],
    defaults: { status: "new" },
  },
  quotes: {
    table: "quotes",
    ownerField: "affiliate_user_id",
    permissionKey: "table.quotes",
    writable: [
      "quote_number",
      "lead_id",
      "product_id",
      "amount",
      "currency",
      "valid_until",
      "status",
      "notes",
    ],
    defaults: { status: "draft", currency: "SAR" },
  },
  sales: {
    table: "sales",
    ownerField: "affiliate_user_id",
    permissionKey: "table.sales",
    writable: [
      "quote_id",
      "lead_id",
      "product_id",
      "sale_amount",
      "currency",
      "status",
      "sold_at",
    ],
    defaults: { status: "pending", currency: "SAR" },
  },
  commissions: {
    table: "commissions",
    ownerField: "affiliate_user_id",
    permissionKey: "table.commissions",
    writable: [],
  },
  "support-tickets": {
    table: "support_tickets",
    ownerField: "user_id",
    permissionKey: "table.support_tickets",
    writable: [
      "ticket_number",
      "category",
      "subject",
      "details",
      "notes",
      "status",
      "priority",
    ],
    defaults: { status: "open", priority: "normal" },
  },
  "support-ticket-events": {
    table: "support_ticket_events",
    ownerField: "user_id",
    permissionKey: "table.support_ticket_events",
    writable: [],
  },
  "team-members": {
    table: "team_members",
    ownerField: "user_id",
    permissionKey: "table.team_members",
    writable: ["name", "phone", "email", "status"],
    defaults: { status: "inactive" },
  },
  "social-accounts": {
    table: "affiliate_social_accounts",
    ownerField: "user_id",
    permissionKey: "table.social_accounts",
    writable: ["platform", "handle", "url"],
  },
  "payout-methods": {
    table: "affiliate_payout_methods",
    ownerField: "user_id",
    permissionKey: "table.payout_methods",
    writable: [
      "bank_name",
      "account_holder_name",
      "iban",
      "minimum_payout_amount",
      "currency",
      "is_default",
    ],
    defaults: { minimum_payout_amount: 500, currency: "SAR", is_default: 1 },
  },
  "educational-assets": {
    table: "educational_assets",
    permissionKey: "table.educational_assets",
    writable: [
      "title",
      "asset_type",
      "url",
      "thumbnail_url",
      "duration",
      "description",
      "status",
    ],
    defaults: { status: "active" },
  },
};

const definitionFor = (resource: string) => {
  const definition = resources[resource as BackendResource];
  if (!definition) throw new Error("UNKNOWN_RESOURCE");
  return definition;
};

const canManageGlobal = (session: MiddarSession) =>
  session.role === "admin" || session.role === "sales";

async function ownerFilter(
  definition: ResourceDefinition,
  session: MiddarSession,
  qualifier = "",
) {
  if (!definition.ownerField) return { clause: "", params: [] as SqlValue[] };
  const ownerIds = await ownerIdsForScope(session, definition.permissionKey);
  if (!ownerIds) return { clause: "", params: [] as SqlValue[] };
  const column = `${qualifier}${definition.ownerField}`;
  return {
    clause: ` WHERE ${column} IN (${ownerIds.map(() => "?").join(", ")})`,
    params: ownerIds,
  };
}

async function ownerGuard(
  definition: ResourceDefinition,
  session: MiddarSession,
  prefix = " AND ",
) {
  if (!definition.ownerField) return { clause: "", params: [] as SqlValue[] };
  const ownerIds = await ownerIdsForScope(session, definition.permissionKey);
  if (!ownerIds) return { clause: "", params: [] as SqlValue[] };
  return {
    clause: `${prefix}${definition.ownerField} IN (${ownerIds.map(() => "?").join(", ")})`,
    params: ownerIds,
  };
}

async function assertResourcePermission(
  definition: ResourceDefinition,
  session: MiddarSession,
  action: PermissionAction,
) {
  await requirePermission(session, definition.permissionKey, action);
}

async function closeExpiredDemoRequests() {
  await db.execute(
    `UPDATE demo_requests
        SET status = 'completed'
      WHERE status NOT IN ('completed', 'cancelled')
        AND DATE_ADD(
              created_at,
              INTERVAL CASE
                WHEN requirements LIKE '%7%' THEN 7
                WHEN requirements LIKE '%30%' THEN 30
                ELSE 14
              END DAY
            ) < NOW()`,
  );
}

async function closeExpiredQuotes() {
  await db.execute(
    `UPDATE quotes
        SET status = 'expired'
      WHERE status IN ('draft', 'sent', 'send')
        AND valid_until IS NOT NULL
        AND DATE(valid_until) < CURDATE()`,
  );
}

async function ensureLeadContactsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS lead_contacts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      lead_id BIGINT UNSIGNED NOT NULL,
      affiliate_user_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(190) NOT NULL,
      phone VARCHAR(80) NULL,
      email VARCHAR(190) NULL,
      job_title VARCHAR(190) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_lead_contacts_lead_id (lead_id),
      INDEX idx_lead_contacts_affiliate_user_id (affiliate_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

async function ensureLeadNotesTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS lead_notes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      lead_id BIGINT UNSIGNED NOT NULL,
      affiliate_user_id BIGINT UNSIGNED NOT NULL,
      note TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_lead_notes_lead_id (lead_id),
      INDEX idx_lead_notes_affiliate_user_id (affiliate_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

async function ensureLeadTagsTable() {
  await ensureLeadTagTypesTable();
  await db.execute(
    `CREATE TABLE IF NOT EXISTS tags (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      affiliate_user_id BIGINT UNSIGNED NOT NULL,
      tag_type_id BIGINT UNSIGNED NULL,
      tag_name VARCHAR(120) NOT NULL,
      tag_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_tags_tag_type_id (tag_type_id),
      INDEX idx_tags_affiliate_user_id (affiliate_user_id),
      UNIQUE KEY uq_tags_name (affiliate_user_id, tag_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  const [columns] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tags'
        AND COLUMN_NAME = 'tag_type_id'
      LIMIT 1`,
  );
  if (!columns.length) {
    await db.execute(
      `ALTER TABLE tags ADD COLUMN tag_type_id BIGINT UNSIGNED NULL AFTER affiliate_user_id`,
    );
    await db.execute(`ALTER TABLE tags ADD INDEX idx_tags_tag_type_id (tag_type_id)`);
  }
}

async function ensureLeadTagTypesTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS tag_types (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      affiliate_user_id BIGINT UNSIGNED NOT NULL,
      type_name VARCHAR(120) NOT NULL,
      type_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_tag_types_affiliate_user_id (affiliate_user_id),
      UNIQUE KEY uq_tag_types_name (affiliate_user_id, type_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

async function ensureLeadTagAssignmentsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS lead_tag_assignments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      lead_id BIGINT UNSIGNED NOT NULL,
      tag_id BIGINT UNSIGNED NOT NULL,
      affiliate_user_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_lead_tag_assignments_lead_id (lead_id),
      INDEX idx_lead_tag_assignments_tag_id (tag_id),
      INDEX idx_lead_tag_assignments_affiliate_user_id (affiliate_user_id),
      UNIQUE KEY uq_lead_tag_assignments (lead_id, tag_id, affiliate_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
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

async function recordSupportTicketEvent({
  ticketId,
  userId,
  actorUserId,
  eventType,
  oldStatus = null,
  newStatus = null,
  note = null,
}: {
  ticketId: number;
  userId: number;
  actorUserId: number;
  eventType: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  note?: string | null;
}) {
  await ensureSupportTicketEventsTable();
  await db.execute(
    `INSERT INTO support_ticket_events
      (ticket_id, user_id, actor_user_id, event_type, old_status, new_status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ticketId, userId, actorUserId, eventType, oldStatus, newStatus, note],
  );
}

export async function listResource(resource: string, session: MiddarSession) {
  const definition = definitionFor(resource);
  await assertResourcePermission(definition, session, "can_view");

  if (resource === "lead-contacts") {
    await ensureLeadContactsTable();
  }
  if (resource === "lead-notes") {
    await ensureLeadNotesTable();
  }
  if (resource === "lead-tag-types") {
    await ensureLeadTagTypesTable();
  }
  if (resource === "lead-tags") {
    await ensureLeadTagsTable();
  }
  if (resource === "lead-tag-assignments") {
    await ensureLeadTagAssignmentsTable();
  }
  if (resource === "support-ticket-events") {
    await ensureSupportTicketEventsTable();
  }

  if (resource === "demo-requests") {
    await closeExpiredDemoRequests();
  }
  if (resource === "quotes") {
    await closeExpiredQuotes();
  }

  const { clause: where, params } = await ownerFilter(definition, session);

  if (resource === "sales") {
    const { clause: scopedWhere, params: scopedParams } = await ownerFilter(
      definition,
      session,
      "s.",
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT s.id,s.sales_invoice_number,s.quote_id,s.lead_id,s.affiliate_user_id,s.product_id,
              s.sale_amount,s.currency,s.status,s.receipt_url,s.sold_at,s.created_at,
              l.name customer_name,p.name product_name,p.name_en product_name_en,u.name affiliate_user_name,q.quote_number
         FROM sales s
         LEFT JOIN leads l ON l.id=s.lead_id
         LEFT JOIN products p ON p.id=s.product_id
         LEFT JOIN users u ON u.id=s.affiliate_user_id
         LEFT JOIN quotes q ON q.id=s.quote_id
        ${scopedWhere}
        ORDER BY s.created_at DESC LIMIT 250`,
      scopedParams,
    );
    return rows;
  }

  if (resource === "commissions") {
    const { clause: scopedWhere, params: scopedParams } = await ownerFilter(
      definition,
      session,
      "c.",
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT c.id,c.sale_id,c.affiliate_user_id,c.commission_percent,c.commission_amount,
              c.currency,c.commission_type,c.status,c.payment_reference,c.created_at,c.approved_at,c.paid_at,
              s.sales_invoice_number,l.name customer_name
         FROM commissions c
         LEFT JOIN sales s ON s.id=c.sale_id
         LEFT JOIN leads l ON l.id=s.lead_id
        ${scopedWhere}
        ORDER BY c.created_at DESC LIMIT 250`,
      scopedParams,
    );
    return rows;
  }

  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM ${definition.table}${where} ORDER BY created_at DESC LIMIT 250`,
    params,
  );
  return rows;
}

function cleanPayload(
  definition: ResourceDefinition,
  payload: Record<string, unknown>,
) {
  const data: Record<string, SqlValue> = { ...definition.defaults };
  for (const column of definition.writable) {
    const value = payload[column];
    if (
      value !== undefined &&
      value !== "" &&
      (value === null ||
        value instanceof Date ||
        ["string", "number", "boolean"].includes(typeof value))
    ) {
      data[column] = value as SqlValue;
    }
  }
  return data;
}

function generatedReference(resource: string) {
  const prefix = resource === "quotes" ? "Q" : "TKT";
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

const requiredFields: Partial<Record<BackendResource, readonly string[]>> = {
  products: ["name", "slug"],
  industries: ["name", "slug"],
  leads: ["name"],
  "lead-contacts": ["lead_id", "name"],
  "lead-notes": ["lead_id", "note"],
  "lead-tag-types": ["type_name"],
  "lead-tags": ["tag_name"],
  "lead-tag-assignments": ["lead_id", "tag_id"],
  "demo-requests": ["company_name", "contact_name"],
  quotes: ["lead_id", "product_id", "amount", "valid_until"],
  "support-tickets": ["category", "subject", "details"],
  "team-members": ["name", "phone"],
  "social-accounts": ["platform"],
  "payout-methods": ["bank_name", "account_holder_name", "iban"],
  "educational-assets": ["title", "asset_type"],
};

export async function createResource(
  resource: string,
  payload: Record<string, unknown>,
  session: MiddarSession,
) {
  const definition = definitionFor(resource);
  await assertResourcePermission(definition, session, "can_create");
  if (resource === "lead-contacts") {
    await ensureLeadContactsTable();
  }
  if (resource === "lead-notes") {
    await ensureLeadNotesTable();
  }
  if (resource === "lead-tag-types") {
    await ensureLeadTagTypesTable();
  }
  if (resource === "lead-tags") {
    await ensureLeadTagsTable();
  }
  if (resource === "lead-tag-assignments") {
    await ensureLeadTagAssignmentsTable();
  }
  if (resource === "support-ticket-events") {
    await ensureSupportTicketEventsTable();
  }
  if (resource === "quotes") {
    await closeExpiredQuotes();
  }
  if (definition.writable.length === 0) throw new Error("READ_ONLY_RESOURCE");

  const data = cleanPayload(definition, payload);
  if (resource === "lead-contacts" && data.phone)
    data.phone = String(data.phone).replace(/[^\d+]/g, "");
  if (resource === "lead-tags") {
    if (data.tag_type_id) data.tag_type_id = Number(data.tag_type_id);
    data.tag_name = String(data.tag_name ?? "").trim().slice(0, 120);
    const color = String(data.tag_color ?? "#00b4d8").trim();
    data.tag_color = /^#[0-9a-f]{6}$/i.test(color) ? color : "#00b4d8";
  }
  if (resource === "lead-tag-types") {
    data.type_name = String(data.type_name ?? "").trim().slice(0, 120);
    const color = String(data.type_color ?? "#00b4d8").trim();
    data.type_color = /^#[0-9a-f]{6}$/i.test(color) ? color : "#00b4d8";
  }
  if (resource === "lead-tag-assignments") {
    data.lead_id = Number(data.lead_id);
    data.tag_id = Number(data.tag_id);
  }
  if (resource === "team-members" && data.phone)
    data.phone = String(data.phone).replace(/[^\d+]/g, "");
  if (resource === "demo-requests" && !data.company_name && data.contact_name)
    data.company_name = data.contact_name;
  if (resource === "quotes" && data.product_id) {
    const [productRows] = await db.execute<RowDataPacket[]>(
      `SELECT base_price, currency FROM products WHERE id = ? LIMIT 1`,
      [Number(data.product_id)],
    );
    const product = productRows[0];
    if (
      !product ||
      product.base_price === null ||
      product.base_price === undefined
    )
      throw new Error("PRODUCT_PRICE_NOT_FOUND");
    data.amount = product.base_price;
    data.currency = product.currency ?? "SAR";
  }
  if (definition.ownerField) data[definition.ownerField] = Number(session.sub);
  if (resource === "demo-requests" && data.lead_id) {
    const [existingDemos] = await db.execute<RowDataPacket[]>(
      `SELECT id FROM demo_requests WHERE affiliate_user_id = ? AND lead_id = ? LIMIT 1`,
      [Number(session.sub), Number(data.lead_id)],
    );
    if (existingDemos.length) throw new Error("DUPLICATE_CUSTOMER_DEMO");
  }
  if (resource === "quotes" && data.lead_id) {
    const [existingQuotes] = await db.execute<RowDataPacket[]>(
      `SELECT id FROM quotes WHERE affiliate_user_id = ? AND lead_id = ? LIMIT 1`,
      [Number(session.sub), Number(data.lead_id)],
    );
    if (existingQuotes.length) throw new Error("DUPLICATE_CUSTOMER_QUOTE");
  }
  if (resource === "quotes" && !data.quote_number)
    data.quote_number = generatedReference(resource);
  if (resource === "support-tickets" && !data.ticket_number)
    data.ticket_number = generatedReference(resource);

  const missing = (requiredFields[resource as BackendResource] ?? []).filter(
    (column) =>
      data[column] === undefined ||
      data[column] === null ||
      data[column] === "",
  );
  if (missing.length) throw new Error("VALIDATION_ERROR");

  const columns = Object.keys(data);
  if (columns.length === 0) throw new Error("EMPTY_PAYLOAD");
  let result: ResultSetHeader;
  try {
    [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO ${definition.table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
      columns.map((column) => data[column]),
    );
  } catch (error) {
    if (
      resource === "team-members" &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    )
      throw new Error("DUPLICATE_PHONE");
    if (
      resource === "quotes" &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    )
      throw new Error("DUPLICATE_CUSTOMER_QUOTE");
    if (
      resource === "lead-tag-types" &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      const [existingTypes] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM tag_types WHERE affiliate_user_id = ? AND type_name = ? LIMIT 1`,
        [Number(session.sub), String(data.type_name ?? "")],
      );
      return existingTypes[0] ?? null;
    }
    if (
      resource === "lead-tags" &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      const [existingTags] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM tags WHERE affiliate_user_id = ? AND tag_name = ? LIMIT 1`,
        [Number(session.sub), String(data.tag_name ?? "")],
      );
      return existingTags[0] ?? null;
    }
    if (
      resource === "lead-tag-assignments" &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      const [existingAssignments] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM lead_tag_assignments
          WHERE affiliate_user_id = ? AND lead_id = ? AND tag_id = ?
          LIMIT 1`,
        [Number(session.sub), Number(data.lead_id), Number(data.tag_id)],
      );
      return existingAssignments[0] ?? null;
    }
    throw error;
  }
  if (resource === "support-tickets") {
    await recordSupportTicketEvent({
      ticketId: Number(result.insertId),
      userId: Number(data.user_id ?? session.sub),
      actorUserId: Number(session.sub),
      eventType: "created",
      newStatus: String(data.status ?? "open"),
      note: String(data.subject ?? ""),
    });
  }
  if (resource === "quotes") {
    await closeExpiredQuotes();
  }
  return getResource(resource, result.insertId, session);
}

export async function getResource(
  resource: string,
  id: number,
  session: MiddarSession,
) {
  const definition = definitionFor(resource);
  await assertResourcePermission(definition, session, "can_view");
  if (resource === "lead-contacts") {
    await ensureLeadContactsTable();
  }
  if (resource === "lead-notes") {
    await ensureLeadNotesTable();
  }
  if (resource === "lead-tag-types") {
    await ensureLeadTagTypesTable();
  }
  if (resource === "lead-tags") {
    await ensureLeadTagsTable();
  }
  if (resource === "lead-tag-assignments") {
    await ensureLeadTagAssignmentsTable();
  }
  if (resource === "support-ticket-events") {
    await ensureSupportTicketEventsTable();
  }
  if (resource === "quotes") {
    await closeExpiredQuotes();
  }
  const { clause: ownerCheck, params: ownerParams } = await ownerGuard(
    definition,
    session,
  );
  const params: SqlValue[] = [id, ...ownerParams];
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM ${definition.table} WHERE id = ?${ownerCheck} LIMIT 1`,
    params,
  );
  return rows[0] ?? null;
}

export async function updateResource(
  resource: string,
  id: number,
  payload: Record<string, unknown>,
  session: MiddarSession,
) {
  const definition = definitionFor(resource);
  await assertResourcePermission(definition, session, "can_edit");
  if (resource === "lead-contacts") {
    await ensureLeadContactsTable();
  }
  if (resource === "lead-notes") {
    await ensureLeadNotesTable();
  }
  if (resource === "lead-tag-types") {
    await ensureLeadTagTypesTable();
  }
  if (resource === "lead-tags") {
    await ensureLeadTagsTable();
  }
  if (resource === "lead-tag-assignments") {
    await ensureLeadTagAssignmentsTable();
  }
  if (resource === "support-ticket-events") {
    await ensureSupportTicketEventsTable();
  }
  if (resource === "quotes") {
    await closeExpiredQuotes();
  }
  const existing = await getResource(resource, id, session);
  if (!existing) throw new Error("NOT_FOUND");
  if (
    resource === "quotes" &&
    payload.status !== undefined &&
    !canManageGlobal(session)
  ) {
    const userEditableStatuses = ["draft", "sent", "accepted"];
    const currentStatus = String(existing.status ?? "draft");
    const nextStatus = String(payload.status ?? "");
    if (
      !userEditableStatuses.includes(currentStatus) ||
      !userEditableStatuses.includes(nextStatus)
    )
      throw new Error("FORBIDDEN_QUOTE_STATUS");
  }
  const data = cleanPayload(definition, payload);
  if (resource === "lead-contacts" && data.phone)
    data.phone = String(data.phone).replace(/[^\d+]/g, "");
  if (resource === "lead-tags") {
    if (data.tag_type_id) data.tag_type_id = Number(data.tag_type_id);
    if (data.tag_name) data.tag_name = String(data.tag_name).trim().slice(0, 120);
    if (data.tag_color) {
      const color = String(data.tag_color).trim();
      data.tag_color = /^#[0-9a-f]{6}$/i.test(color) ? color : "#00b4d8";
    }
  }
  if (resource === "lead-tag-types") {
    if (data.type_name) data.type_name = String(data.type_name).trim().slice(0, 120);
    if (data.type_color) {
      const color = String(data.type_color).trim();
      data.type_color = /^#[0-9a-f]{6}$/i.test(color) ? color : "#00b4d8";
    }
  }
  if (resource === "lead-tag-assignments") {
    if (data.lead_id) data.lead_id = Number(data.lead_id);
    if (data.tag_id) data.tag_id = Number(data.tag_id);
  }
  if (resource === "team-members" && data.phone)
    data.phone = String(data.phone).replace(/[^\d+]/g, "");
  const columns = Object.keys(data);
  if (columns.length === 0) throw new Error("EMPTY_PAYLOAD");
  await db.execute(
    `UPDATE ${definition.table} SET ${columns.map((column) => `${column} = ?`).join(", ")} WHERE id = ?`,
    [...columns.map((column) => data[column]), id],
  );
  if (resource === "support-tickets") {
    const userId = Number(existing.user_id ?? session.sub);
    const actorUserId = Number(session.sub);
    if (
      data.status !== undefined &&
      String(data.status ?? "") !== String(existing.status ?? "")
    ) {
      await recordSupportTicketEvent({
        ticketId: id,
        userId,
        actorUserId,
        eventType: "status_changed",
        oldStatus: String(existing.status ?? ""),
        newStatus: String(data.status ?? ""),
      });
    }
    if (
      data.notes !== undefined &&
      String(data.notes ?? "").trim() !== String(existing.notes ?? "").trim()
    ) {
      await recordSupportTicketEvent({
        ticketId: id,
        userId,
        actorUserId,
        eventType: "admin_note",
        note: String(data.notes ?? "").trim(),
      });
    }
  }
  if (resource === "quotes") {
    await closeExpiredQuotes();
  }
  return getResource(resource, id, session);
}

export async function deleteResource(
  resource: string,
  id: number,
  session: MiddarSession,
) {
  const definition = definitionFor(resource);
  await assertResourcePermission(definition, session, "can_delete");
  if (resource === "lead-contacts") {
    await ensureLeadContactsTable();
  }
  if (resource === "lead-notes") {
    await ensureLeadNotesTable();
  }
  if (resource === "lead-tag-types") {
    await ensureLeadTagTypesTable();
  }
  if (resource === "lead-tags") {
    await ensureLeadTagsTable();
  }
  if (resource === "lead-tag-assignments") {
    await ensureLeadTagAssignmentsTable();
  }
  const existing = await getResource(resource, id, session);
  if (!existing) throw new Error("NOT_FOUND");

  if (resource === "products") {
    const [references] = await db.execute<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM demo_requests WHERE product_id = ?) AS demo_count,
        (SELECT COUNT(*) FROM quotes WHERE product_id = ?) AS quote_count,
        (SELECT COUNT(*) FROM sales WHERE product_id = ?) AS sale_count`,
      [id, id, id],
    );
    const linkedRecords =
      Number(references[0]?.demo_count ?? 0) +
      Number(references[0]?.quote_count ?? 0) +
      Number(references[0]?.sale_count ?? 0);
    if (linkedRecords > 0) throw new Error("PRODUCT_IN_USE");
  }

  if (resource === "industries") {
    const [references] = await db.execute<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM leads WHERE industry_id = ?) AS lead_count,
        (SELECT COUNT(*) FROM demo_requests WHERE industry_id = ?) AS demo_count`,
      [id, id],
    );
    const linkedRecords =
      Number(references[0]?.lead_count ?? 0) +
      Number(references[0]?.demo_count ?? 0);
    if (linkedRecords > 0) throw new Error("INDUSTRY_IN_USE");
  }

  await db.execute(`DELETE FROM ${definition.table} WHERE id = ?`, [id]);
}

export async function getDashboardSummary(
  session: MiddarSession,
  trendPeriod: "week" | "month" | "year" = "week",
) {
  const userId = Number(session.sub);
  const scoped = !canManageGlobal(session);
  const ownerClause = scoped ? " WHERE affiliate_user_id = ?" : "";
  const ownerParams = scoped ? [userId] : [];
  const salesPeriodOwnerClause = scoped
    ? " AND affiliate_user_id = ?"
    : "";
  const trendConfig = {
    week: { interval: "6 DAY", dateFormat: "%Y-%m-%d" },
    month: { interval: "29 DAY", dateFormat: "%Y-%m-%d" },
    year: { interval: "11 MONTH", dateFormat: "%Y-%m" },
  }[trendPeriod];

  const [
    [leadRows],
    [quoteRows],
    [saleRows],
    [salesPeriodRows],
    [salesTrendRows],
    [commissionRows],
    [ticketRows],
  ] = await Promise.all([
      db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) total, SUM(stage = 'won') won FROM leads${ownerClause}`,
        ownerParams,
      ),
      db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) total, SUM(status IN ('accepted','paid')) converted FROM quotes${ownerClause}`,
        ownerParams,
      ),
      db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) total, COALESCE(SUM(sale_amount),0) amount FROM sales${ownerClause}`,
        ownerParams,
      ),
      db.execute<RowDataPacket[]>(
        `SELECT
           COALESCE(SUM(CASE
             WHEN COALESCE(sold_at, created_at) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
             THEN sale_amount ELSE 0 END), 0) AS current_month_amount,
           COALESCE(SUM(CASE
             WHEN COALESCE(sold_at, created_at) >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
              AND COALESCE(sold_at, created_at) < DATE_FORMAT(CURDATE(), '%Y-%m-01')
             THEN sale_amount ELSE 0 END), 0) AS previous_month_amount
         FROM sales
         WHERE COALESCE(sold_at, created_at) >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)${salesPeriodOwnerClause}`,
        ownerParams,
      ),
      db.execute<RowDataPacket[]>(
        `SELECT DATE_FORMAT(COALESCE(sold_at, created_at), '${trendConfig.dateFormat}') AS day,
                COALESCE(SUM(sale_amount), 0) AS amount,
                COUNT(*) AS total
           FROM sales
          WHERE DATE(COALESCE(sold_at, created_at)) >= DATE_SUB(CURDATE(), INTERVAL ${trendConfig.interval})${salesPeriodOwnerClause}
          GROUP BY DATE_FORMAT(COALESCE(sold_at, created_at), '${trendConfig.dateFormat}')
          ORDER BY day ASC`,
        ownerParams,
      ),
      db.execute<RowDataPacket[]>(
        `SELECT COALESCE(SUM(commission_amount),0) amount,
                COALESCE(SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END),0) approved_amount,
                COALESCE(SUM(status='pending'),0) pending
           FROM commissions${ownerClause}`,
        ownerParams,
      ),
      db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) total FROM support_tickets${scoped ? " WHERE user_id = ?" : ""} AND status IN ('open','in_progress')`.replace(
          "tickets AND",
          "tickets WHERE",
        ),
        ownerParams,
      ),
    ]);

  return {
    leads: Number(leadRows[0]?.total ?? 0),
    wonLeads: Number(leadRows[0]?.won ?? 0),
    quotes: Number(quoteRows[0]?.total ?? 0),
    convertedQuotes: Number(quoteRows[0]?.converted ?? 0),
    sales: Number(saleRows[0]?.total ?? 0),
    salesAmount: Number(saleRows[0]?.amount ?? 0),
    salesCurrentMonthAmount: Number(salesPeriodRows[0]?.current_month_amount ?? 0),
    salesPreviousMonthAmount: Number(salesPeriodRows[0]?.previous_month_amount ?? 0),
    salesTrend: salesTrendRows.map((row) => ({
      day: String(row.day),
      amount: Number(row.amount ?? 0),
      total: Number(row.total ?? 0),
    })),
    salesTrendPeriod: trendPeriod,
    commissionAmount: Number(commissionRows[0]?.amount ?? 0),
    approvedCommissionAmount: Number(commissionRows[0]?.approved_amount ?? 0),
    pendingCommissions: Number(commissionRows[0]?.pending ?? 0),
    openTickets: Number(ticketRows[0]?.total ?? 0),
  };
}

export async function getProfile(session: MiddarSession) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id, u.name, u.email, u.username, COALESCE(r.slug, 'affiliate') role, u.level, u.status,
            u.preferred_locale, u.phone, u.city, u.district, u.referral_code, u.landing_slug,
            u.license_type, u.license_status, u.license_file_url, u.skills_experience,
            u.skills_courses, u.skills_proof_files, u.joined_at, u.CompanyID AS company_id,
            u.host_name, u.host_phone, u.last_login_at
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = ? LIMIT 1`,
    [Number(session.sub)],
  );
  return rows[0] ?? null;
}

export async function updateProfile(
  session: MiddarSession,
  payload: Record<string, unknown>,
) {
  const allowed = [
    "name",
    "preferred_locale",
    "phone",
    "city",
    "district",
    "referral_code",
    "landing_slug",
    "license_type",
    "skills_experience",
    "skills_courses",
    "host_name",
    "host_phone",
  ];
  const data: Record<string, SqlValue> = {};
  for (const column of allowed) {
    const value = payload[column];
    if (typeof value === "string" || value === null)
      data[column] = value || null;
  }
  const companyId = payload.company_id;
  if (companyId === null || companyId === "") {
    data.CompanyID = null;
  } else if (
    (typeof companyId === "string" || typeof companyId === "number") &&
    /^\d+$/.test(String(companyId))
  ) {
    data.CompanyID = Number(companyId);
  } else if (companyId !== undefined) {
    throw new Error("VALIDATION_ERROR");
  }
  if (
    data.license_type &&
    !["none", "verified", "e_marketing", "fal"].includes(
      String(data.license_type),
    )
  ) {
    throw new Error("VALIDATION_ERROR");
  }
  const columns = Object.keys(data);
  if (columns.length === 0) throw new Error("EMPTY_PAYLOAD");
  await db.execute(
    `UPDATE users SET ${columns.map((column) => `${column} = ?`).join(", ")} WHERE id = ?`,
    [...columns.map((column) => data[column]), Number(session.sub)],
  );
  return getProfile(session);
}

export async function updateLicenseFile(
  session: MiddarSession,
  fileUrl: string,
) {
  await db.execute(`UPDATE users SET license_file_url = ? WHERE id = ?`, [
    fileUrl,
    Number(session.sub),
  ]);
  return getProfile(session);
}

export async function updateSkillProofFiles(
  session: MiddarSession,
  fileUrls: string[],
) {
  await db.execute(`UPDATE users SET skills_proof_files = ? WHERE id = ?`, [
    JSON.stringify(fileUrls),
    Number(session.sub),
  ]);
  return getProfile(session);
}

export async function getUserSocialAccounts(session: MiddarSession) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, platform, handle, url, created_at, updated_at
       FROM affiliate_social_accounts
      WHERE user_id = ?
      ORDER BY platform`,
    [Number(session.sub)],
  );
  return rows;
}

export async function saveUserSocialAccounts(
  session: MiddarSession,
  payload: Record<string, unknown>,
) {
  const platforms = [
    "tiktok",
    "snapchat",
    "x",
    "facebook",
    "instagram",
    "linkedin",
  ] as const;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    for (const platform of platforms) {
      const rawValue = String(payload[platform] ?? "").trim();
      if (!rawValue) {
        await connection.execute(
          `DELETE FROM affiliate_social_accounts WHERE user_id = ? AND platform = ?`,
          [Number(session.sub), platform],
        );
        continue;
      }
      const isUrl = /^https?:\/\//i.test(rawValue);
      const value = rawValue.slice(0, isUrl ? 500 : 160);
      await connection.execute(
        `INSERT INTO affiliate_social_accounts (user_id, platform, handle, url)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE handle = VALUES(handle), url = VALUES(url), updated_at = CURRENT_TIMESTAMP`,
        [
          Number(session.sub),
          platform,
          isUrl ? null : value,
          isUrl ? value : null,
        ],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getUserSocialAccounts(session);
}

function payoutPayload(payload: Record<string, unknown>) {
  const bankName = String(payload.bank_name ?? "")
    .trim()
    .slice(0, 160);
  const holderName = String(payload.account_holder_name ?? "")
    .trim()
    .slice(0, 160);
  const iban = String(payload.iban ?? "")
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 40);
  const minimumAmount = Number(payload.minimum_payout_amount ?? 500);
  const currency = String(payload.currency ?? "SAR")
    .trim()
    .toUpperCase()
    .slice(0, 3);
  if (
    !bankName ||
    !holderName ||
    !/^[0-9A-Z]{4,40}$/.test(iban) ||
    !Number.isFinite(minimumAmount) ||
    minimumAmount < 0 ||
    !/^[A-Z]{3}$/.test(currency)
  ) {
    throw new Error("VALIDATION_ERROR");
  }
  return {
    bankName,
    holderName,
    iban,
    minimumAmount,
    currency,
    isDefault: payload.is_default === true || Number(payload.is_default) === 1,
  };
}

export async function getUserPayoutMethods(session: MiddarSession) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, bank_name, account_holder_name, iban, minimum_payout_amount, currency, is_default, created_at, updated_at
       FROM affiliate_payout_methods
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC`,
    [Number(session.sub)],
  );
  return rows;
}

export async function createUserPayoutMethod(
  session: MiddarSession,
  payload: Record<string, unknown>,
) {
  const data = payoutPayload(payload);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [countRows] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) total FROM affiliate_payout_methods WHERE user_id = ?`,
      [Number(session.sub)],
    );
    const isDefault = data.isDefault || Number(countRows[0]?.total ?? 0) === 0;
    if (isDefault)
      await connection.execute(
        `UPDATE affiliate_payout_methods SET is_default = 0 WHERE user_id = ?`,
        [Number(session.sub)],
      );
    await connection.execute(
      `INSERT INTO affiliate_payout_methods (user_id, bank_name, account_holder_name, iban, minimum_payout_amount, currency, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(session.sub),
        data.bankName,
        data.holderName,
        data.iban,
        data.minimumAmount,
        data.currency,
        isDefault ? 1 : 0,
      ],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getUserPayoutMethods(session);
}

export async function updateUserPayoutMethod(
  session: MiddarSession,
  id: number,
  payload: Record<string, unknown>,
) {
  const data = payoutPayload(payload);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute<RowDataPacket[]>(
      `SELECT id, is_default FROM affiliate_payout_methods WHERE id = ? AND user_id = ?`,
      [id, Number(session.sub)],
    );
    if (!existing[0]) throw new Error("NOT_FOUND");
    const isDefault = data.isDefault || Number(existing[0].is_default) === 1;
    if (isDefault)
      await connection.execute(
        `UPDATE affiliate_payout_methods SET is_default = 0 WHERE user_id = ?`,
        [Number(session.sub)],
      );
    await connection.execute(
      `UPDATE affiliate_payout_methods
          SET bank_name = ?, account_holder_name = ?, iban = ?, minimum_payout_amount = ?, currency = ?, is_default = ?
        WHERE id = ? AND user_id = ?`,
      [
        data.bankName,
        data.holderName,
        data.iban,
        data.minimumAmount,
        data.currency,
        isDefault ? 1 : 0,
        id,
        Number(session.sub),
      ],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getUserPayoutMethods(session);
}

export async function deleteUserPayoutMethod(
  session: MiddarSession,
  id: number,
) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute<RowDataPacket[]>(
      `SELECT is_default FROM affiliate_payout_methods WHERE id = ? AND user_id = ?`,
      [id, Number(session.sub)],
    );
    if (!existing[0]) throw new Error("NOT_FOUND");
    await connection.execute(
      `DELETE FROM affiliate_payout_methods WHERE id = ? AND user_id = ?`,
      [id, Number(session.sub)],
    );
    if (Number(existing[0].is_default) === 1) {
      await connection.execute(
        `UPDATE affiliate_payout_methods SET is_default = 1 WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        [Number(session.sub)],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getUserPayoutMethods(session);
}
