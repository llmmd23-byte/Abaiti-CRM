import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

import { apiError, apiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";

const fields = [
  "email_new_lead",
  "email_quote_opened",
  "email_commission_approved",
  "payout_status_updates",
] as const;

type NotificationField = (typeof fields)[number];

const defaults: Record<NotificationField, number> = {
  email_new_lead: 1,
  email_quote_opened: 1,
  email_commission_approved: 1,
  payout_status_updates: 0,
};

export async function GET() {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT ${fields.join(", ")}
         FROM user_notification_settings
        WHERE user_id = ?
        LIMIT 1`,
      [Number(session.sub)],
    );
    return NextResponse.json({ data: rows[0] ?? defaults });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  const session = await apiSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json().catch(() => ({}));
    const values = fields.map((field) => (body[field] ? 1 : 0));
    await db.execute<ResultSetHeader>(
      `INSERT INTO user_notification_settings (user_id, ${fields.join(", ")})
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email_new_lead = VALUES(email_new_lead),
         email_quote_opened = VALUES(email_quote_opened),
         email_commission_approved = VALUES(email_commission_approved),
         payout_status_updates = VALUES(payout_status_updates)`,
      [Number(session.sub), ...values],
    );
    return NextResponse.json({
      data: Object.fromEntries(fields.map((field, index) => [field, values[index]])),
    });
  } catch (error) {
    return apiError(error);
  }
}
