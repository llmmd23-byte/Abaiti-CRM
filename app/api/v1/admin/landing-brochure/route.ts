import {stat, mkdir, writeFile} from "node:fs/promises";
import path from "node:path";

import type {RowDataPacket} from "mysql2";
import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {createResource, listResource} from "@/lib/backend";
import {isAdminSession} from "@/lib/auth";
import {db} from "@/lib/db";
import {getSessionUserCompanyId} from "@/lib/permissions";

const INDUSTRY_SLUG = "events-exhibitions";
const DEFAULT_BROCHURE_URL =
  "/landing-pages/coffee-chocolate-expo-2026-v2.pdf#toolbar=0&navpanes=0";
const PUBLIC_BROCHURE_URL = "/api/v1/landing-brochure#toolbar=0&navpanes=0";
const DEFAULT_BROCHURE_PATH = path.join(
  process.cwd(),
  "public",
  "landing-pages",
  "coffee-chocolate-expo-2026-v2.pdf",
);
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const uploadRoot = path.join(process.cwd(), "public", "marketing-library");

function safeFilePart(value: string) {
  return (
    value
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120) || "landing-brochure.pdf"
  );
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

  const [indexes] = await db.execute<RowDataPacket[]>(
    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'company' AND INDEX_NAME = 'idx_company_landing_page_asset'",
  );
  if (!indexes.length) {
    await db.execute(
      "ALTER TABLE company ADD KEY idx_company_landing_page_asset (landing_page_asset_id)",
    );
  }
}

async function ensureLandingIndustry() {
  await ensureLandingUrlColumn();
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id,landing_url,external_url FROM industries WHERE slug = ? LIMIT 1",
    [INDUSTRY_SLUG],
  );
  if (rows[0]) return rows[0];

  await db.execute(
    `INSERT INTO industries (name,name_en,slug,landing_url,description,status)
     VALUES (?,?,?,?,?, 'active')`,
    [
      "أنظمة المعارض والفعاليات",
      "Exhibitions and Event Systems",
      INDUSTRY_SLUG,
      DEFAULT_BROCHURE_URL,
      "حل متكامل لإدارة وتنظيم المعارض والمؤتمرات وحجز الأجنحة والخدمات اللوجستية رقمياً بالكامل.",
    ],
  );
  const [created] = await db.execute<RowDataPacket[]>(
    "SELECT id,landing_url,external_url FROM industries WHERE slug = ? LIMIT 1",
    [INDUSTRY_SLUG],
  );
  return created[0] ?? null;
}

