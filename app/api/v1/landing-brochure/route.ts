import {readFile} from "node:fs/promises";
import path from "node:path";

import type {RowDataPacket} from "mysql2";
import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {db} from "@/lib/db";

const INDUSTRY_SLUG = "events-exhibitions";
const DEFAULT_BROCHURE_PATH = path.join(
  process.cwd(),
  "public",
  "landing-pages",
  "coffee-chocolate-expo-2026-v2.pdf",
);

function assetIdFromUrl(value: unknown) {
  const match = String(value ?? "").match(/\/api\/v1\/marketing-assets\/view\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function publicAssetNameFromUrl(value: unknown) {
  const match = String(value ?? "").match(/\/marketing-library\/([^#?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function activeAssetFromLandingUrl(landingUrl: string) {
  const assetId = assetIdFromUrl(landingUrl);
  const publicAssetName = publicAssetNameFromUrl(landingUrl);
  if (!assetId && !publicAssetName) {
    const [latestAssets] = await db.execute<RowDataPacket[]>(
      `SELECT id,original_name,mime_type,file_data,status
         FROM marketing_assets
        WHERE description = 'landing-page-brochure'
          AND status = 'active'
        ORDER BY updated_at DESC, created_at DESC, id DESC
        LIMIT 1`,
    );
    return latestAssets[0] ?? null;
  }

  const [assets] = assetId
    ? await db.execute<RowDataPacket[]>(
        `SELECT id,original_name,mime_type,file_data,status
           FROM marketing_assets
          WHERE id = ? LIMIT 1`,
        [assetId],
      )
    : await db.execute<RowDataPacket[]>(
        `SELECT id,original_name,mime_type,file_data,status
           FROM marketing_assets
          WHERE REPLACE(file_path, '\\\\', '/') LIKE ? LIMIT 1`,
        [`%/marketing-library/${publicAssetName}`],
      );

  const asset = assets[0];
  if (!asset || String(asset.status ?? "active") !== "active") {
    const [latestAssets] = await db.execute<RowDataPacket[]>(
      `SELECT id,original_name,mime_type,file_data,status
         FROM marketing_assets
        WHERE description = 'landing-page-brochure'
          AND status = 'active'
        ORDER BY updated_at DESC, created_at DESC, id DESC
        LIMIT 1`,
    );
    return latestAssets[0] ?? null;
  }
  return asset;
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
  const session = await apiSession();
  if (session instanceof NextResponse) return session;

  try {
    const [industries] = await db.execute<RowDataPacket[]>(
      "SELECT landing_url FROM industries WHERE slug = ? LIMIT 1",
      [INDUSTRY_SLUG],
    );
    const landingUrl = String(industries[0]?.landing_url ?? "");
    const asset = await activeAssetFromLandingUrl(landingUrl);
    const buffer =
      asset && Buffer.isBuffer(asset.file_data) && asset.file_data.byteLength > 0
        ? asset.file_data
        : await readFile(DEFAULT_BROCHURE_PATH);

    const fileName = asset?.original_name ?? "coffee-chocolate-expo-2026.pdf";
    const headers = new Headers();
    headers.set("Content-Type", String(asset?.mime_type ?? "application/pdf"));
    headers.set("Content-Length", String(buffer.byteLength));
    headers.set("Cache-Control", "no-store");
    headers.set(
      "Content-Disposition",
      `inline; filename="${contentDispositionName(fileName)}"; filename*=UTF-8''${encodedContentDispositionName(fileName)}`,
    );

    return new NextResponse(new Uint8Array(buffer), {headers});
  } catch (error) {
    return apiError(error);
  }
}
