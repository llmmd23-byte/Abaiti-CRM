export type AffiliateLead = {
  affiliateId: string;
  affiliateUsername: string;
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
  const [users] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM users WHERE landing_slug = ? LIMIT 1",
    [lead.affiliateUsername]
  );
  const affiliateUserId = users[0]?.id ?? null;
  const notes = [lead.companySize ? `Company size: ${lead.companySize}` : "", lead.message ?? ""]
    .filter(Boolean)
    .join("\n");
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO leads
      (affiliate_user_id, name, email, phone, source, stage, currency, notes)
     VALUES (?, ?, ?, ?, ?, 'new', 'SAR', ?)`,
    [affiliateUserId, lead.fullName, lead.email, lead.phone || null, lead.source, notes || null]
  );
  return {
    crmLeadId: String(result.insertId),
    routedTo: "central-crm",
    assignedQueue: "sales-demo-requests"
  };
}
import "server-only";

import type {ResultSetHeader, RowDataPacket} from "mysql2";

import {db} from "@/lib/db";
