import {stat, mkdir, writeFile} from "node:fs/promises";
import path from "node:path";

import type {RowDataPacket} from "mysql2";
import {NextResponse} from "next/server";

import {apiError, apiSession} from "@/lib/api-auth";
import {createResource, listResource} from "@/lib/backend";
import {db} from "@/lib/db";

const INDUSTRY_SLUG = "events-exhibitions";
const DEFAULT_BROCHURE_URL =
  "/landing-pages/coffee-chocolate-expo-2026-v2.pdf#toolbar=0&navpanes=0";
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
      "Events and Exhibitions Systems",
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

async function defaultBrochureData() {
  const fileStat = await stat(DEFAULT_BROCHURE_PATH).catch(() => null);
  return {
    isDefault: true,
    isActive: true,
    url: DEFAULT_BROCHURE_URL,
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

async function activeBrochureData() {
  const industry = await ensureLandingIndustry();
  const landingUrl = String(industry?.landing_url ?? "");
  const externalUrl = String(industry?.external_url ?? "").trim();
  const assetId = customAssetIdFromUrl(landingUrl);
  const publicAssetName = publicAssetNameFromUrl(landingUrl);
  if (!assetId && !publicAssetName) {
    return {...(await defaultBrochureData()), externalUrl};
  }

  const [assets] = assetId
    ? await db.execute<RowDataPacket[]>(
        `SELECT id,title,original_name,file_size,mime_type,status,created_at,updated_at
           FROM marketing_assets
          WHERE id = ? LIMIT 1`,
        [assetId],
      )
    : await db.execute<RowDataPacket[]>(
        `SELECT id,title,original_name,file_size,mime_type,status,created_at,updated_at
           FROM marketing_assets
          WHERE REPLACE(file_path, '\\\\', '/') LIKE ? LIMIT 1`,
        [`%/marketing-library/${publicAssetName}`],
      );
  const asset = assets[0];
  if (!asset) return {...(await defaultBrochureData()), externalUrl};

  return {
    isDefault: false,
    isActive: String(asset.status ?? "active") === "active",
    url: landingUrl,
    id: Number(asset.id),
    name: String(asset.original_name ?? asset.title ?? "landing-brochure.pdf"),
    size: Number(asset.file_size ?? 0),
    updatedAt: asset.updated_at ?? asset.created_at ?? null,
    mimeType: asset.mime_type,
    externalUrl,
  };
}

export async function GET() {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  if (session.role !== "admin") {
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  }

  try {
    await listResource("marketing-assets", session);
    return NextResponse.json({data: await activeBrochureData()});
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  if (session.role !== "admin") {
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
    await writeFile(filePath, buffer);

    const asset = await createResource(
      "marketing-assets",
      {
        title: String(form.get("title") ?? "").trim() || originalName,
        asset_type: "document",
        original_name: originalName,
        mime_type: fileValue.type || "application/pdf",
        file_size: fileValue.size,
        file_path: path.relative(process.cwd(), filePath),
        description: "landing-page-brochure",
      },
      session,
    );
    const assetId = Number(asset?.id);
    if (!assetId) throw new Error("UPLOAD_FAILED");

    await ensureLandingIndustry();
    await db.execute(
      "UPDATE industries SET landing_url = ? WHERE slug = ?",
      [`/marketing-library/${encodeURIComponent(storedName)}#toolbar=0&navpanes=0`, INDUSTRY_SLUG],
    );

    return NextResponse.json({data: await activeBrochureData()}, {status: 201});
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  if (session.role !== "admin") {
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  }

  try {
    const body = await request.json().catch(() => ({}));
    const externalUrl = normalizeExternalUrl(body.externalUrl);
    if (externalUrl === null) {
      return NextResponse.json({error: "INVALID_URL"}, {status: 422});
    }

    await ensureLandingIndustry();
    await db.execute("UPDATE industries SET external_url = ? WHERE slug = ?", [
      externalUrl || null,
      INDUSTRY_SLUG,
    ]);
    return NextResponse.json({data: await activeBrochureData()});
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE() {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;
  if (session.role !== "admin") {
    return NextResponse.json({error: "FORBIDDEN"}, {status: 403});
  }

  try {
    const industry = await ensureLandingIndustry();
    const assetId = customAssetIdFromUrl(industry?.landing_url);
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
    await db.execute("UPDATE industries SET landing_url = ? WHERE slug = ?", [
      DEFAULT_BROCHURE_URL,
      INDUSTRY_SLUG,
    ]);
    return NextResponse.json({data: await activeBrochureData()});
  } catch (error) {
    return apiError(error);
  }
}
