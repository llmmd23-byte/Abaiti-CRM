import {readFile} from "node:fs/promises";
import path from "node:path";

import type {RowDataPacket} from "mysql2";
import {NextResponse} from "next/server";

import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
import {getSessionUserCompanyId} from "@/lib/permissions";

const INDUSTRY_SLUG = "events-exhibitions";

function assetIdFromUrl(value: unknown) {
  const match = String(value ?? "").match(/\/api\/v1\/marketing-assets\/view\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function publicAssetNameFromUrl(value: unknown) {
  const match = String(value ?? "").match(/\/marketing-library\/([^#?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureLandingUrlColumn() {
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

async function companyLandingAssetId() {
  const session = await getSession();
  if (!session) return null;
  const companyId = await getSessionUserCompanyId(session);
  if (!companyId) return null;
  await ensureCompanyLandingPageColumns();
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT landing_page_asset_id FROM company WHERE id = ? LIMIT 1",
    [companyId],
  );
  const assetId = rows[0]?.landing_page_asset_id;
  return assetId === null || assetId === undefined ? null : Number(assetId);
}

async function activeAssetFromLandingUrl(landingUrl: string) {
  const assetId = assetIdFromUrl(landingUrl);
  const publicAssetName = publicAssetNameFromUrl(landingUrl);

  const [assets] = assetId
    ? await db.execute<RowDataPacket[]>(
        `SELECT id,original_name,mime_type,file_data,file_path,status
           FROM marketing_assets
          WHERE id = ? LIMIT 1`,
        [assetId],
      )
    : publicAssetName
      ? await db.execute<RowDataPacket[]>(
        `SELECT id,original_name,mime_type,file_data,file_path,status
           FROM marketing_assets
          WHERE REPLACE(file_path, '\\\\', '/') LIKE ? LIMIT 1`,
        [`%/marketing-library/${publicAssetName}`],
      )
      : await db.execute<RowDataPacket[]>(
        `SELECT id,original_name,mime_type,file_data,file_path,status
           FROM marketing_assets
          WHERE description = 'landing-page-brochure'
            AND status = 'active'
          ORDER BY updated_at DESC, created_at DESC, id DESC
          LIMIT 1`,
      );

  const asset = assets[0];
  if (asset && String(asset.status ?? "active") === "active") return asset;

  const [latestAssets] = await db.execute<RowDataPacket[]>(
    `SELECT id,original_name,mime_type,file_data,file_path,status
       FROM marketing_assets
      WHERE description = 'landing-page-brochure'
        AND status = 'active'
      ORDER BY updated_at DESC, created_at DESC, id DESC
      LIMIT 1`,
  );
  return latestAssets[0] ?? null;
}

async function assetBuffer(asset: RowDataPacket | null) {
  if (asset && Buffer.isBuffer(asset.file_data) && asset.file_data.byteLength > 0) {
    return asset.file_data;
  }

  const storedPath = String(asset?.file_path ?? "").trim();
  if (storedPath) {
    const normalizedPath = storedPath.replace(/\\/g, "/");
    const candidates = [
      path.isAbsolute(storedPath) ? storedPath : path.join(process.cwd(), storedPath),
      path.join(process.cwd(), "public", normalizedPath.replace(/^public\//, "")),
    ];
    for (const candidate of candidates) {
      try {
        return await readFile(candidate);
      } catch {
        // Try the next known storage shape.
      }
    }
  }

  return null;
}

function contentDispositionName(value: unknown) {
  return (
    String(value ?? "landing-brochure.pdf")
      .replace(/[^\x20-\x7E]+/g, "-")
      .replace(/["\\\r\n]/g, "")
      .trim() || "landing-brochure.pdf"
  );
}

function encodedContentDispositionName(value: unknown) {
  return encodeURIComponent(
    String(value ?? "landing-brochure.pdf").replace(/[\r\n]/g, ""),
  );
}

export async function GET() {
  try {
    await ensureLandingUrlColumn();
    const companyAssetId = await companyLandingAssetId();
    const companyAsset = companyAssetId
      ? await activeAssetFromLandingUrl(`/api/v1/marketing-assets/view/${companyAssetId}`)
      : null;
    const [industries] = await db.execute<RowDataPacket[]>(
      "SELECT landing_url FROM industries WHERE slug = ? LIMIT 1",
      [INDUSTRY_SLUG],
    );
    const landingUrl = String(industries[0]?.landing_url ?? "");
    const asset = companyAsset ?? (await activeAssetFromLandingUrl(landingUrl));
    const buffer = await assetBuffer(asset ?? null);
    if (!buffer) {
      return NextResponse.json({error: "BROCHURE_NOT_AVAILABLE"}, {status: 404});
    }

    const fileName = asset?.original_name ?? "landing-brochure.pdf";
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-length": String(buffer.byteLength),
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "content-disposition": `inline; filename="${contentDispositionName(fileName)}"; filename*=UTF-8''${encodedContentDispositionName(fileName)}`,
      },
    });
  } catch (error) {
    console.error("Unable to load landing brochure", error);
    return NextResponse.json({error: "BROCHURE_NOT_AVAILABLE"}, {status: 500});
  }
}
