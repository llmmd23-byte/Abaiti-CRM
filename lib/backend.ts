import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import type { MiddarSession } from "@/lib/auth";
import {
  getSessionUserCompanyId,
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
  | "stores"
  | "stock"
  | "demo-requests"
  | "quotes"
  | "participation-contracts"
  | "sponsorship-contracts"
  | "rental-contracts"
  | "rental-booths"
  | "booths"
  | "sales-orders"
  | "sales"
  | "commissions"
  | "support-tickets"
  | "support-ticket-types"
  | "support-ticket-events"
  | "team-members"
  | "social-accounts"
  | "payout-methods"
  | "marketing-assets"
  | "educational-assets";

type ResourceDefinition = {
  table: string;
  ownerField?: "affiliate_user_id" | "user_id";
  permissionKey: string;
  writable: readonly string[];
  defaults?: Record<string, SqlValue>;
};

type SqlValue = string | number | boolean | Date | null;

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

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
    writable: ["name", "name_en", "slug", "landing_url", "external_url", "description", "status"],
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
      "website",
      "place_url",
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
    permissionKey: "table.tag_types",
    writable: ["type_name", "type_color"],
  },
  "lead-tags": {
    table: "tags",
    permissionKey: "table.tags",
    writable: ["tag_type_id", "tag_name", "tag_color"],
  },
  "lead-tag-assignments": {
    table: "lead_tag_assignments",
    permissionKey: "table.lead_tag_assignments",
    writable: ["lead_id", "tag_id"],
  },
  stores: {
    table: "`store`",
    ownerField: "affiliate_user_id",
    permissionKey: "table.store",
    writable: [
      "industry_id",
      "name",
      "company_name",
      "email",
      "phone",
      "address",
      "stage",
      "currency",
    ],
    defaults: { stage: "active", currency: "SAR" },
  },
  stock: {
    table: "stock",
    ownerField: "affiliate_user_id",
    permissionKey: "table.stock",
    writable: [
      "store_id",
      "product_id",
      "item_name",
      "sku",
      "quantity",
      "reorder_level",
      "unit_price",
      "currency",
      "notes",
    ],
    defaults: { quantity: 0, reorder_level: 0, currency: "SAR" },
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
  "participation-contracts": {
    table: "participation_contracts",
    ownerField: "affiliate_user_id",
    permissionKey: "table.quotes",
    writable: [
      "contract_number",
      "lead_id",
      "company_name",
      "brand_name",
      "contact_name",
      "email",
      "website",
      "phone",
      "mobile",
      "fax",
      "address",
      "city",
      "country",
      "stand_number",
      "location_category",
      "package_type",
      "space_sqm",
      "price_per_sqm",
      "total_amount",
      "currency",
      "payment_method",
      "contract_date",
      "status",
      "notes",
    ],
    defaults: { status: "draft", currency: "SAR", payment_method: "bank_transfer" },
  },
  "sponsorship-contracts": {
    table: "sponsorship_contracts",
    ownerField: "affiliate_user_id",
    permissionKey: "table.quotes",
    writable: [
      "contract_number",
      "lead_id",
      "company_name",
      "brand_name",
      "contact_name",
      "email",
      "website",
      "phone",
      "mobile",
      "fax",
      "address",
      "city",
      "country",
      "stand_number",
      "sponsorship_category",
      "package_type",
      "space_sqm",
      "price_per_sqm",
      "sponsorship_amount",
      "registration_fee",
      "other_services_amount",
      "vat_amount",
      "grand_total",
      "currency",
      "payment_method",
      "contract_date",
      "status",
      "notes",
    ],
    defaults: { status: "draft", currency: "SAR", payment_method: "bank_transfer" },
  },
  "rental-contracts": {
    table: "rental_contracts",
    ownerField: "affiliate_user_id",
    permissionKey: "table.quotes",
    writable: [
      "contract_number",
      "lead_id",
      "event_name",
      "event_dates",
      "event_location",
      "first_party_cr",
      "first_party_representative",
      "second_party_cr",
      "second_party_representative",
      "booth_number",
      "participation_category",
      "booth_size",
      "lessor_name",
      "tenant_name",
      "company_name",
      "contact_name",
      "email",
      "phone",
      "address",
      "city",
      "country",
      "rental_item",
      "rental_location",
      "lease_start_date",
      "lease_end_date",
      "unit_price",
      "quantity",
      "subtotal",
      "vat_amount",
      "grand_total",
      "currency",
      "payment_method",
      "contract_date",
      "status",
      "notes",
    ],
    defaults: { status: "draft", currency: "SAR", payment_method: "bank_transfer" },
  },
  "rental-booths": {
    table: "rental_booths",
    permissionKey: "table.quotes",
    writable: [],
  },
  booths: {
    table: "booth",
    permissionKey: "table.quotes",
    writable: [
      "booth_number",
      "booth_size",
      "booth_dimensions",
      "booth_category",
      "hall",
      "location_zone",
      "status",
      "notes",
    ],
    defaults: { status: "available" },
  },
  "sales-orders": {
    table: "sales_orders",
    ownerField: "affiliate_user_id",
    permissionKey: "table.quotes",
    writable: [
      "order_number",
      "lead_id",
      "company_name",
      "contact_name",
      "email",
      "phone",
      "address",
      "city",
      "country",
      "exhibition_name",
      "stand_number",
      "item_description",
      "uom",
      "unit_price",
      "quantity",
      "subtotal",
      "vat_amount",
      "grand_total",
      "currency",
      "payment_method",
      "order_date",
      "status",
      "notes",
    ],
    defaults: {
      status: "draft",
      currency: "SAR",
      payment_method: "bank_transfer",
      exhibition_name: "Rawnaq Elegance Expo - Dec 2026",
      uom: "SQM",
      quantity: 1,
    },
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
  "support-ticket-types": {
    table: "support_ticket_types",
    permissionKey: "table.support_ticket_types",
    writable: ["name_ar", "name_en", "description", "status", "sort_order"],
    defaults: { status: "active", sort_order: 0 },
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
    writable: ["name", "phone", "email", "status", "assign_member"],
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
  "marketing-assets": {
    table: "marketing_assets",
    permissionKey: "table.marketing_assets",
    writable: [
      "title",
      "asset_type",
      "original_name",
      "mime_type",
      "file_size",
      "file_path",
      "file_data",
      "description",
      "status",
    ],
    defaults: { status: "active" },
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

async function companyIdForSession(session: MiddarSession) {
  return (await getSessionUserCompanyId(session)) ?? Number(session.sub);
}

async function columnExists(tableName: string, columnName: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function tableExists(tableName: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

async function foreignKeyExists(tableName: string, constraintName: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT CONSTRAINT_NAME
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = ?
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      LIMIT 1`,
    [tableName, constraintName],
  );
  return rows.length > 0;
}

async function ensureUserTeamColumns() {
  if (!(await columnExists("users", "manager_id"))) {
    await db.execute(
      "ALTER TABLE users ADD COLUMN manager_id BIGINT UNSIGNED NULL AFTER CompanyID",
    );
  }
  if (await columnExists("users", "host_name")) {
    await db.execute("ALTER TABLE users DROP COLUMN host_name");
  }
  if (await columnExists("users", "host_phone")) {
    await db.execute("ALTER TABLE users DROP COLUMN host_phone");
  }
}

async function companyFilterForSession(session: MiddarSession, qualifier = "") {
  const scopedCompanyIds = [await companyIdForSession(session)];
  return {
    clause: ` WHERE ${qualifier}company_id IN (${scopedCompanyIds.map(() => "?").join(", ")})`,
    params: scopedCompanyIds,
  };
}

async function tagTypeCompanyFilter(session: MiddarSession, qualifier = "") {
  return companyFilterForSession(session, qualifier);
}

async function tagTypeCompanyGuard(session: MiddarSession, prefix = " AND ") {
  const filter = await tagTypeCompanyFilter(session);
  if (!filter.clause) return filter;
  return {
    clause: `${prefix}${filter.clause.replace(/^ WHERE /, "")}`,
    params: filter.params,
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

async function ensureStoreTables() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS \`store\` (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      affiliate_user_id BIGINT UNSIGNED NOT NULL,
      industry_id BIGINT UNSIGNED NULL,
      name VARCHAR(190) NULL,
      company_name VARCHAR(190) NOT NULL,
      email VARCHAR(190) NULL,
      phone VARCHAR(80) NULL,
      address VARCHAR(255) NULL,
      stage VARCHAR(60) NOT NULL DEFAULT 'active',
      currency VARCHAR(10) NOT NULL DEFAULT 'SAR',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_store_affiliate_user_id (affiliate_user_id),
      INDEX idx_store_industry_id (industry_id),
      INDEX idx_store_company_name (company_name),
      INDEX idx_store_stage (stage)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS stock (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      store_id BIGINT UNSIGNED NOT NULL,
      affiliate_user_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NULL,
      item_name VARCHAR(190) NOT NULL,
      sku VARCHAR(120) NULL,
      quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
      reorder_level DECIMAL(15,3) NOT NULL DEFAULT 0,
      unit_price DECIMAL(15,2) NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'SAR',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_stock_store_id (store_id),
      INDEX idx_stock_affiliate_user_id (affiliate_user_id),
      INDEX idx_stock_product_id (product_id),
      INDEX idx_stock_sku (sku),
      CONSTRAINT fk_stock_store
        FOREIGN KEY (store_id) REFERENCES \`store\` (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

async function ensureLeadPlaceUrlColumn() {
  if (!(await columnExists("leads", "place_url"))) {
    await db.execute(
      "ALTER TABLE leads ADD COLUMN place_url VARCHAR(255) NULL AFTER website",
    );
  }
}

async function ensureResourceTable(resource: string) {
  if (resource === "leads") {
    await ensureLeadPlaceUrlColumn();
  }
  if (resource === "stores" || resource === "stock") {
    await ensureStoreTables();
  }
  if (resource === "team-members") {
    await ensureTeamMembersTable();
  }
  if (resource === "participation-contracts") {
    await ensureParticipationContractsTable();
  }
  if (resource === "sponsorship-contracts") {
    await ensureSponsorshipContractsTable();
  }
  if (resource === "rental-contracts") {
    await ensureRentalContractsTable();
  }
  if (resource === "rental-booths") {
    await ensureRentalContractsTable();
  }
  if (resource === "booths") {
    await ensureBoothTable();
    await seedDefaultBoothCatalog();
    await syncBoothCatalogFromRentalBooths();
  }
  if (resource === "sales-orders") {
    await ensureSalesOrdersTable();
  }
  if (resource === "marketing-assets") {
    await ensureMarketingAssetsTable();
  }
}

async function ensureParticipationContractsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS participation_contracts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      contract_number VARCHAR(80) NOT NULL,
      lead_id BIGINT UNSIGNED NULL,
      affiliate_user_id BIGINT UNSIGNED NULL,
      company_name VARCHAR(190) NOT NULL,
      brand_name VARCHAR(190) NULL,
      contact_name VARCHAR(190) NOT NULL,
      email VARCHAR(190) NULL,
      website VARCHAR(190) NULL,
      phone VARCHAR(80) NULL,
      mobile VARCHAR(80) NULL,
      fax VARCHAR(80) NULL,
      address VARCHAR(255) NULL,
      city VARCHAR(120) NULL,
      country VARCHAR(120) NULL,
      stand_number VARCHAR(80) NULL,
      location_category VARCHAR(120) NULL,
      package_type VARCHAR(120) NOT NULL,
      space_sqm DECIMAL(12,2) NULL,
      price_per_sqm DECIMAL(12,2) NULL,
      total_amount DECIMAL(12,2) NULL,
      currency CHAR(3) NOT NULL DEFAULT 'SAR',
      payment_method VARCHAR(80) NOT NULL DEFAULT 'bank_transfer',
      contract_date DATE NULL,
      status ENUM('draft', 'sent', 'signed', 'cancelled') NOT NULL DEFAULT 'draft',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_participation_contracts_number (contract_number),
      KEY idx_participation_contracts_lead (lead_id),
      KEY idx_participation_contracts_affiliate (affiliate_user_id),
      KEY idx_participation_contracts_status (status),
      KEY idx_participation_contracts_company (company_name),
      CONSTRAINT fk_participation_contracts_affiliate_user
        FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  if (!(await columnExists("participation_contracts", "lead_id"))) {
    await db.execute(
      "ALTER TABLE participation_contracts ADD COLUMN lead_id BIGINT UNSIGNED NULL AFTER contract_number",
    );
  }
  const [leadIndexes] = await db.execute<RowDataPacket[]>(
    `SELECT 1
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'participation_contracts'
        AND INDEX_NAME = 'idx_participation_contracts_lead'
      LIMIT 1`,
  );
  if (!leadIndexes.length) {
    await db.execute(
      "ALTER TABLE participation_contracts ADD INDEX idx_participation_contracts_lead (lead_id)",
    );
  }
}

async function ensureSponsorshipContractsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS sponsorship_contracts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      contract_number VARCHAR(80) NOT NULL,
      lead_id BIGINT UNSIGNED NULL,
      affiliate_user_id BIGINT UNSIGNED NULL,
      company_name VARCHAR(190) NOT NULL,
      brand_name VARCHAR(190) NULL,
      contact_name VARCHAR(190) NOT NULL,
      email VARCHAR(190) NULL,
      website VARCHAR(190) NULL,
      phone VARCHAR(80) NULL,
      mobile VARCHAR(80) NULL,
      fax VARCHAR(80) NULL,
      address VARCHAR(255) NULL,
      city VARCHAR(120) NULL,
      country VARCHAR(120) NULL,
      stand_number VARCHAR(80) NULL,
      sponsorship_category VARCHAR(120) NOT NULL,
      package_type VARCHAR(120) NULL,
      space_sqm DECIMAL(12,2) NULL,
      price_per_sqm DECIMAL(12,2) NULL,
      sponsorship_amount DECIMAL(12,2) NULL,
      registration_fee DECIMAL(12,2) NULL,
      other_services_amount DECIMAL(12,2) NULL,
      vat_amount DECIMAL(12,2) NULL,
      grand_total DECIMAL(12,2) NULL,
      currency CHAR(3) NOT NULL DEFAULT 'SAR',
      payment_method VARCHAR(80) NOT NULL DEFAULT 'bank_transfer',
      contract_date DATE NULL,
      status ENUM('draft', 'sent', 'signed', 'cancelled') NOT NULL DEFAULT 'draft',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_sponsorship_contracts_number (contract_number),
      KEY idx_sponsorship_contracts_lead (lead_id),
      KEY idx_sponsorship_contracts_affiliate (affiliate_user_id),
      KEY idx_sponsorship_contracts_status (status),
      KEY idx_sponsorship_contracts_company (company_name),
      CONSTRAINT fk_sponsorship_contracts_affiliate_user
        FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

async function ensureRentalContractsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS rental_contracts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      contract_number VARCHAR(80) NOT NULL,
      lead_id BIGINT UNSIGNED NULL,
      affiliate_user_id BIGINT UNSIGNED NULL,
      event_name VARCHAR(190) NULL,
      event_dates VARCHAR(190) NULL,
      event_location VARCHAR(190) NULL,
      first_party_cr VARCHAR(80) NULL,
      first_party_representative VARCHAR(190) NULL,
      second_party_cr VARCHAR(80) NULL,
      second_party_representative VARCHAR(190) NULL,
      booth_number VARCHAR(80) NULL,
      participation_category VARCHAR(120) NULL,
      booth_size VARCHAR(80) NULL,
      lessor_name VARCHAR(190) NULL,
      tenant_name VARCHAR(190) NULL,
      company_name VARCHAR(190) NOT NULL,
      contact_name VARCHAR(190) NOT NULL,
      email VARCHAR(190) NULL,
      phone VARCHAR(80) NULL,
      address VARCHAR(255) NULL,
      city VARCHAR(120) NULL,
      country VARCHAR(120) NULL,
      rental_item VARCHAR(255) NOT NULL,
      rental_location VARCHAR(190) NULL,
      lease_start_date DATE NULL,
      lease_end_date DATE NULL,
      unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      currency CHAR(3) NOT NULL DEFAULT 'SAR',
      payment_method VARCHAR(80) NOT NULL DEFAULT 'bank_transfer',
      contract_date DATE NULL,
      status ENUM('draft', 'sent', 'signed', 'cancelled') NOT NULL DEFAULT 'draft',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_rental_contracts_number (contract_number),
      KEY idx_rental_contracts_lead (lead_id),
      KEY idx_rental_contracts_affiliate (affiliate_user_id),
      KEY idx_rental_contracts_status (status),
      KEY idx_rental_contracts_company (company_name),
      CONSTRAINT fk_rental_contracts_affiliate_user
        FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  const rentalExtraColumns: Array<[string, string]> = [
    ["event_name", "ALTER TABLE rental_contracts ADD COLUMN event_name VARCHAR(190) NULL AFTER affiliate_user_id"],
    ["event_dates", "ALTER TABLE rental_contracts ADD COLUMN event_dates VARCHAR(190) NULL AFTER event_name"],
    ["event_location", "ALTER TABLE rental_contracts ADD COLUMN event_location VARCHAR(190) NULL AFTER event_dates"],
    ["first_party_cr", "ALTER TABLE rental_contracts ADD COLUMN first_party_cr VARCHAR(80) NULL AFTER event_location"],
    ["first_party_representative", "ALTER TABLE rental_contracts ADD COLUMN first_party_representative VARCHAR(190) NULL AFTER first_party_cr"],
    ["second_party_cr", "ALTER TABLE rental_contracts ADD COLUMN second_party_cr VARCHAR(80) NULL AFTER first_party_representative"],
    ["second_party_representative", "ALTER TABLE rental_contracts ADD COLUMN second_party_representative VARCHAR(190) NULL AFTER second_party_cr"],
    ["booth_number", "ALTER TABLE rental_contracts ADD COLUMN booth_number VARCHAR(80) NULL AFTER second_party_representative"],
    ["participation_category", "ALTER TABLE rental_contracts ADD COLUMN participation_category VARCHAR(120) NULL AFTER booth_number"],
    ["booth_size", "ALTER TABLE rental_contracts ADD COLUMN booth_size VARCHAR(80) NULL AFTER participation_category"],
  ];
  for (const [column, statement] of rentalExtraColumns) {
    if (!(await columnExists("rental_contracts", column))) {
      await db.execute(statement);
    }
  }
  await ensureRentalBoothsTable();
  await ensureRentalBoothContractRelation();
  await syncRentalBoothsFromContracts();
}

function normalizedBoothNumber(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

async function ensureRentalBoothsTable() {
  await ensureBoothTable();
  await db.execute(
    `CREATE TABLE IF NOT EXISTS rental_booths (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      rental_contract_id BIGINT UNSIGNED NOT NULL,
      booth_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_rental_booths_booth (booth_id),
      UNIQUE KEY uq_rental_booths_contract_booth (rental_contract_id, booth_id),
      KEY idx_rental_booths_contract (rental_contract_id),
      CONSTRAINT fk_rental_booths_contract
        FOREIGN KEY (rental_contract_id) REFERENCES rental_contracts(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_rental_booths_booth
        FOREIGN KEY (booth_id) REFERENCES booth(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  if (await columnExists("rental_booths", "booth_number")) {
    await db.execute("DROP TABLE IF EXISTS rental_booths_next");
    await db.execute(
      `CREATE TABLE rental_booths_next (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        rental_contract_id BIGINT UNSIGNED NOT NULL,
        booth_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_rental_booths_next_booth (booth_id),
        UNIQUE KEY uq_rental_booths_next_contract_booth (rental_contract_id, booth_id),
        KEY idx_rental_booths_next_contract (rental_contract_id),
        CONSTRAINT fk_rental_booths_next_contract
          FOREIGN KEY (rental_contract_id) REFERENCES rental_contracts(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_rental_booths_next_booth
          FOREIGN KEY (booth_id) REFERENCES booth(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
    await db.execute(
      `INSERT INTO booth (booth_number, booth_size, booth_dimensions, status)
        SELECT UPPER(TRIM(rb.booth_number)),
               REPLACE(MAX(rb.booth_size), '?', ''),
               REPLACE(MAX(rb.booth_size), '?', ''),
               'available'
          FROM rental_booths rb
         WHERE rb.booth_number IS NOT NULL
           AND TRIM(rb.booth_number) <> ''
         GROUP BY UPPER(TRIM(rb.booth_number))
        ON DUPLICATE KEY UPDATE
          booth_size = REPLACE(COALESCE(booth.booth_size, VALUES(booth_size)), '?', ''),
          booth_dimensions = COALESCE(booth.booth_dimensions, VALUES(booth_dimensions))`,
    );
    await db.execute(
      `INSERT IGNORE INTO rental_booths_next (rental_contract_id, booth_id, created_at)
        SELECT rb.rental_contract_id, b.id, COALESCE(rb.created_at, CURRENT_TIMESTAMP)
          FROM rental_booths rb
          JOIN booth b ON b.booth_number = UPPER(TRIM(rb.booth_number))
          JOIN rental_contracts rc ON rc.id = rb.rental_contract_id
         WHERE rb.rental_contract_id IS NOT NULL
           AND rb.booth_number IS NOT NULL
           AND TRIM(rb.booth_number) <> ''
           AND COALESCE(rc.status, 'draft') <> 'cancelled'`,
    );
    await db.execute("DROP TABLE rental_booths");
    await db.execute("RENAME TABLE rental_booths_next TO rental_booths");
  }
}

async function ensureBoothTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS booth (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      booth_number VARCHAR(80) NOT NULL,
      booth_size VARCHAR(80) NULL,
      booth_dimensions VARCHAR(120) NULL,
      booth_category VARCHAR(120) NULL,
      hall VARCHAR(120) NULL,
      location_zone VARCHAR(120) NULL,
      status ENUM('available', 'inactive') NOT NULL DEFAULT 'available',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_booth_number (booth_number),
      KEY idx_booth_status (status),
      KEY idx_booth_category (booth_category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  if (!(await columnExists("booth", "booth_dimensions"))) {
    await db.execute(
      "ALTER TABLE booth ADD COLUMN booth_dimensions VARCHAR(120) NULL AFTER booth_size",
    );
  }
  await db.execute(
    "UPDATE booth SET booth_size = REPLACE(booth_size, '?', '') WHERE booth_size LIKE '%?%'",
  );
}

async function syncBoothCatalogFromRentalBooths() {
  await ensureBoothTable();
  await ensureRentalBoothsTable();
  if (!(await columnExists("rental_booths", "booth_number"))) return;
  await db.execute(
    `INSERT INTO booth (booth_number, booth_size, booth_dimensions, status)
      SELECT rb.booth_number, REPLACE(MAX(rb.booth_size), '?', ''), REPLACE(MAX(rb.booth_size), '?', ''), 'available'
        FROM rental_booths rb
       WHERE rb.booth_number IS NOT NULL
         AND TRIM(rb.booth_number) <> ''
       GROUP BY rb.booth_number
      ON DUPLICATE KEY UPDATE
        booth_size = REPLACE(COALESCE(booth.booth_size, VALUES(booth_size)), '?', ''),
        booth_dimensions = COALESCE(booth.booth_dimensions, VALUES(booth_dimensions))`,
  );
}

const defaultBoothCatalog: Array<{number: string; size: string}> = [
  ["ST04", "25m?"], ["ST03", "25m?"], ["TP01", "36m?"], ["ST02", "25m?"], ["ST01", "25m?"],
  ["FL1", ""], ["FL24", ""], ["RL3", "9m?"], ["M25", "9m?"], ["M19", "9m?"], ["M13", "9m?"], ["M05", "9m?"],
  ["RL1", "18m?"], ["RL2", "18m?"], ["M33", "12m?"], ["M01", "18m?"], ["FL2", ""], ["FL23", ""],
  ["M26", "9m?"], ["M20", "9m?"], ["M14", "9m?"], ["M06", "9m?"], ["RL4", "9m?"], ["FL3", ""], ["FL22", ""],
  ["M34", "12m?"], ["FL4", ""], ["FL21", ""], ["RL34", "9m?"], ["M29", "9m?"], ["M07", "9m?"], ["M21", "9m?"],
  ["M15", "9m?"], ["RL5", "9m?"], ["FL5", ""], ["FL20", ""], ["RL6", "9m?"], ["RL35", "12m?"], ["RL32", "12m?"],
  ["FL6", ""], ["FL19", ""], ["M02", "18m?"], ["SB1", ""], ["FL7", ""], ["FL18", ""], ["RL7", "9m?"],
  ["M08", "12m?"], ["SB2", ""], ["RL36", "9m?"], ["RL31", "9m?"], ["FL8", ""], ["FL17", ""], ["SB3", ""],
  ["RL8", "9m?"], ["FL9", ""], ["FL16", ""], ["M09", "12m?"], ["SB4", ""], ["FL10", ""], ["FL15", ""],
  ["RL9", "9m?"], ["RL29", "9m?"], ["RL15", "9m?"], ["RL13", "9m?"], ["M03", "18m?"], ["SB5", ""],
  ["FL11", ""], ["FL14", ""], ["SB6", ""], ["RL26", "12m?"], ["RL25", "9m?"], ["RL16", "9m?"], ["RL14", "9m?"],
  ["RL10", "9m?"], ["FL12", ""], ["FL13", ""], ["M30", "9m?"], ["M22", "9m?"], ["M16", "9m?"], ["M10", "9m?"],
  ["SB7", ""], ["SB8", ""], ["M31", "9m?"], ["M23", "9m?"], ["M17", "9m?"], ["M11", "9m?"], ["RL21", "9m?"],
  ["RL19", "9m?"], ["RL27", "9m?"], ["SB9", ""], ["M04", "18m?"], ["RL22", "9m?"], ["RL20", "9m?"],
  ["M32", "9m?"], ["M24", "9m?"], ["M18", "9m?"], ["M12", "9m?"], ["RL24", "12m?"], ["RL23", "9m?"],
  ["IN2", "12m?"], ["IN3", "12m?"], ["IN4", "12m?"], ["IN5", "12m?"], ["IN6", "12m?"], ["IN1", "18m?"],
  ["IN11", "12m?"], ["IN10", "12m?"], ["IN9", "12m?"], ["IN8", "12m?"], ["IN7", "9m?"], ["IN12", "9m?"],
  ["IN13", "9m?"], ["IN14", "9m?"], ["IN15", "9m?"], ["IN16", "9m?"], ["IN17", "9m?"], ["IN18", "9m?"],
  ["IN19", "9m?"], ["IN20", "9m?"],
].map(([number, size]) => ({number, size}));

async function seedDefaultBoothCatalog() {
  await ensureBoothTable();
  await Promise.all(
    defaultBoothCatalog.map((booth) =>
      db.execute(
        `INSERT INTO booth (booth_number, booth_size, booth_dimensions, status)
          VALUES (?, ?, ?, 'available')
          ON DUPLICATE KEY UPDATE
            booth_size = REPLACE(COALESCE(booth.booth_size, VALUES(booth_size)), '?', ''),
            booth_dimensions = COALESCE(booth.booth_dimensions, VALUES(booth_dimensions))`,
        [booth.number, booth.size.replace("?", "") || null, booth.size.replace("?", "") || null],
      ),
    ),
  );
}

async function ensureRentalBoothContractRelation() {
  await ensureRentalBoothsTable();
}

async function syncRentalBoothsFromContracts() {
  await ensureRentalBoothsTable();
  if (!(await tableExists("rental_contracts"))) return;
  await db.execute(
    `INSERT INTO booth (booth_number, booth_size, booth_dimensions, status)
      SELECT UPPER(TRIM(rc.booth_number)),
             REPLACE(MAX(rc.booth_size), '?', ''),
             REPLACE(MAX(rc.booth_size), '?', ''),
             'available'
        FROM rental_contracts rc
       WHERE rc.booth_number IS NOT NULL
         AND TRIM(rc.booth_number) <> ''
       GROUP BY UPPER(TRIM(rc.booth_number))
      ON DUPLICATE KEY UPDATE
        booth_size = REPLACE(COALESCE(booth.booth_size, VALUES(booth_size)), '?', ''),
        booth_dimensions = COALESCE(booth.booth_dimensions, VALUES(booth_dimensions))`,
  );
  await db.execute(
    `DELETE rb
       FROM rental_booths rb
       LEFT JOIN rental_contracts rc
         ON rc.id = rb.rental_contract_id
      WHERE rc.id IS NULL
         OR COALESCE(rc.status, 'draft') = 'cancelled'
         OR rc.booth_number IS NULL
         OR TRIM(rc.booth_number) = ''`,
  );
  await db.execute(
    `INSERT IGNORE INTO rental_booths (rental_contract_id, booth_id)
      SELECT rc.id, b.id
        FROM rental_contracts rc
        JOIN booth b ON b.booth_number = UPPER(TRIM(rc.booth_number))
       WHERE rc.booth_number IS NOT NULL
         AND TRIM(rc.booth_number) <> ''
         AND COALESCE(rc.status, 'draft') <> 'cancelled'`,
  );
}

async function assertRentalBoothAvailable(
  boothNumber: unknown,
  currentContractId?: number,
) {
  const normalized = normalizedBoothNumber(boothNumber);
  if (!normalized) return;
  await syncRentalBoothsFromContracts();
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT rb.rental_contract_id
       FROM rental_booths rb
       JOIN booth b ON b.id = rb.booth_id
      WHERE b.booth_number = ?
      LIMIT 1`,
    [normalized],
  );
  const booking = rows[0];
  if (
    booking &&
    (!currentContractId ||
      Number(booking.rental_contract_id ?? 0) !== Number(currentContractId))
  ) {
    throw new Error("BOOTH_ALREADY_BOOKED");
  }
}

async function syncRentalBoothForContract(contractId: number) {
  await ensureRentalBoothsTable();
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT booth_number, booth_size, status
       FROM rental_contracts
      WHERE id = ?
      LIMIT 1`,
    [contractId],
  );
  await db.execute("DELETE FROM rental_booths WHERE rental_contract_id = ?", [contractId]);
  const contract = rows[0];
  const boothNumber = normalizedBoothNumber(contract?.booth_number);
  if (!boothNumber || String(contract?.status ?? "draft").toLowerCase() === "cancelled") return;
  await db.execute(
    `INSERT INTO booth (booth_number, booth_size, booth_dimensions, status)
      VALUES (?, ?, ?, 'available')
      ON DUPLICATE KEY UPDATE
        booth_size = REPLACE(COALESCE(booth.booth_size, VALUES(booth_size)), '?', ''),
        booth_dimensions = COALESCE(booth.booth_dimensions, VALUES(booth_dimensions))`,
    [
      boothNumber,
      String(contract?.booth_size ?? "").replaceAll("?", "").trim() || null,
      String(contract?.booth_size ?? "").replaceAll("?", "").trim() || null,
    ],
  );
  await db.execute(
    `INSERT INTO rental_booths (rental_contract_id, booth_id)
      SELECT ?, id FROM booth WHERE booth_number = ?
      ON DUPLICATE KEY UPDATE rental_contract_id = VALUES(rental_contract_id)`,
    [contractId, boothNumber],
  );
}

async function ensureSalesOrdersTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS sales_orders (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      order_number VARCHAR(80) NOT NULL,
      lead_id BIGINT UNSIGNED NULL,
      affiliate_user_id BIGINT UNSIGNED NULL,
      company_name VARCHAR(190) NOT NULL,
      contact_name VARCHAR(190) NOT NULL,
      email VARCHAR(190) NULL,
      phone VARCHAR(80) NULL,
      address VARCHAR(255) NULL,
      city VARCHAR(120) NULL,
      country VARCHAR(120) NULL,
      exhibition_name VARCHAR(190) NOT NULL DEFAULT 'Rawnaq Elegance Expo - Dec 2026',
      stand_number VARCHAR(80) NULL,
      item_description VARCHAR(255) NOT NULL,
      uom VARCHAR(40) NOT NULL DEFAULT 'SQM',
      unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      currency CHAR(3) NOT NULL DEFAULT 'SAR',
      payment_method VARCHAR(80) NOT NULL DEFAULT 'bank_transfer',
      order_date DATE NULL,
      status ENUM('draft', 'sent', 'approved', 'cancelled') NOT NULL DEFAULT 'draft',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_sales_orders_number (order_number),
      KEY idx_sales_orders_lead (lead_id),
      KEY idx_sales_orders_affiliate (affiliate_user_id),
      KEY idx_sales_orders_status (status),
      KEY idx_sales_orders_company (company_name),
      CONSTRAINT fk_sales_orders_affiliate_user
        FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

async function ensureMarketingAssetsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS marketing_assets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NULL,
      title VARCHAR(200) NOT NULL,
      asset_type ENUM('image','video','document','other') NOT NULL DEFAULT 'other',
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) NULL,
      file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
      file_path VARCHAR(500) NOT NULL,
      file_data LONGBLOB NULL,
      description TEXT NULL,
      status ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_marketing_assets_user (user_id),
      KEY idx_marketing_assets_type_status (asset_type, status),
      CONSTRAINT fk_marketing_assets_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  const [columns] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'marketing_assets'
        AND COLUMN_NAME = 'file_data'`,
  );
  if (!columns.length) {
    await db.execute(
      `ALTER TABLE marketing_assets ADD COLUMN file_data LONGBLOB NULL AFTER file_path`,
    );
  }
}

async function ensureLeadTagsTable() {
  await ensureLeadTagTypesTable();
  await db.execute(
    `CREATE TABLE IF NOT EXISTS tags (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      tag_type_id BIGINT UNSIGNED NULL,
      tag_name VARCHAR(120) NOT NULL,
      tag_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_tags_tag_type_id (tag_type_id),
      UNIQUE KEY uq_tags_type_name (tag_type_id, tag_name)
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
      `ALTER TABLE tags ADD COLUMN tag_type_id BIGINT UNSIGNED NULL AFTER id`,
    );
    await db.execute(`ALTER TABLE tags ADD INDEX idx_tags_tag_type_id (tag_type_id)`);
  }

  const [assignmentTables] = await db.execute<RowDataPacket[]>(
    `SELECT TABLE_NAME
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'lead_tag_assignments'
      LIMIT 1`,
  );
  if (assignmentTables.length) {
    await db.execute(
      `DELETE newer
        FROM lead_tag_assignments newer
        JOIN tags duplicate_tag ON duplicate_tag.id = newer.tag_id
        JOIN tags canonical_tag
          ON canonical_tag.tag_type_id = duplicate_tag.tag_type_id
         AND canonical_tag.tag_name = duplicate_tag.tag_name
         AND canonical_tag.id < duplicate_tag.id
        JOIN lead_tag_assignments older
          ON older.lead_id = newer.lead_id
         AND older.tag_id = canonical_tag.id`,
    );
    await db.execute(
      `UPDATE lead_tag_assignments lta
        JOIN tags duplicate_tag ON duplicate_tag.id = lta.tag_id
        JOIN tags canonical_tag
          ON canonical_tag.tag_type_id = duplicate_tag.tag_type_id
         AND canonical_tag.tag_name = duplicate_tag.tag_name
         AND canonical_tag.id < duplicate_tag.id
         SET lta.tag_id = canonical_tag.id`,
    );
  }
  await db.execute(
    `DELETE duplicate_tag
       FROM tags duplicate_tag
       JOIN tags canonical_tag
         ON canonical_tag.tag_type_id = duplicate_tag.tag_type_id
        AND canonical_tag.tag_name = duplicate_tag.tag_name
        AND canonical_tag.id < duplicate_tag.id`,
  );

  const [typeUnique] = await db.execute<RowDataPacket[]>(
    `SELECT 1
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tags'
        AND INDEX_NAME = 'uq_tags_type_name'
      LIMIT 1`,
  );
  if (!typeUnique.length) {
    await db.execute(
      `ALTER TABLE tags ADD UNIQUE KEY uq_tags_type_name (tag_type_id, tag_name)`,
    );
  }

  const [companyColumns] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tags'
        AND COLUMN_NAME = 'company_id'
      LIMIT 1`,
  );
  if (companyColumns.length) {
    const [companyIndexes] = await db.execute<RowDataPacket[]>(
      `SELECT DISTINCT INDEX_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tags'
          AND COLUMN_NAME = 'company_id'
          AND INDEX_NAME <> 'PRIMARY'`,
    );
    for (const row of companyIndexes) {
      await db.execute(`ALTER TABLE tags DROP INDEX \`${row.INDEX_NAME}\``);
    }
    await db.execute(`ALTER TABLE tags DROP COLUMN company_id`);
  }

  const [affiliateColumns] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tags'
        AND COLUMN_NAME = 'affiliate_user_id'
      LIMIT 1`,
  );
  if (affiliateColumns.length) {
    const [foreignKeys] = await db.execute<RowDataPacket[]>(
      `SELECT CONSTRAINT_NAME
         FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tags'
          AND COLUMN_NAME = 'affiliate_user_id'
          AND REFERENCED_TABLE_NAME IS NOT NULL`,
    );
    for (const row of foreignKeys) {
      await db.execute(`ALTER TABLE tags DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
    }
    const [oldIndexes] = await db.execute<RowDataPacket[]>(
      `SELECT DISTINCT INDEX_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tags'
          AND COLUMN_NAME = 'affiliate_user_id'
          AND INDEX_NAME <> 'PRIMARY'`,
    );
    for (const row of oldIndexes) {
      await db.execute(`ALTER TABLE tags DROP INDEX \`${row.INDEX_NAME}\``);
    }
    await db.execute(`ALTER TABLE tags DROP COLUMN affiliate_user_id`);
  }
}

async function ensureLeadTagTypesTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS tag_types (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company_id BIGINT UNSIGNED NOT NULL,
      type_name VARCHAR(120) NOT NULL,
      type_color VARCHAR(24) NOT NULL DEFAULT '#00b4d8',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_tag_types_company_id (company_id),
      UNIQUE KEY uq_tag_types_company_name (company_id, type_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  const [companyColumns] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tag_types'
        AND COLUMN_NAME = 'company_id'
      LIMIT 1`,
  );
  if (!companyColumns.length) {
    await db.execute(
      `ALTER TABLE tag_types ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id`,
    );
    const [affiliateColumns] = await db.execute<RowDataPacket[]>(
      `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tag_types'
          AND COLUMN_NAME = 'affiliate_user_id'
        LIMIT 1`,
    );
    if (affiliateColumns.length) {
      await db.execute(
        `UPDATE tag_types tt
          JOIN users u ON u.id = tt.affiliate_user_id
           SET tt.company_id = COALESCE(u.CompanyID, u.id)
         WHERE tt.company_id IS NULL`,
      );
    }
    await db.execute(
      `UPDATE tag_types SET company_id = 0 WHERE company_id IS NULL`,
    );
    await db.execute(
      `ALTER TABLE tag_types MODIFY company_id BIGINT UNSIGNED NOT NULL`,
    );
  }
  await db.execute(
    `UPDATE tag_types tt
      JOIN users legacy_user ON legacy_user.id = tt.company_id
      LEFT JOIN users company_user ON company_user.CompanyID = tt.company_id
       SET tt.company_id = legacy_user.CompanyID
     WHERE legacy_user.CompanyID IS NOT NULL
       AND company_user.id IS NULL`,
  );

  const [companyIndex] = await db.execute<RowDataPacket[]>(
    `SELECT 1
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tag_types'
        AND INDEX_NAME = 'idx_tag_types_company_id'
      LIMIT 1`,
  );
  if (!companyIndex.length) {
    await db.execute(
      `ALTER TABLE tag_types ADD INDEX idx_tag_types_company_id (company_id)`,
    );
  }

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
  await db.execute(
    `DELETE duplicate_type
       FROM tag_types duplicate_type
       JOIN tag_types canonical_type
         ON canonical_type.company_id = duplicate_type.company_id
        AND canonical_type.type_name = duplicate_type.type_name
        AND canonical_type.id < duplicate_type.id`,
  );

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
      `ALTER TABLE tag_types ADD UNIQUE KEY uq_tag_types_company_name (company_id, type_name)`,
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
    const [foreignKeys] = await db.execute<RowDataPacket[]>(
      `SELECT CONSTRAINT_NAME
         FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tag_types'
          AND COLUMN_NAME = 'affiliate_user_id'
          AND REFERENCED_TABLE_NAME IS NOT NULL`,
    );
    for (const row of foreignKeys) {
      await db.execute(`ALTER TABLE tag_types DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
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
    await db.execute(`ALTER TABLE tag_types DROP COLUMN affiliate_user_id`);
  }
}

async function ensureLeadTagAssignmentsTable() {
  await ensureLeadTagsTable();
  await db.execute(
    `CREATE TABLE IF NOT EXISTS lead_tag_assignments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      lead_id BIGINT UNSIGNED NOT NULL,
      tag_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_lead_tag_assignments_lead_id (lead_id),
      INDEX idx_lead_tag_assignments_tag_id (tag_id),
      UNIQUE KEY uq_lead_tag_assignments (lead_id, tag_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  await db.execute(
    `DELETE newer FROM lead_tag_assignments newer
      JOIN lead_tag_assignments older
        ON older.lead_id = newer.lead_id
       AND older.tag_id = newer.tag_id
       AND older.id < newer.id`,
  );
  await db.execute(
    `DELETE newer FROM lead_tag_assignments newer
      JOIN lead_tag_assignments older
        ON older.lead_id = newer.lead_id
      JOIN tags newer_tag ON newer_tag.id = newer.tag_id
      JOIN tags older_tag ON older_tag.id = older.tag_id
       AND older_tag.tag_type_id = newer_tag.tag_type_id
       AND older.id < newer.id
     WHERE newer_tag.tag_type_id IS NOT NULL`,
  );
  const [oldUniqueIndexes] = await db.execute<RowDataPacket[]>(
    `SELECT DISTINCT INDEX_NAME
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'lead_tag_assignments'
        AND INDEX_NAME IN ('uq_lead_tag_assignments', 'uq_lead_tag_assignments_type')`,
  );
  for (const row of oldUniqueIndexes) {
    await db.execute(
      `ALTER TABLE lead_tag_assignments DROP INDEX \`${row.INDEX_NAME}\``,
    );
  }
  const [affiliateColumns] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'lead_tag_assignments'
        AND COLUMN_NAME = 'affiliate_user_id'
      LIMIT 1`,
  );
  if (affiliateColumns.length) {
    const [foreignKeys] = await db.execute<RowDataPacket[]>(
      `SELECT CONSTRAINT_NAME
         FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'lead_tag_assignments'
          AND COLUMN_NAME = 'affiliate_user_id'
          AND REFERENCED_TABLE_NAME IS NOT NULL`,
    );
    for (const row of foreignKeys) {
      await db.execute(
        `ALTER TABLE lead_tag_assignments DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
      );
    }
    const [oldIndexes] = await db.execute<RowDataPacket[]>(
      `SELECT DISTINCT INDEX_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'lead_tag_assignments'
          AND COLUMN_NAME = 'affiliate_user_id'
          AND INDEX_NAME <> 'PRIMARY'`,
    );
    for (const row of oldIndexes) {
      await db.execute(
        `ALTER TABLE lead_tag_assignments DROP INDEX \`${row.INDEX_NAME}\``,
      );
    }
    await db.execute(
      `ALTER TABLE lead_tag_assignments DROP COLUMN affiliate_user_id`,
    );
  }
  const [tagTypeColumns] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'lead_tag_assignments'
        AND COLUMN_NAME = 'tag_type_id'
      LIMIT 1`,
  );
  if (tagTypeColumns.length) {
    const [tagTypeIndexes] = await db.execute<RowDataPacket[]>(
      `SELECT DISTINCT INDEX_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'lead_tag_assignments'
          AND COLUMN_NAME = 'tag_type_id'
          AND INDEX_NAME <> 'PRIMARY'`,
    );
    for (const row of tagTypeIndexes) {
      await db.execute(
        `ALTER TABLE lead_tag_assignments DROP INDEX \`${row.INDEX_NAME}\``,
      );
    }
    await db.execute(
      `ALTER TABLE lead_tag_assignments DROP COLUMN tag_type_id`,
    );
  }
  const [uniqueTagIndex] = await db.execute<RowDataPacket[]>(
    `SELECT 1
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'lead_tag_assignments'
        AND INDEX_NAME = 'uq_lead_tag_assignments'
      LIMIT 1`,
  );
  if (!uniqueTagIndex.length) {
    await db.execute(
      `ALTER TABLE lead_tag_assignments ADD UNIQUE KEY uq_lead_tag_assignments (lead_id, tag_id)`,
    );
  }
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

async function ensureSupportTicketTypesTable(session?: MiddarSession) {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS support_ticket_types (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company_id BIGINT UNSIGNED NOT NULL,
      name_ar VARCHAR(120) NOT NULL,
      name_en VARCHAR(120) NOT NULL,
      description TEXT NULL,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_support_ticket_types_company_name_ar (company_id, name_ar),
      INDEX idx_support_ticket_types_company_status (company_id, status, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  if (!session) return;
  const companyId = await companyIdForSession(session);
  const defaults = [
    ["مشكلة عمولة", "Commission Issue", "استفسارات ومشاكل العمولات", 10],
    ["دعم الحساب", "Account Support", "طلبات الحساب والصلاحيات", 20],
    ["مشكلة تقنية", "Technical Issue", "المشاكل التقنية في النظام", 30],
  ] as const;
  for (const [nameAr, nameEn, description, sortOrder] of defaults) {
    await db.execute(
      `INSERT IGNORE INTO support_ticket_types
        (company_id, name_ar, name_en, description, status, sort_order)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [companyId, nameAr, nameEn, description, sortOrder],
    );
  }
}

async function ensureSupportTicketsUserRelation() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS support_tickets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      ticket_number VARCHAR(80) NOT NULL,
      user_id BIGINT UNSIGNED NULL,
      category VARCHAR(120) NOT NULL,
      subject VARCHAR(180) NOT NULL,
      details TEXT NOT NULL,
      notes TEXT NULL,
      status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
      priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_support_tickets_number (ticket_number),
      KEY idx_support_tickets_status_priority (status, priority),
      KEY idx_support_tickets_user (user_id),
      CONSTRAINT fk_support_tickets_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  if (!(await columnExists("support_tickets", "user_id"))) {
    await db.execute(
      "ALTER TABLE support_tickets ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER ticket_number",
    );
  }
  await db.execute(
    `UPDATE support_tickets t
      LEFT JOIN users u ON u.id = t.user_id
       SET t.user_id = NULL
     WHERE t.user_id IS NOT NULL AND u.id IS NULL`,
  );

  const [indexes] = await db.execute<RowDataPacket[]>(
    `SELECT 1
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'support_tickets'
        AND INDEX_NAME = 'idx_support_tickets_user'
      LIMIT 1`,
  );
  if (!indexes.length) {
    await db.execute(
      "ALTER TABLE support_tickets ADD INDEX idx_support_tickets_user (user_id)",
    );
  }

  const [foreignKeys] = await db.execute<RowDataPacket[]>(
    `SELECT 1
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'support_tickets'
        AND COLUMN_NAME = 'user_id'
        AND REFERENCED_TABLE_NAME = 'users'
        AND REFERENCED_COLUMN_NAME = 'id'
      LIMIT 1`,
  );
  if (!foreignKeys.length) {
    await db.execute("ALTER TABLE support_tickets MODIFY user_id BIGINT UNSIGNED NULL");
    await db.execute(
      `ALTER TABLE support_tickets
         ADD CONSTRAINT fk_support_tickets_user
         FOREIGN KEY (user_id) REFERENCES users(id)
         ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }
}

async function ensureTeamMembersTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS team_members (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      assign_member BIGINT UNSIGNED NULL,
      name VARCHAR(160) NOT NULL,
      phone VARCHAR(40) NULL,
      email VARCHAR(190) NULL,
      status ENUM('active', 'pending', 'inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_team_members_user_status (user_id, status),
      KEY idx_team_members_assign_member (assign_member)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  if (!(await columnExists("team_members", "assign_member"))) {
    await db.execute(
      "ALTER TABLE team_members ADD COLUMN assign_member BIGINT UNSIGNED NULL AFTER user_id",
    );
  }
  await db.execute(
    `UPDATE team_members tm
      JOIN users member_user
        ON (
          tm.phone IS NOT NULL
          AND tm.phone <> ''
          AND REPLACE(REPLACE(REPLACE(member_user.phone, ' ', ''), '-', ''), '(', '') = REPLACE(REPLACE(REPLACE(tm.phone, ' ', ''), '-', ''), '(', '')
        )
        OR (
          tm.email IS NOT NULL
          AND tm.email <> ''
          AND LOWER(member_user.email) = LOWER(tm.email)
        )
       SET tm.assign_member = member_user.id
     WHERE tm.assign_member IS NULL`,
  );
  await db.execute(
    `UPDATE users member_user
      JOIN team_members tm ON tm.assign_member = member_user.id
       SET member_user.manager_id = tm.user_id
     WHERE member_user.manager_id IS NULL`,
  );
}

async function assignedTeamMemberUserId(data: Record<string, SqlValue>) {
  const phone = String(data.phone ?? "").replace(/[^\d+]/g, "");
  const email = String(data.email ?? "").trim();
  if (!phone && !email) return null;
  const filters: string[] = [];
  const params: SqlValue[] = [];
  if (phone) {
    filters.push("REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', '') = ?");
    params.push(phone);
  }
  if (email) {
    filters.push("LOWER(email) = LOWER(?)");
    params.push(email);
  }
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id FROM users WHERE ${filters.join(" OR ")} ORDER BY id ASC LIMIT 1`,
    params,
  );
  return rows[0]?.id ? Number(rows[0].id) : null;
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
  if (resource === "marketing-assets") {
    await ensureResourceTable(resource);
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id,user_id,title,asset_type,original_name,mime_type,file_size,file_path,
              IF(file_data IS NULL, 0, OCTET_LENGTH(file_data)) AS file_data_size,
              description,status,created_at,updated_at
         FROM marketing_assets
        WHERE status = 'active'
        ORDER BY created_at DESC
        LIMIT 250`,
    );
    return rows;
  }
  await assertResourcePermission(definition, session, "can_view");
  await ensureResourceTable(resource);

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
  if (resource === "support-ticket-types") {
    await ensureSupportTicketTypesTable(session);
  }
  if (resource === "support-tickets") {
    await ensureSupportTicketsUserRelation();
  }

  if (resource === "demo-requests") {
    await closeExpiredDemoRequests();
  }
  if (resource === "quotes") {
    await closeExpiredQuotes();
  }

  const { clause: where, params } =
    resource === "lead-tag-types" || resource === "support-ticket-types"
      ? await tagTypeCompanyFilter(session)
      : await ownerFilter(definition, session);

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

  if (resource === "sales-orders") {
    const { clause: scopedWhere, params: scopedParams } = await ownerFilter(
      definition,
      session,
      "so.",
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT so.*, l.name customer_name, l.company_name lead_company_name
         FROM sales_orders so
         LEFT JOIN leads l ON l.id = so.lead_id
        ${scopedWhere}
        ORDER BY so.created_at DESC LIMIT 250`,
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

  if (resource === "stock") {
    const { clause: scopedWhere, params: scopedParams } = await ownerFilter(
      definition,
      session,
      "st.",
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT st.*, s.company_name store_name,
              p.name product_name, p.name_en product_name_en
         FROM stock st
         JOIN \`store\` s ON s.id = st.store_id
         LEFT JOIN products p ON p.id = st.product_id
        ${scopedWhere}
        ORDER BY st.created_at DESC LIMIT 250`,
      scopedParams,
    );
    return rows;
  }

  if (resource === "participation-contracts") {
    const { clause: scopedWhere, params: scopedParams } = await ownerFilter(
      definition,
      session,
      "pc.",
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT pc.*, l.name customer_name, l.company_name lead_company_name
         FROM participation_contracts pc
         LEFT JOIN leads l ON l.id = pc.lead_id
        ${scopedWhere}
        ORDER BY pc.created_at DESC LIMIT 250`,
      scopedParams,
    );
    return rows;
  }

  if (resource === "sponsorship-contracts") {
    const { clause: scopedWhere, params: scopedParams } = await ownerFilter(
      definition,
      session,
      "sc.",
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT sc.*, l.name customer_name, l.company_name lead_company_name
         FROM sponsorship_contracts sc
         LEFT JOIN leads l ON l.id = sc.lead_id
        ${scopedWhere}
        ORDER BY sc.created_at DESC LIMIT 250`,
      scopedParams,
    );
    return rows;
  }

  if (resource === "rental-contracts") {
    const { clause: scopedWhere, params: scopedParams } = await ownerFilter(
      definition,
      session,
      "rc.",
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT rc.*, l.name customer_name, l.company_name lead_company_name
         FROM rental_contracts rc
         LEFT JOIN leads l ON l.id = rc.lead_id
        ${scopedWhere}
        ORDER BY rc.created_at DESC LIMIT 250`,
      scopedParams,
    );
    return rows;
  }

  if (resource === "rental-booths") {
    await syncRentalBoothsFromContracts();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT rb.id,
              rb.rental_contract_id,
              rb.booth_id,
              rb.created_at,
              'booked' AS status,
              b.booth_number,
              b.booth_size,
              b.booth_dimensions,
              b.booth_category,
              b.hall,
              b.location_zone,
              rc.contract_number,
              rc.company_name,
              rc.contact_name
         FROM rental_booths rb
         JOIN booth b ON b.id = rb.booth_id
         LEFT JOIN rental_contracts rc ON rc.id = rb.rental_contract_id
        ORDER BY b.booth_number ASC LIMIT 500`,
    );
    return rows;
  }

  if (resource === "leads") {
    const { clause: scopedWhere, params: scopedParams } = await ownerFilter(
      definition,
      session,
      "l.",
    );
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT l.*, u.name affiliate_user_name
         FROM leads l
         LEFT JOIN users u ON u.id = l.affiliate_user_id
        ${scopedWhere}
        ORDER BY l.created_at DESC`,
      scopedParams,
    );
    return rows;
  }

  if (resource === "lead-tags") {
    const { clause: scopedWhere, params: scopedParams } =
      await tagTypeCompanyFilter(session, "tt.");
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT t.*
         FROM tags t
         JOIN tag_types tt ON tt.id = t.tag_type_id
        ${scopedWhere}
        ORDER BY t.created_at DESC LIMIT 250`,
      scopedParams,
    );
    return rows;
  }

  if (resource === "lead-tag-assignments") {
    const { clause: scopedWhere, params: scopedParams } =
      await tagTypeCompanyFilter(session, "tt.");
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT lta.*
         FROM lead_tag_assignments lta
         JOIN tags t ON t.id = lta.tag_id
         JOIN tag_types tt ON tt.id = t.tag_type_id
        ${scopedWhere}
        ORDER BY lta.created_at DESC LIMIT 250`,
      scopedParams,
    );
    return rows;
  }

  if (resource === "support-ticket-types") {
    const { clause: scopedWhere, params: scopedParams } =
      await companyFilterForSession(session);
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM support_ticket_types${scopedWhere}
        ORDER BY sort_order ASC, created_at ASC LIMIT 250`,
      scopedParams,
    );
    return rows;
  }

  const rowLimit = resource === "leads" ? "" : " LIMIT 250";
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM ${definition.table}${where} ORDER BY created_at DESC${rowLimit}`,
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
  const prefix =
    resource === "quotes"
      ? "Q"
      : resource === "participation-contracts"
        ? "PC"
      : resource === "sponsorship-contracts"
        ? "SC"
        : resource === "rental-contracts"
          ? "RC"
          : resource === "sales-orders"
            ? "SO"
        : "TKT";
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

function hexToRgb(hex: string) {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "00b4d8";
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHex(startHex: string, endHex: string, ratio: number) {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  return rgbToHex({
    r: start.r + (end.r - start.r) * ratio,
    g: start.g + (end.g - start.g) * ratio,
    b: start.b + (end.b - start.b) * ratio,
  });
}

async function rebalanceLeadTagGradient(typeId: number, session: MiddarSession) {
  const [typeRows] = await db.execute<RowDataPacket[]>(
    `SELECT id, type_color
       FROM tag_types
      WHERE id = ? AND company_id = ?
      LIMIT 1`,
    [typeId, await companyIdForSession(session)],
  );
  const type = typeRows[0];
  if (!type) throw new Error("TAG_TYPE_NOT_FOUND");

  const [tagRows] = await db.execute<RowDataPacket[]>(
    `SELECT id
       FROM tags
      WHERE tag_type_id = ?
      ORDER BY id ASC`,
    [typeId],
  );
  if (!tagRows.length) return;

  const baseColor = String(type.type_color ?? "#00b4d8");
  const gradientEnd = "#11293d";
  await Promise.all(
    tagRows.map((tag, index) => {
      const ratio = tagRows.length === 1 ? 0 : index / (tagRows.length - 1);
      return db.execute(
        `UPDATE tags SET tag_color = ? WHERE id = ?`,
        [mixHex(baseColor, gradientEnd, ratio), Number(tag.id)],
      );
    }),
  );
}

const requiredFields: Partial<Record<BackendResource, readonly string[]>> = {
  products: ["name", "slug"],
  industries: ["name", "slug"],
  leads: ["company_name"],
  "lead-contacts": ["lead_id", "name"],
  "lead-notes": ["lead_id", "note"],
  "lead-tag-types": ["type_name"],
  "lead-tags": ["tag_type_id", "tag_name"],
  "lead-tag-assignments": ["lead_id", "tag_id"],
  "support-ticket-types": ["name_ar", "name_en"],
  stores: ["company_name"],
  stock: ["store_id", "item_name", "quantity"],
  "demo-requests": ["company_name", "contact_name"],
  quotes: ["lead_id", "product_id", "amount", "valid_until"],
  "participation-contracts": ["company_name", "contact_name", "package_type"],
  "sponsorship-contracts": ["company_name", "contact_name", "sponsorship_category"],
  "rental-contracts": ["company_name", "contact_name", "rental_item"],
  booths: ["booth_number"],
  "sales-orders": ["company_name", "contact_name", "item_description"],
  "support-tickets": ["category", "subject", "details"],
  "team-members": ["name", "phone"],
  "social-accounts": ["platform"],
  "payout-methods": ["bank_name", "account_holder_name", "iban"],
  "marketing-assets": ["title", "asset_type", "original_name", "file_path"],
  "educational-assets": ["title", "asset_type"],
};

export async function createResource(
  resource: string,
  payload: Record<string, unknown>,
  session: MiddarSession,
) {
  const definition = definitionFor(resource);
  await assertResourcePermission(definition, session, "can_create");
  await ensureResourceTable(resource);
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
  if (resource === "support-ticket-types") {
    await ensureSupportTicketTypesTable(session);
  }
  if (resource === "support-tickets") {
    await ensureSupportTicketsUserRelation();
  }
  if (resource === "quotes") {
    await closeExpiredQuotes();
  }
  if (definition.writable.length === 0) throw new Error("READ_ONLY_RESOURCE");

  const data = cleanPayload(definition, payload);
  if (resource === "lead-contacts" && data.phone)
    data.phone = String(data.phone).replace(/[^\d+]/g, "");
  if (resource === "stores" && data.phone)
    data.phone = String(data.phone).replace(/[^\d+]/g, "");
  if (resource === "lead-tags") {
    if (data.tag_type_id) data.tag_type_id = Number(data.tag_type_id);
    if (!Number.isInteger(Number(data.tag_type_id)) || Number(data.tag_type_id) < 1)
      data.tag_type_id = null;
    data.tag_name = String(data.tag_name ?? "").trim().slice(0, 120);
    const color = String(data.tag_color ?? "#00b4d8").trim();
    data.tag_color = /^#[0-9a-f]{6}$/i.test(color) ? color : "#00b4d8";
    if (data.tag_type_id) {
      const [typeRows] = await db.execute<RowDataPacket[]>(
        `SELECT id FROM tag_types WHERE id = ? AND company_id = ? LIMIT 1`,
        [Number(data.tag_type_id), await companyIdForSession(session)],
      );
      if (!typeRows.length) throw new Error("TAG_TYPE_NOT_FOUND");
    }
  }
  if (resource === "lead-tag-types") {
    data.type_name = String(data.type_name ?? "").trim().slice(0, 120);
    const color = String(data.type_color ?? "#00b4d8").trim();
    data.type_color = /^#[0-9a-f]{6}$/i.test(color) ? color : "#00b4d8";
    data.company_id = await companyIdForSession(session);
  }
  if (resource === "lead-tag-assignments") {
    data.lead_id = Number(data.lead_id);
    data.tag_id = Number(data.tag_id);
  }
  if (resource === "support-ticket-types") {
    data.name_ar = String(data.name_ar ?? "").trim().slice(0, 120);
    data.name_en = String(data.name_en ?? "").trim().slice(0, 120);
    data.description = String(data.description ?? "").trim() || null;
    data.sort_order = Number(data.sort_order ?? 0);
    data.company_id = await companyIdForSession(session);
  }
  if (resource === "team-members") {
    if (data.phone) data.phone = String(data.phone).replace(/[^\d+]/g, "");
    const assignedUserId = await assignedTeamMemberUserId(data);
    data.assign_member = assignedUserId;
    if (assignedUserId) {
      await ensureUserTeamColumns();
      await db.execute(
        "UPDATE users SET manager_id = ? WHERE id = ? AND (manager_id IS NULL OR manager_id = ?)",
        [Number(session.sub), assignedUserId, Number(session.sub)],
      );
    }
  }
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
  if (resource === "participation-contracts" || resource === "sponsorship-contracts") {
    if (data.lead_id) {
      data.lead_id = Number(data.lead_id);
      const [leadRows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM leads WHERE id = ? AND affiliate_user_id = ? LIMIT 1",
        [Number(data.lead_id), Number(session.sub)],
      );
      if (!leadRows.length) throw new Error("LEAD_NOT_FOUND");
    }
    for (const phoneColumn of ["phone", "mobile", "fax"]) {
      if (data[phoneColumn]) data[phoneColumn] = String(data[phoneColumn]).replace(/[^\d+]/g, "");
    }
    for (const numericColumn of [
      "space_sqm",
      "price_per_sqm",
      "total_amount",
      "sponsorship_amount",
      "registration_fee",
      "other_services_amount",
      "vat_amount",
      "grand_total",
    ]) {
      if (data[numericColumn] !== undefined && data[numericColumn] !== null)
        data[numericColumn] = Number(data[numericColumn]);
    }
    if (
      resource === "participation-contracts" &&
      (data.total_amount === undefined || data.total_amount === null) &&
      data.space_sqm !== undefined &&
      data.price_per_sqm !== undefined
    ) {
      data.total_amount = Number(data.space_sqm) * Number(data.price_per_sqm);
    }
    if (resource === "sponsorship-contracts") {
      const includesParticipation = String(data.package_type ?? "sponsorship_participation") === "sponsorship_participation";
      if (!includesParticipation) {
        data.space_sqm = 0;
        data.price_per_sqm = 0;
      }
      const boothAmount = includesParticipation
        ? Number(data.space_sqm ?? 0) * Number(data.price_per_sqm ?? 0)
        : 0;
      const sponsorshipAmount = Number(data.sponsorship_amount ?? 0);
      const registrationFee = Number(data.registration_fee ?? 0);
      const otherServicesAmount = Number(data.other_services_amount ?? 0);
      const taxableTotal = boothAmount + sponsorshipAmount + registrationFee + otherServicesAmount;
      if ((data.vat_amount === undefined || data.vat_amount === null) && taxableTotal > 0) {
        data.vat_amount = taxableTotal * 0.15;
      }
      if ((data.grand_total === undefined || data.grand_total === null) && taxableTotal > 0) {
        data.grand_total = taxableTotal + Number(data.vat_amount ?? 0);
      }
    }
    if (!data.contract_number) data.contract_number = generatedReference(resource);
  }
  if (resource === "sales-orders") {
    if (data.lead_id) {
      data.lead_id = Number(data.lead_id);
      const [leadRows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM leads WHERE id = ? AND affiliate_user_id = ? LIMIT 1",
        [Number(data.lead_id), Number(session.sub)],
      );
      if (!leadRows.length) throw new Error("LEAD_NOT_FOUND");
    }
    if (data.phone) data.phone = String(data.phone).replace(/[^\d+]/g, "");
    for (const numericColumn of ["unit_price", "quantity", "subtotal", "vat_amount", "grand_total"]) {
      if (data[numericColumn] !== undefined && data[numericColumn] !== null)
        data[numericColumn] = Number(data[numericColumn]);
    }
    const subtotal = Number(data.subtotal ?? Number(data.unit_price ?? 0) * Number(data.quantity ?? 1));
    data.subtotal = subtotal;
    if (data.vat_amount === undefined || data.vat_amount === null) data.vat_amount = subtotal * 0.15;
    if (data.grand_total === undefined || data.grand_total === null) {
      data.grand_total = subtotal + Number(data.vat_amount ?? 0);
    }
    if (!data.order_number) data.order_number = generatedReference(resource);
  }
  if (resource === "rental-contracts") {
    if (data.lead_id) {
      data.lead_id = Number(data.lead_id);
      const [leadRows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM leads WHERE id = ? AND affiliate_user_id = ? LIMIT 1",
        [Number(data.lead_id), Number(session.sub)],
      );
      if (!leadRows.length) throw new Error("LEAD_NOT_FOUND");
    }
    if (data.phone) data.phone = String(data.phone).replace(/[^\d+]/g, "");
    for (const numericColumn of ["unit_price", "quantity", "subtotal", "vat_amount", "grand_total"]) {
      if (data[numericColumn] !== undefined && data[numericColumn] !== null)
        data[numericColumn] = Number(data[numericColumn]);
    }
    const grandTotal = roundMoney(Number(data.unit_price ?? 0) * Number(data.quantity ?? 1));
    const subtotal = roundMoney(grandTotal / 1.15);
    const vatAmount = roundMoney(grandTotal - subtotal);
    data.subtotal = subtotal;
    data.vat_amount = vatAmount;
    data.grand_total = grandTotal;
    if (data.booth_number) {
      data.booth_number = normalizedBoothNumber(data.booth_number);
      await assertRentalBoothAvailable(data.booth_number);
    }
    if (!data.contract_number) data.contract_number = generatedReference(resource);
  }
  if (resource === "booths") {
    data.booth_number = normalizedBoothNumber(data.booth_number);
    for (const column of ["booth_size", "booth_dimensions", "booth_category", "hall", "location_zone"]) {
      if (data[column] !== undefined && data[column] !== null)
        data[column] = String(data[column]).replaceAll("?", "").trim() || null;
    }
    if (!["available", "inactive"].includes(String(data.status ?? "available"))) {
      data.status = "available";
    }
  }
  if (definition.ownerField) data[definition.ownerField] = Number(session.sub);
  if (resource === "stock") {
    data.store_id = Number(data.store_id);
    if (data.product_id) data.product_id = Number(data.product_id);
    data.quantity = Number(data.quantity ?? 0);
    data.reorder_level = Number(data.reorder_level ?? 0);
    if (data.unit_price !== undefined && data.unit_price !== null)
      data.unit_price = Number(data.unit_price);
    const [storeRows] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM `store` WHERE id = ? AND affiliate_user_id = ? LIMIT 1",
      [Number(data.store_id), Number(session.sub)],
    );
    if (!storeRows.length) throw new Error("STORE_NOT_FOUND");
  }
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
  const leadTagTypeId =
    resource === "lead-tags" && Number.isInteger(Number(data.tag_type_id))
      ? Number(data.tag_type_id)
      : null;

  const missing = (requiredFields[resource as BackendResource] ?? []).filter(
    (column) =>
      data[column] === undefined ||
      data[column] === null ||
      data[column] === "",
  );
  if (missing.length) throw new Error("VALIDATION_ERROR");

  if (resource === "lead-tag-assignments") {
    const [tagRows] = await db.execute<RowDataPacket[]>(
      `SELECT t.id, t.tag_type_id
         FROM tags t
         JOIN tag_types tt ON tt.id = t.tag_type_id
        WHERE t.id = ? AND tt.company_id = ?
        LIMIT 1`,
      [Number(data.tag_id), await companyIdForSession(session)],
    );
    const tag = tagRows[0];
    if (!tag || !tag.tag_type_id) throw new Error("TAG_TYPE_REQUIRED");

    const [sameTypeAssignments] = await db.execute<RowDataPacket[]>(
      `SELECT lta.id
         FROM lead_tag_assignments lta
         JOIN tags assigned_tag ON assigned_tag.id = lta.tag_id
        WHERE lta.lead_id = ?
          AND assigned_tag.tag_type_id = ?
        LIMIT 1`,
      [Number(data.lead_id), Number(tag.tag_type_id)],
    );
    if (sameTypeAssignments.length) throw new Error("DUPLICATE_TAG_TYPE_ASSIGNMENT");
  }

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
        `SELECT * FROM tag_types WHERE company_id = ? AND type_name = ? LIMIT 1`,
        [Number(data.company_id), String(data.type_name ?? "")],
      );
      return existingTypes[0] ?? null;
    }
    if (
      resource === "lead-tags" &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      const [existingTags] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM tags WHERE tag_type_id = ? AND tag_name = ? LIMIT 1`,
        [Number(data.tag_type_id), String(data.tag_name ?? "")],
      );
      return existingTags[0] ?? null;
    }
    if (
      resource === "lead-tag-assignments" &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      const [existingAssignments] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM lead_tag_assignments
          WHERE lead_id = ? AND tag_id = ?
          LIMIT 1`,
        [
          Number(data.lead_id),
          Number(data.tag_id),
        ],
      );
      return existingAssignments[0] ?? null;
    }
    throw error;
  }
  if (resource === "lead-tags" && leadTagTypeId) {
    await rebalanceLeadTagGradient(leadTagTypeId, session);
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
  if (resource === "rental-contracts") {
    await syncRentalBoothForContract(Number(result.insertId));
  }
  return getResource(resource, result.insertId, session);
}

export async function getResource(
  resource: string,
  id: number,
  session: MiddarSession,
) {
  const definition = definitionFor(resource);
  if (resource === "marketing-assets") {
    await ensureResourceTable(resource);
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM marketing_assets WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }
  await assertResourcePermission(definition, session, "can_view");
  await ensureResourceTable(resource);
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
  if (resource === "support-ticket-types") {
    await ensureSupportTicketTypesTable(session);
  }
  if (resource === "support-tickets") {
    await ensureSupportTicketsUserRelation();
  }
  if (resource === "quotes") {
    await closeExpiredQuotes();
  }
  const { clause: ownerCheck, params: ownerParams } =
    resource === "lead-tag-types" || resource === "support-ticket-types"
      ? await tagTypeCompanyGuard(session)
      : await ownerGuard(definition, session);
  if (resource === "lead-tags") {
    const { clause: scopedWhere, params: scopedParams } =
      await tagTypeCompanyFilter(session, "tt.");
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT t.*
         FROM tags t
         JOIN tag_types tt ON tt.id = t.tag_type_id
        WHERE t.id = ?
          ${scopedWhere.replace(/^ WHERE /, "AND ")}
        LIMIT 1`,
      [id, ...scopedParams],
    );
    return rows[0] ?? null;
  }
  if (resource === "lead-tag-assignments") {
    const { clause: scopedWhere, params: scopedParams } =
      await tagTypeCompanyFilter(session, "tt.");
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT lta.*
         FROM lead_tag_assignments lta
         JOIN tags t ON t.id = lta.tag_id
         JOIN tag_types tt ON tt.id = t.tag_type_id
        WHERE lta.id = ?
          ${scopedWhere.replace(/^ WHERE /, "AND ")}
        LIMIT 1`,
      [id, ...scopedParams],
    );
    return rows[0] ?? null;
  }
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
  await ensureResourceTable(resource);
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
  if (resource === "support-ticket-types") {
    await ensureSupportTicketTypesTable(session);
  }
  if (resource === "support-tickets") {
    await ensureSupportTicketsUserRelation();
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
  if (resource === "stores" && data.phone)
    data.phone = String(data.phone).replace(/[^\d+]/g, "");
  if (resource === "lead-tags") {
    if (data.tag_type_id) data.tag_type_id = Number(data.tag_type_id);
    if (data.tag_name) data.tag_name = String(data.tag_name).trim().slice(0, 120);
    if (data.tag_color) {
      const color = String(data.tag_color).trim();
      data.tag_color = /^#[0-9a-f]{6}$/i.test(color) ? color : "#00b4d8";
    }
    if (data.tag_type_id) {
      const [typeRows] = await db.execute<RowDataPacket[]>(
        `SELECT id FROM tag_types WHERE id = ? AND company_id = ? LIMIT 1`,
        [Number(data.tag_type_id), await companyIdForSession(session)],
      );
      if (!typeRows.length) throw new Error("TAG_TYPE_NOT_FOUND");
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
  if (resource === "support-ticket-types") {
    if (data.name_ar !== undefined) data.name_ar = String(data.name_ar ?? "").trim().slice(0, 120);
    if (data.name_en !== undefined) data.name_en = String(data.name_en ?? "").trim().slice(0, 120);
    if (data.description !== undefined) data.description = String(data.description ?? "").trim() || null;
    if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order ?? 0);
  }
  if (resource === "team-members") {
    if (data.phone) data.phone = String(data.phone).replace(/[^\d+]/g, "");
    if (data.phone !== undefined || data.email !== undefined) {
      const assignedUserId = await assignedTeamMemberUserId({
        ...existing,
        ...data,
      });
      data.assign_member = assignedUserId;
      if (assignedUserId) {
        await ensureUserTeamColumns();
        await db.execute(
          "UPDATE users SET manager_id = ? WHERE id = ? AND (manager_id IS NULL OR manager_id = ?)",
          [Number(session.sub), assignedUserId, Number(session.sub)],
        );
      }
    }
  }
  if (resource === "stock") {
    const nextStoreId = Number(data.store_id ?? existing.store_id);
    const [storeRows] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM `store` WHERE id = ? AND affiliate_user_id = ? LIMIT 1",
      [nextStoreId, Number(session.sub)],
    );
    if (!storeRows.length) throw new Error("STORE_NOT_FOUND");
    if (data.store_id) data.store_id = nextStoreId;
    if (data.product_id) data.product_id = Number(data.product_id);
    if (data.quantity !== undefined) data.quantity = Number(data.quantity);
    if (data.reorder_level !== undefined)
      data.reorder_level = Number(data.reorder_level);
    if (data.unit_price !== undefined && data.unit_price !== null)
      data.unit_price = Number(data.unit_price);
  }
  if (resource === "participation-contracts" || resource === "sponsorship-contracts") {
    if (data.lead_id) {
      data.lead_id = Number(data.lead_id);
      const [leadRows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM leads WHERE id = ? AND affiliate_user_id = ? LIMIT 1",
        [Number(data.lead_id), Number(session.sub)],
      );
      if (!leadRows.length) throw new Error("LEAD_NOT_FOUND");
    }
    for (const phoneColumn of ["phone", "mobile", "fax"]) {
      if (data[phoneColumn]) data[phoneColumn] = String(data[phoneColumn]).replace(/[^\d+]/g, "");
    }
    for (const numericColumn of [
      "space_sqm",
      "price_per_sqm",
      "total_amount",
      "sponsorship_amount",
      "registration_fee",
      "other_services_amount",
      "vat_amount",
      "grand_total",
    ]) {
      if (data[numericColumn] !== undefined && data[numericColumn] !== null)
        data[numericColumn] = Number(data[numericColumn]);
    }
    if (
      resource === "participation-contracts" &&
      (data.total_amount === undefined || data.total_amount === null) &&
      data.space_sqm !== undefined &&
      data.price_per_sqm !== undefined
    ) {
      data.total_amount = Number(data.space_sqm) * Number(data.price_per_sqm);
    }
    if (resource === "sponsorship-contracts") {
      const includesParticipation = String(data.package_type ?? existing.package_type ?? "sponsorship_participation") === "sponsorship_participation";
      if (!includesParticipation) {
        data.space_sqm = 0;
        data.price_per_sqm = 0;
      }
      const boothAmount = includesParticipation
        ? Number(data.space_sqm ?? existing.space_sqm ?? 0) * Number(data.price_per_sqm ?? existing.price_per_sqm ?? 0)
        : 0;
      const sponsorshipAmount = Number(data.sponsorship_amount ?? existing.sponsorship_amount ?? 0);
      const registrationFee = Number(data.registration_fee ?? existing.registration_fee ?? 0);
      const otherServicesAmount = Number(data.other_services_amount ?? existing.other_services_amount ?? 0);
      const taxableTotal = boothAmount + sponsorshipAmount + registrationFee + otherServicesAmount;
      if ((data.vat_amount === undefined || data.vat_amount === null) && taxableTotal > 0) {
        data.vat_amount = taxableTotal * 0.15;
      }
      if ((data.grand_total === undefined || data.grand_total === null) && taxableTotal > 0) {
        data.grand_total = taxableTotal + Number(data.vat_amount ?? existing.vat_amount ?? 0);
      }
    }
  }
  if (resource === "sales-orders") {
    if (data.lead_id) {
      data.lead_id = Number(data.lead_id);
      const [leadRows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM leads WHERE id = ? AND affiliate_user_id = ? LIMIT 1",
        [Number(data.lead_id), Number(session.sub)],
      );
      if (!leadRows.length) throw new Error("LEAD_NOT_FOUND");
    }
    if (data.phone) data.phone = String(data.phone).replace(/[^\d+]/g, "");
    for (const numericColumn of ["unit_price", "quantity", "subtotal", "vat_amount", "grand_total"]) {
      if (data[numericColumn] !== undefined && data[numericColumn] !== null)
        data[numericColumn] = Number(data[numericColumn]);
    }
    const unitPrice = Number(data.unit_price ?? existing.unit_price ?? 0);
    const quantity = Number(data.quantity ?? existing.quantity ?? 1);
    const subtotal = Number(data.subtotal ?? unitPrice * quantity);
    data.subtotal = subtotal;
    if (data.vat_amount === undefined || data.vat_amount === null) data.vat_amount = subtotal * 0.15;
    if (data.grand_total === undefined || data.grand_total === null) {
      data.grand_total = subtotal + Number(data.vat_amount ?? existing.vat_amount ?? 0);
    }
  }
  if (resource === "rental-contracts") {
    if (data.lead_id) {
      data.lead_id = Number(data.lead_id);
      const [leadRows] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM leads WHERE id = ? AND affiliate_user_id = ? LIMIT 1",
        [Number(data.lead_id), Number(session.sub)],
      );
      if (!leadRows.length) throw new Error("LEAD_NOT_FOUND");
    }
    if (data.phone) data.phone = String(data.phone).replace(/[^\d+]/g, "");
    for (const numericColumn of ["unit_price", "quantity", "subtotal", "vat_amount", "grand_total"]) {
      if (data[numericColumn] !== undefined && data[numericColumn] !== null)
        data[numericColumn] = Number(data[numericColumn]);
    }
    const unitPrice = Number(data.unit_price ?? existing.unit_price ?? 0);
    const quantity = Number(data.quantity ?? existing.quantity ?? 1);
    const grandTotal = roundMoney(unitPrice * quantity);
    const subtotal = roundMoney(grandTotal / 1.15);
    const vatAmount = roundMoney(grandTotal - subtotal);
    data.subtotal = subtotal;
    data.vat_amount = vatAmount;
    data.grand_total = grandTotal;
    if (data.booth_number !== undefined && data.booth_number !== null) {
      data.booth_number = normalizedBoothNumber(data.booth_number);
      await assertRentalBoothAvailable(data.booth_number, id);
    }
  }
  if (resource === "booths") {
    if (data.booth_number !== undefined && data.booth_number !== null)
      data.booth_number = normalizedBoothNumber(data.booth_number);
    for (const column of ["booth_size", "booth_dimensions", "booth_category", "hall", "location_zone"]) {
      if (data[column] !== undefined && data[column] !== null)
        data[column] = String(data[column]).replaceAll("?", "").trim() || null;
    }
    if (
      data.status !== undefined &&
      !["available", "inactive"].includes(String(data.status ?? "available"))
    ) {
      data.status = "available";
    }
  }
  if (resource === "lead-tag-assignments" && data.tag_id) {
    const nextLeadId = Number(data.lead_id ?? existing.lead_id);
    const [tagRows] = await db.execute<RowDataPacket[]>(
      `SELECT t.id, t.tag_type_id
         FROM tags t
         JOIN tag_types tt ON tt.id = t.tag_type_id
        WHERE t.id = ? AND tt.company_id = ?
        LIMIT 1`,
      [Number(data.tag_id), await companyIdForSession(session)],
    );
    const tag = tagRows[0];
    if (!tag || !tag.tag_type_id) throw new Error("TAG_TYPE_REQUIRED");
    const [sameTypeAssignments] = await db.execute<RowDataPacket[]>(
      `SELECT id
         FROM lead_tag_assignments lta
         JOIN tags assigned_tag ON assigned_tag.id = lta.tag_id
        WHERE lta.lead_id = ?
          AND assigned_tag.tag_type_id = ?
          AND lta.id <> ?
        LIMIT 1`,
      [nextLeadId, Number(tag.tag_type_id), id],
    );
    if (sameTypeAssignments.length) throw new Error("DUPLICATE_TAG_TYPE_ASSIGNMENT");
  }
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
  if (resource === "rental-contracts") {
    await syncRentalBoothForContract(id);
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
  await ensureResourceTable(resource);
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
  if (resource === "support-ticket-types") {
    await ensureSupportTicketTypesTable(session);
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

  if (resource === "stores") {
    const [references] = await db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS stock_count FROM stock WHERE store_id = ?",
      [id],
    );
    if (Number(references[0]?.stock_count ?? 0) > 0)
      throw new Error("STORE_HAS_STOCK");
  }

  if (resource === "leads") {
    await ensureLeadContactsTable();
    await ensureLeadNotesTable();
    await ensureLeadTagAssignmentsTable();
    const ownerId = Number(existing.affiliate_user_id ?? session.sub);
    await db.execute(
      "DELETE FROM lead_tag_assignments WHERE lead_id = ?",
      [id],
    );
    await db.execute(
      "DELETE FROM lead_notes WHERE lead_id = ? AND affiliate_user_id = ?",
      [id, ownerId],
    );
    await db.execute(
      "DELETE FROM lead_contacts WHERE lead_id = ? AND affiliate_user_id = ?",
      [id, ownerId],
    );
  }

  await db.execute(`DELETE FROM ${definition.table} WHERE id = ?`, [id]);
  if (resource === "rental-contracts") {
    await syncRentalBoothsFromContracts();
  }
}

export async function getDashboardSummary(
  session: MiddarSession,
  trendPeriod: "week" | "month" | "year" = "week",
  trendAnchor?: string,
  trendGroup: "days" | "weeks" | "months" | "quarters" = "days",
  selectedUserId?: number | null,
) {
  const permittedOwnerIds = await ownerIdsForScope(session, "table.leads");
  let ownerIds = permittedOwnerIds;
  if (selectedUserId && Number.isFinite(selectedUserId)) {
    if (permittedOwnerIds && !permittedOwnerIds.includes(selectedUserId)) {
      throw new Error("FORBIDDEN_USER_FILTER");
    }
    ownerIds = [selectedUserId];
  }
  const ownerPlaceholder = ownerIds?.map(() => "?").join(", ");
  const ownerClause = ownerIds ? ` WHERE affiliate_user_id IN (${ownerPlaceholder})` : "";
  const ownerParams = ownerIds ?? [];
  const salesPeriodOwnerClause = ownerIds
    ? ` AND affiliate_user_id IN (${ownerPlaceholder})`
    : "";
  const ticketOwnerClause = ownerIds ? ` WHERE user_id IN (${ownerPlaceholder})` : "";
  const ticketStatusPrefix = ownerIds ? "AND" : "WHERE";
  const anchor = trendAnchor && /^\d{4}-\d{2}-\d{2}$/.test(trendAnchor) ? trendAnchor : null;
  const trendDateExpression = "COALESCE(sold_at, created_at)";
  const trendRange =
    trendPeriod === "year"
      ? `${trendDateExpression} >= DATE_FORMAT(DATE(?), '%Y-01-01') AND ${trendDateExpression} < DATE_FORMAT(DATE(?) + INTERVAL 1 YEAR, '%Y-01-01')`
      : trendPeriod === "month"
        ? `${trendDateExpression} >= DATE_FORMAT(DATE(?), '%Y-%m-01') AND ${trendDateExpression} < DATE_FORMAT(DATE(?) + INTERVAL 1 MONTH, '%Y-%m-01')`
        : `DATE(${trendDateExpression}) >= DATE(?) - INTERVAL 6 DAY AND DATE(${trendDateExpression}) < DATE(?) + INTERVAL 1 DAY`;
  const trendExpression =
    trendPeriod === "year"
      ? trendGroup === "quarters"
        ? `CONCAT(YEAR(${trendDateExpression}), '-Q', QUARTER(${trendDateExpression}))`
        : `DATE_FORMAT(${trendDateExpression}, '%Y-%m')`
      : trendPeriod === "month"
        ? trendGroup === "days"
          ? `DATE_FORMAT(${trendDateExpression}, '%Y-%m-%d')`
          : `CONCAT('week-', CEIL(DAYOFMONTH(${trendDateExpression}) / 7))`
        : `DATE_FORMAT(${trendDateExpression}, '%Y-%m-%d')`;
  const trendParams = [
    anchor ?? new Date().toISOString().slice(0, 10),
    anchor ?? new Date().toISOString().slice(0, 10),
    ...ownerParams,
  ];

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
        `SELECT ${trendExpression} AS day,
                COALESCE(SUM(sale_amount), 0) AS amount,
                COUNT(*) AS total
           FROM sales
           WHERE ${trendRange}${salesPeriodOwnerClause}
           GROUP BY ${trendExpression}
           ORDER BY day ASC`,
        trendParams,
      ),
      db.execute<RowDataPacket[]>(
        `SELECT COALESCE(SUM(commission_amount),0) amount,
                COALESCE(SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END),0) approved_amount,
                COALESCE(SUM(status='pending'),0) pending
           FROM commissions${ownerClause}`,
        ownerParams,
      ),
      db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) total
           FROM support_tickets
          ${ticketOwnerClause}
          ${ticketStatusPrefix} status IN ('open','in_progress')`,
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

