import type {RowDataPacket} from "mysql2";
import {NextResponse} from "next/server";

import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
import {getSessionUserCompanyId} from "@/lib/permissions";

const INDUSTRY_SLUG = "events-exhibitions";
const DEFAULT_BROCHURE_URL = "/api/v1/landing-brochure#toolbar=0&navpanes=0";

async function ensureLandingUrlColumns() {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'industries' AND COLUMN_NAME IN ('landing_url','external_url')",
  );
  const existing = new Set(columns.map((column) => String(column.COLUMN_NAME)));
  if (!existing.has("landing_url")) {
    await db.execute(
      "ALTER TABLE industries ADD COLUMN landing_url VARCHAR(500) NULL AFTER slug",
    );
  }
  if (!existing.has("external_url")) {
    await db.execute(
      "ALTER TABLE industries ADD COLUMN external_url VARCHAR(500) NULL AFTER landing_url",
    );
  }
}

async function ensureCompanyLandingPageColumns() {
  const [columns] = await db.execute<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'company' AND COLUMN_NAME IN ('landing_page_asset_id','landing_page_external_url')",
  );
  const existing = new Set(columns.map((column) => String(column.COLUMN_NAME)));
  if (!existing.has("landing_page_asset_id")) {
    await db.execute(
      "ALTER TABLE company ADD COLUMN landing_page_asset_id BIGINT UNSIGNED NULL AFTER notes",
    );
  }
  if (!existing.has("landing_page_external_url")) {
    await db.execute(
      "ALTER TABLE company ADD COLUMN landing_page_external_url VARCHAR(500) NULL AFTER landing_page_asset_id",
    );
  }
}

async function companyLandingSettings() {
  const session = await getSession();
  if (!session) return null;
  const companyId = await getSessionUserCompanyId(session);
  if (!companyId) return null;
  await ensureCompanyLandingPageColumns();
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT landing_page_asset_id, landing_page_external_url FROM company WHERE id = ? LIMIT 1",
    [companyId],
  );
  return rows[0] ?? null;
}

export async function GET() {
  try {
    await ensureLandingUrlColumns();
    const companySettings = await companyLandingSettings();
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT landing_url, external_url FROM industries WHERE slug = ? LIMIT 1",
      [INDUSTRY_SLUG],
    );
    const row = rows[0];
    const companyAssetId = companySettings?.landing_page_asset_id;
    const companyExternalUrl = String(
      companySettings?.landing_page_external_url ?? "",
    ).trim();
    return NextResponse.json({
      data: {
        landingUrl: companyAssetId
          ? DEFAULT_BROCHURE_URL
          : String(row?.landing_url ?? "").trim() || DEFAULT_BROCHURE_URL,
        externalUrl: companyExternalUrl || String(row?.external_url ?? "").trim(),
      },
    });
  } catch (error) {
    console.error("Unable to load landing page settings", error);
    return NextResponse.json(
      {
        data: {
          landingUrl: DEFAULT_BROCHURE_URL,
          externalUrl: "",
        },
      },
      {status: 200},
    );
  }
}
