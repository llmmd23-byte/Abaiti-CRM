import "server-only";

import type {ResultSetHeader, RowDataPacket} from "mysql2";
import { db } from "@/lib/db";

export type AffiliateLead = {
  affiliateId: string;
  affiliateUsername: string;
  referralCode?: string;
  fullName: string;
  email: string;
  phone: string;
  companySize: string;
  message?: string;
  source: string;
  status: "New Demo Request";
  createdAt: string;
};

export async function pushAffiliateLeadToCrm(lead: AffiliateLead) {
  let [users] = await db.execute<RowDataPacket[]>(
    `SELECT id FROM users
       WHERE is_active = 1
         AND status = 'active'
         AND (LOWER(TRIM(landing_slug)) = LOWER(TRIM(?))
           OR LOWER(TRIM(referral_code)) = LOWER(TRIM(?))
           OR LOWER(TRIM(username)) = LOWER(TRIM(?)))
       LIMIT 1`,
    [lead.referralCode || lead.affiliateUsername, lead.referralCode || lead.affiliateUsername, lead.referralCode || lead.affiliateUsername]
  );
  if (!users[0] && /^\d+$/.test(lead.affiliateId.trim())) {
    [users] = await db.execute<RowDataPacket[]>(
      `SELECT id FROM users
         WHERE id = ? AND is_active = 1 AND status = 'active'
         LIMIT 1`,
      [Number(lead.affiliateId)],
    );
  }
  const affiliateUserId = users[0]?.id;
  if (!affiliateUserId) throw new Error("AFFILIATE_NOT_FOUND");
  const notes = [lead.companySize ? `Company size: ${lead.companySize}` : "", lead.message ?? ""]
    .filter(Boolean)
    .join("\n");
  const [notesColumns] = await db.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'leads'
        AND COLUMN_NAME = 'notes'
      LIMIT 1`,
  );
  const hasNotesColumn = notesColumns.length > 0;
  const insertColumns = [
    "affiliate_user_id",
    "assigned_user_id",
    "name",
    "company_name",
    "email",
    "phone",
    "source",
    "stage",
    "currency",
    ...(hasNotesColumn ? ["notes"] : []),
  ];
  const insertValues = [
    affiliateUserId,
    affiliateUserId,
    lead.fullName,
    lead.fullName,
    lead.email,
    lead.phone || null,
    lead.source,
    "new",
    "SAR",
    ...(hasNotesColumn ? [notes || null] : []),
  ];
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO leads
      (${insertColumns.join(", ")})
     VALUES (${insertColumns.map(() => "?").join(", ")})`,
    insertValues,
  );
  return {
    crmLeadId: String(result.insertId),
    routedTo: "central-crm",
    assignedQueue: "sales-demo-requests"
  };
}