function customAssetIdFromUrl(value: unknown) {
  const match = String(value ?? "").match(/\/api\/v1\/marketing-assets\/view\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function publicAssetNameFromUrl(value: unknown) {
  const match = String(value ?? "").match(/\/marketing-library\/([^#?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function latestLandingBrochureAsset() {
  const [assets] = await db.execute<RowDataPacket[]>(
    `SELECT id,title,original_name,file_path,file_size,mime_type,status,created_at,updated_at
       FROM marketing_assets
      WHERE description = 'landing-page-brochure'
        AND status = 'active'
      ORDER BY updated_at DESC, created_at DESC, id DESC
      LIMIT 1`,
  );
  return assets[0] ?? null;
}

async function companyLandingPage(companyId: number | null) {
  await ensureCompanyLandingPageColumns();
  if (!companyId) return null;
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT landing_page_asset_id, landing_page_external_url FROM company WHERE id = ? LIMIT 1",
    [companyId],
  );
  return rows[0] ?? null;
}

async function defaultBrochureData() {
  const fileStat = await stat(DEFAULT_BROCHURE_PATH).catch(() => null);
  return {
    isDefault: true,
    isActive: true,
    url: PUBLIC_BROCHURE_URL,
    name: "المعرض الدولي لصناع القهوة والشوكولاتة 2026.pdf",
    size: fileStat?.size ?? 0,
    updatedAt: fileStat?.mtime?.toISOString() ?? null,
  };
}

function normalizeExternalUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function assetById(assetId: number | null) {
  if (!assetId) return null;
  const [assets] = await db.execute<RowDataPacket[]>(
    `SELECT id,title,original_name,file_path,file_size,mime_type,status,created_at,updated_at
       FROM marketing_assets
      WHERE id = ? LIMIT 1`,
    [assetId],
  );
  const asset = assets[0];
  return asset && String(asset.status ?? "active") === "active" ? asset : null;
}

async function activeBrochureData(companyId: number | null) {
  const companyLanding = await companyLandingPage(companyId);
  const companyAsset = await assetById(
    companyLanding?.landing_page_asset_id
      ? Number(companyLanding.landing_page_asset_id)
      : null,
  );
  const companyExternalUrl = String(
    companyLanding?.landing_page_external_url ?? "",
  ).trim();
  if (companyAsset) {
    return {
      isDefault: false,
      isActive: true,
      url: PUBLIC_BROCHURE_URL,
      id: Number(companyAsset.id),
      name: String(companyAsset.original_name ?? companyAsset.title ?? "landing-brochure.pdf"),
      size: Number(companyAsset.file_size ?? 0),
      updatedAt: companyAsset.updated_at ?? companyAsset.created_at ?? null,
      mimeType: companyAsset.mime_type,
      externalUrl: companyExternalUrl,
    };
  }

  const industry = await ensureLandingIndustry();
  const landingUrl = String(industry?.landing_url ?? "");
  const externalUrl =
    companyExternalUrl || String(industry?.external_url ?? "").trim();
  const assetId = customAssetIdFromUrl(landingUrl);
  const publicAssetName = publicAssetNameFromUrl(landingUrl);

  const [assets] = assetId
    ? await db.execute<RowDataPacket[]>(
        `SELECT id,title,original_name,file_path,file_size,mime_type,status,created_at,updated_at
           FROM marketing_assets
          WHERE id = ? LIMIT 1`,
        [assetId],
      )
    : publicAssetName
      ? await db.execute<RowDataPacket[]>(
        `SELECT id,title,original_name,file_path,file_size,mime_type,status,created_at,updated_at
           FROM marketing_assets
          WHERE REPLACE(file_path, '\\\\', '/') LIKE ? LIMIT 1`,
        [`%/marketing-library/${publicAssetName}`],
      )
      : await db.execute<RowDataPacket[]>(
        `SELECT id,title,original_name,file_path,file_size,mime_type,status,created_at,updated_at
           FROM marketing_assets
          WHERE description = 'landing-page-brochure'
            AND status = 'active'
          ORDER BY updated_at DESC, created_at DESC, id DESC
          LIMIT 1`,
      );
  const asset = assets[0];
  const activeAsset =
    asset && String(asset.status ?? "active") === "active"
      ? asset
      : await latestLandingBrochureAsset();
  if (!activeAsset) return {...(await defaultBrochureData()), externalUrl};
  return {
    isDefault: false,
    isActive: true,
    url: PUBLIC_BROCHURE_URL,
    id: Number(activeAsset.id),
    name: String(activeAsset.original_name ?? activeAsset.title ?? "landing-brochure.pdf"),
    size: Number(activeAsset.file_size ?? 0),
    updatedAt: activeAsset.updated_at ?? activeAsset.created_at ?? null,
    mimeType: activeAsset.mime_type,
    externalUrl,
  };
}

export async function GET() {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  if (!isAdminSession(session)) {
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  }

  try {
    await listResource("marketing-assets", session);
    return NextResponse.json({
      data: await activeBrochureData(await getSessionUserCompanyId(session)),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  if (!isAdminSession(session)) {
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  }

  try {
    const form = await request.formData();
    const fileValue = form.get("file");
    if (!(fileValue instanceof File) || fileValue.size === 0) {
      return NextResponse.json({error: "VALIDATION_ERROR"}, {status: 422});
    }
    if (
      fileValue.size > MAX_FILE_SIZE ||
      (!fileValue.type.includes("pdf") &&
        !fileValue.name.toLocaleLowerCase().endsWith(".pdf"))
    ) {
      return NextResponse.json({error: "INVALID_FILE"}, {status: 422});
    }

    await mkdir(uploadRoot, {recursive: true});
    const originalName = fileValue.name || "landing-brochure.pdf";
    const storedName = `${Date.now()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}-${safeFilePart(originalName)}`;
    const filePath = path.join(uploadRoot, storedName);
    const buffer = Buffer.from(await fileValue.arrayBuffer());
    await writeFile(filePath, buffer).catch((error) => {
      console.warn("Landing brochure file path write skipped", error);
    });

    const asset = await createResource(
      "marketing-assets",
      {
        title: String(form.get("title") ?? "").trim() || originalName,
        asset_type: "document",
        original_name: originalName,
        mime_type: fileValue.type || "application/pdf",
        file_size: fileValue.size,
        file_path: path.relative(process.cwd(), filePath),
        file_data: buffer,
        description: "landing-page-brochure",
      },
      session,
    );
    const assetId = Number(asset?.id);
    if (!assetId) throw new Error("UPLOAD_FAILED");
    await db.execute("UPDATE marketing_assets SET file_data = ? WHERE id = ?", [
      buffer,
      assetId,
    ]);

    const companyId = await getSessionUserCompanyId(session);
    await ensureCompanyLandingPageColumns();
    await ensureLandingIndustry();
    if (companyId) {
      await db.execute(
        "UPDATE company SET landing_page_asset_id = ? WHERE id = ?",
        [assetId, companyId],
      );
    } else {
      await db.execute(
        "UPDATE industries SET landing_url = ? WHERE slug = ?",
        [`/api/v1/marketing-assets/view/${assetId}`, INDUSTRY_SLUG],
      );
    }

    return NextResponse.json({data: await activeBrochureData(companyId)}, {status: 201});
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  if (!isAdminSession(session)) {
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  }

  try {
    const body = await request.json().catch(() => ({}));
    const externalUrl = normalizeExternalUrl(body.externalUrl);
    if (externalUrl === null) {
      return NextResponse.json({error: "INVALID_URL"}, {status: 422});
    }

    const companyId = await getSessionUserCompanyId(session);
    await ensureCompanyLandingPageColumns();
    await ensureLandingIndustry();
    if (companyId) {
      await db.execute(
        "UPDATE company SET landing_page_external_url = ? WHERE id = ?",
        [externalUrl || null, companyId],
      );
    } else {
      await db.execute("UPDATE industries SET external_url = ? WHERE slug = ?", [
        externalUrl || null,
        INDUSTRY_SLUG,
      ]);
    }
    return NextResponse.json({data: await activeBrochureData(companyId)});
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE() {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  if (!isAdminSession(session)) {
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  }

  try {
    const companyId = await getSessionUserCompanyId(session);
    const companyLanding = await companyLandingPage(companyId);
    const industry = await ensureLandingIndustry();
    const assetId =
      companyLanding?.landing_page_asset_id
        ? Number(companyLanding.landing_page_asset_id)
        : customAssetIdFromUrl(industry?.landing_url);
    const publicAssetName = publicAssetNameFromUrl(industry?.landing_url);
    if (assetId) {
      await db.execute("UPDATE marketing_assets SET status = 'inactive' WHERE id = ?", [
        assetId,
      ]);
    } else if (publicAssetName) {
      await db.execute(
        "UPDATE marketing_assets SET status = 'inactive' WHERE REPLACE(file_path, '\\\\', '/') LIKE ?",
        [`%/marketing-library/${publicAssetName}`],
      );
    }
    if (companyId) {
      await db.execute(
        "UPDATE company SET landing_page_asset_id = NULL WHERE id = ?",
        [companyId],
      );
    } else {
      await db.execute("UPDATE industries SET landing_url = ? WHERE slug = ?", [
        DEFAULT_BROCHURE_URL,
        INDUSTRY_SLUG,
      ]);
    }
    return NextResponse.json({data: await activeBrochureData(companyId)});
  } catch (error) {
    return apiError(error);
  }
}
