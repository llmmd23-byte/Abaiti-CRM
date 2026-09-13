import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

import { getSession, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSessionUserCompanyId } from "@/lib/permissions";

type SponsorshipCategory = { name: string; amount: number };
type ContractTypeScope = "sponsorship" | "participation" | "rental" | "both";

const DEFAULT_CATEGORIES: SponsorshipCategory[] = [
  { name: "Diamond", amount: 0 },
  { name: "Gold", amount: 0 },
  { name: "Silver", amount: 0 },
];

async function ensureContractSettingsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS contract_settings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company_id BIGINT UNSIGNED NOT NULL,
      vat_rate DECIMAL(5,2) NOT NULL DEFAULT 15,
      sponsorship_categories JSON NOT NULL,
      price_per_sqm DECIMAL(12,2) NOT NULL DEFAULT 0,
      registration_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
      city VARCHAR(120) NOT NULL DEFAULT 'Jeddah',
      contract_type_scope VARCHAR(20) NOT NULL DEFAULT 'both',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_contract_settings_company_scope (company_id, contract_type_scope)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contract_settings' AND COLUMN_NAME = 'contract_type_scope' LIMIT 1",
  );
  if (!columns.length) {
    await db.execute("ALTER TABLE contract_settings ADD COLUMN contract_type_scope VARCHAR(20) NOT NULL DEFAULT 'both' AFTER city");
  }
  const [oldIndexes] = await db.execute<RowDataPacket[]>(
    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contract_settings' AND INDEX_NAME = 'uq_contract_settings_company' LIMIT 1",
  );
  if (oldIndexes.length) {
    await db.execute("ALTER TABLE contract_settings DROP INDEX uq_contract_settings_company");
  }
  const [scopeIndexes] = await db.execute<RowDataPacket[]>(
    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contract_settings' AND INDEX_NAME = 'uq_contract_settings_company_scope' LIMIT 1",
  );
  if (!scopeIndexes.length) {
    await db.execute("ALTER TABLE contract_settings ADD UNIQUE KEY uq_contract_settings_company_scope (company_id, contract_type_scope)");
  }
}

function normalizeCategories(value: unknown): SponsorshipCategory[] {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = [];
    }
  }
  if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;
  const categories = parsed
    .map((item) => ({
      name: String((item as Record<string, unknown>)?.name ?? "").trim().slice(0, 80),
      amount: Math.max(0, Number((item as Record<string, unknown>)?.amount ?? 0) || 0),
    }))
    .filter((item) => item.name);
  return categories.length ? categories : DEFAULT_CATEGORIES;
}

function serialize(row: RowDataPacket | undefined) {
  const scope = String(row?.contract_type_scope ?? "both");
  return {
    vatRate: Number(row?.vat_rate ?? 15),
    sponsorshipCategories: normalizeCategories(row?.sponsorship_categories),
    pricePerSqm: Number(row?.price_per_sqm ?? 0),
    registrationFee: Number(row?.registration_fee ?? 0),
    city: String(row?.city ?? "Jeddah"),
    contractTypeScope: ["sponsorship", "participation", "rental", "both"].includes(scope) ? scope : "both",
  };
}

async function getCompanySettings(requestedScope?: ContractTypeScope) {
  const session = await getSession();
  if (!session) return {session: null, companyId: null, settings: null};
  const companyId = await getSessionUserCompanyId(session);
  if (!companyId) return {session, companyId: null, settings: null};
  await ensureContractSettingsTable();
  await db.execute(
    `INSERT INTO contract_settings (company_id, sponsorship_categories, contract_type_scope)
     VALUES (?, ?, 'both')
     ON DUPLICATE KEY UPDATE company_id = VALUES(company_id)`,
    [companyId, JSON.stringify(DEFAULT_CATEGORIES)],
  );
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT vat_rate, sponsorship_categories, price_per_sqm, registration_fee, city, contract_type_scope FROM contract_settings WHERE company_id = ? ORDER BY FIELD(contract_type_scope, 'both', 'participation', 'sponsorship', 'rental')",
    [companyId],
  );
  const byScope = new Map(rows.map((row) => [String(row.contract_type_scope), row]));
  const selected = requestedScope ? byScope.get(requestedScope) ?? byScope.get("both") : rows[0];
  return {
    session,
    companyId,
    settings: serialize(selected),
    scopes: {
      sponsorship: serialize(byScope.get("sponsorship") ?? byScope.get("both")),
      participation: serialize(byScope.get("participation") ?? byScope.get("both")),
      rental: serialize(byScope.get("rental") ?? byScope.get("both")),
      both: serialize(byScope.get("both")),
    },
  };
}

export async function GET(request: Request) {
  try {
    const requestedScope = String(new URL(request.url).searchParams.get("type") ?? "");
    const scope = ["sponsorship", "participation", "rental"].includes(requestedScope) ? requestedScope as ContractTypeScope : undefined;
    const result = await getCompanySettings(scope);
    if (!result.session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
    return NextResponse.json({data: result.settings, scopes: result.scopes});
  } catch (error) {
    console.error("Unable to load contract settings", error);
    return NextResponse.json({error: "REQUEST_FAILED"}, {status: 500});
  }
}

export async function PUT(request: Request) {
  try {
    const result = await getCompanySettings();
    if (!result.session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
    if (!isAdminSession(result.session)) return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
    if (!result.companyId) return NextResponse.json({error: "COMPANY_NOT_FOUND"}, {status: 400});
    const body = await request.json() as Record<string, unknown>;
    const categories = normalizeCategories(body.sponsorshipCategories);
    const values = [
      Math.min(100, Math.max(0, Number(body.vatRate ?? 15) || 0)),
      JSON.stringify(categories),
      Math.max(0, Number(body.pricePerSqm ?? 0) || 0),
      Math.max(0, Number(body.registrationFee ?? 0) || 0),
      String(body.city ?? "Jeddah").trim().slice(0, 120) || "Jeddah",
      ["sponsorship", "participation", "rental", "both"].includes(String(body.contractTypeScope)) ? String(body.contractTypeScope) : "both",
      String(body.contractTypeScope ?? "both"),
      result.companyId,
    ];
    await db.execute(
      `INSERT INTO contract_settings
        (company_id, vat_rate, sponsorship_categories, price_per_sqm, registration_fee, city, contract_type_scope)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         vat_rate = VALUES(vat_rate), sponsorship_categories = VALUES(sponsorship_categories),
         price_per_sqm = VALUES(price_per_sqm), registration_fee = VALUES(registration_fee), city = VALUES(city)`,
      [result.companyId, values[0], values[1], values[2], values[3], values[4], values[5]],
    );
    return NextResponse.json({data: serialize({
      vat_rate: values[0], sponsorship_categories: values[1], price_per_sqm: values[2], registration_fee: values[3], city: values[4], contract_type_scope: values[5],
    } as unknown as RowDataPacket)});
  } catch (error) {
    console.error("Unable to save contract settings", error);
    return NextResponse.json({error: "REQUEST_FAILED"}, {status: 500});
  }
}
