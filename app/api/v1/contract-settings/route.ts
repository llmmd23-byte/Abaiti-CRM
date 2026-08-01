import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

import { getSession, isAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSessionUserCompanyId } from "@/lib/permissions";

type SponsorshipCategory = { name: string; amount: number };

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
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_contract_settings_company (company_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
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
  return {
    vatRate: Number(row?.vat_rate ?? 15),
    sponsorshipCategories: normalizeCategories(row?.sponsorship_categories),
    pricePerSqm: Number(row?.price_per_sqm ?? 0),
    registrationFee: Number(row?.registration_fee ?? 0),
    city: String(row?.city ?? "Jeddah"),
  };
}

async function getCompanySettings() {
  const session = await getSession();
  if (!session) return {session: null, companyId: null, settings: null};
  const companyId = await getSessionUserCompanyId(session);
  if (!companyId) return {session, companyId: null, settings: null};
  await ensureContractSettingsTable();
  await db.execute(
    `INSERT INTO contract_settings (company_id, sponsorship_categories)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE company_id = VALUES(company_id)`,
    [companyId, JSON.stringify(DEFAULT_CATEGORIES)],
  );
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT vat_rate, sponsorship_categories, price_per_sqm, registration_fee, city FROM contract_settings WHERE company_id = ? LIMIT 1",
    [companyId],
  );
  return {session, companyId, settings: serialize(rows[0])};
}

export async function GET() {
  try {
    const result = await getCompanySettings();
    if (!result.session) return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401});
    return NextResponse.json({data: result.settings});
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
      result.companyId,
    ];
    await db.execute(
      `UPDATE contract_settings
          SET vat_rate = ?, sponsorship_categories = ?, price_per_sqm = ?, registration_fee = ?, city = ?
        WHERE company_id = ?`,
      values,
    );
    return NextResponse.json({data: serialize({
      vat_rate: values[0], sponsorship_categories: values[1], price_per_sqm: values[2], registration_fee: values[3], city: values[4],
    } as unknown as RowDataPacket)});
  } catch (error) {
    console.error("Unable to save contract settings", error);
    return NextResponse.json({error: "REQUEST_FAILED"}, {status: 500});
  }
}