export async function listDashboardUsers(session: MiddarSession) {
  const permittedOwnerIds = await ownerIdsForScope(session, "table.leads");
  const ownerClause = permittedOwnerIds
    ? `WHERE u.id IN (${permittedOwnerIds.map(() => "?").join(", ")})`
    : "";
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id,
            u.name,
            u.email,
            COALESCE(r.name_ar, r.name_en, r.slug, 'User') role_name,
            COALESCE(r.slug, 'affiliate') role,
            u.last_login_at,
            COUNT(l.id) leads_count
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN leads l ON l.affiliate_user_id = u.id
       ${ownerClause}
      GROUP BY u.id, u.name, u.email, r.name_ar, r.name_en, r.slug, u.last_login_at
      ORDER BY u.name ASC, u.email ASC`,
    permittedOwnerIds ?? [],
  );
  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name ?? row.email ?? `User #${row.id}`),
    email: String(row.email ?? ""),
    role: String(row.role ?? "affiliate"),
    role_name: String(row.role_name ?? row.role ?? "User"),
    last_login_at: row.last_login_at ?? null,
    leads_count: Number(row.leads_count ?? 0),
  }));
}

export async function getProfile(session: MiddarSession) {
  await ensureUserTeamColumns();
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id, u.name, u.email, COALESCE(r.slug, 'affiliate') role, u.level, u.status,
            u.preferred_locale, u.phone, u.city, u.district, u.referral_code, u.landing_slug,
            u.license_type, u.license_status, u.license_file_url, u.skills_experience,
            u.skills_courses, u.skills_proof_files, u.joined_at, u.CompanyID AS company_id,
            u.manager_id,
            manager.name AS manager_name,
            manager.phone AS manager_phone,
            u.last_login_at
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN users manager ON manager.id = u.manager_id
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
