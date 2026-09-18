import {NextResponse} from "next/server";
import type {ResultSetHeader, RowDataPacket} from "mysql2";

import {db} from "@/lib/db";

const DEFAULT_AFFILIATE_EMAIL = "user@middar.com";
const DEFAULT_AFFILIATE_USERNAME = "user";
const FALLBACK_AFFILIATE_EMAIL = "admin@middar.com";
function corsHeaders(request?: Request) {
  const origin = request?.headers.get("origin")?.trim();
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizePhone(value: unknown) {
  return clean(value).replace(/[^\d+]/g, "");
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

async function resolveAffiliateUserId(payload: Record<string, unknown>) {
  const affiliateEmail = clean(payload.affiliateEmail) || DEFAULT_AFFILIATE_EMAIL;
  const affiliateUsername = clean(payload.affiliateUsername) || DEFAULT_AFFILIATE_USERNAME;
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id
       FROM users
      WHERE LOWER(email) = LOWER(?)
         OR LOWER(COALESCE(username, '')) = LOWER(?)
         OR LOWER(COALESCE(landing_slug, '')) = LOWER(?)
      LIMIT 1`,
      [affiliateEmail, affiliateUsername, affiliateUsername],
  );
  if (rows[0]?.id) return Number(rows[0].id);

  const [fallbackEmailRows] = await db.execute<RowDataPacket[]>(
    `SELECT id
       FROM users
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1`,
    [FALLBACK_AFFILIATE_EMAIL],
  );
  if (fallbackEmailRows[0]?.id) return Number(fallbackEmailRows[0].id);

  const affiliateUserId = Number(payload.affiliateUserId ?? payload.affiliate_user_id);
  if (Number.isFinite(affiliateUserId) && affiliateUserId > 0) {
    const [fallbackRows] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [affiliateUserId],
    );
    if (fallbackRows[0]?.id) return Number(fallbackRows[0].id);
  }

  return null;
}

export async function OPTIONS() {
  return new Response(null, {status: 204, headers: corsHeaders()});
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const payload =
      contentType.includes("application/json")
        ? ((await request.json().catch(() => ({}))) as Record<string, unknown>)
        : Object.fromEntries((await request.formData()).entries());
    const companyName = clean(payload.companyName ?? payload.company ?? payload.company_name);
    const fullName = clean(payload.fullName ?? payload.name ?? payload.contactName);
    const phone = normalizePhone(payload.phone ?? payload.whatsapp);
    const sector = clean(payload.sector ?? payload.businessType ?? payload.activity);
    const email = clean(payload.email);
    const message = clean(payload.message);

    if (!companyName || !fullName || !phone || !sector) {
      return NextResponse.json(
        {error: "COMPANY_NAME_FULL_NAME_PHONE_SECTOR_REQUIRED"},
        {status: 422, headers: corsHeaders(request)},
      );
    }

    const affiliateUserId = await resolveAffiliateUserId(payload);
    if (!affiliateUserId) {
      return NextResponse.json(
        {error: "AFFILIATE_USER_NOT_FOUND"},
        {status: 404, headers: corsHeaders(request)},
      );
    }

    const source = clean(payload.source) || "landpaga";
    const requirements = [
      clean(payload.address) || sector,
      message ? `Message: ${message}` : "",
      clean(payload.campaign) ? `Campaign: ${clean(payload.campaign)}` : "",
      clean(payload.referrer) ? `Referrer: ${clean(payload.referrer)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const hasAssignedUserColumn = await columnExists("leads", "assigned_user_id");
    const hasWebsiteColumn = await columnExists("leads", "website");
    const hasNotesColumn = await columnExists("leads", "notes");
    const hasStageColumn = await columnExists("leads", "stage");
    const hasPotentialValueColumn = await columnExists("leads", "potential_value");
    const hasCurrencyColumn = await columnExists("leads", "currency");
    const insertColumns = [
      "affiliate_user_id",
      ...(hasAssignedUserColumn ? ["assigned_user_id"] : []),
      "industry_id",
      "name",
      "company_name",
      "email",
      "phone",
      ...(hasWebsiteColumn ? ["website"] : []),
      "source",
      ...(hasNotesColumn ? ["notes"] : []),
      ...(hasStageColumn ? ["stage"] : []),
      ...(hasPotentialValueColumn ? ["potential_value"] : []),
      ...(hasCurrencyColumn ? ["currency"] : []),
    ];
    const insertValues = [
      affiliateUserId,
      ...(hasAssignedUserColumn ? [affiliateUserId] : []),
      null,
      fullName,
      companyName,
      email || null,
      phone,
      ...(hasWebsiteColumn ? [null] : []),
      source,
      ...(hasNotesColumn ? [requirements || null] : []),
      ...(hasStageColumn ? ["interested"] : []),
      ...(hasPotentialValueColumn ? [null] : []),
      ...(hasCurrencyColumn ? ["SAR"] : []),
    ];

    const [existingRows] = await db.execute<RowDataPacket[]>(
      `SELECT id
         FROM leads
        WHERE affiliate_user_id = ?
          AND (
            (phone <> '' AND phone = ?)
            OR (email <> '' AND LOWER(email) = LOWER(?))
            OR (company_name <> '' AND LOWER(company_name) = LOWER(?))
          )
        ORDER BY id DESC
        LIMIT 1`,
      [affiliateUserId, phone, email, companyName],
    );

    if (existingRows.length) {
      const leadId = Number(existingRows[0].id);
      const updateSets = [
        "name = ?",
        "company_name = ?",
        "email = ?",
        "phone = ?",
        ...(hasWebsiteColumn ? ["website = NULL"] : []),
        "source = ?",
        ...(hasStageColumn ? ["stage = 'interested'"] : []),
        ...(hasNotesColumn ? ["notes = ?"] : []),
        "updated_at = CURRENT_TIMESTAMP",
      ];
      const updateValues = [
        fullName,
        companyName,
        email || null,
        phone,
        source,
        ...(hasNotesColumn ? [requirements || null] : []),
        leadId,
      ];
      await db.execute(
        `UPDATE leads
            SET ${updateSets.join(", ")}
          WHERE id = ?`,
        updateValues,
      );
      return NextResponse.json(
        {data: {id: leadId, updated: true, affiliate_user_id: affiliateUserId}},
        {status: 200, headers: corsHeaders(request)},
      );
    }

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO leads (${insertColumns.join(", ")})
       VALUES (${insertValues.map(() => "?").join(", ")})`,
      insertValues,
    );

    return NextResponse.json(
      {data: {id: result.insertId, created: true, affiliate_user_id: affiliateUserId}},
      {status: 201, headers: corsHeaders(request)},
    );
  } catch (error) {
    console.error("landing lead capture failed", error);
    return NextResponse.json(
      {error: "LANDING_LEAD_CAPTURE_FAILED"},
      {status: 500, headers: corsHeaders(request)},
    );
  }
}
