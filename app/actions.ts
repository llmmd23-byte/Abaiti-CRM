"use server";

import {pushAffiliateLeadToCrm} from "@/lib/crm";
import bcrypt from "bcryptjs";
import {redirect} from "next/navigation";
import type {ResultSetHeader, RowDataPacket} from "mysql2";

import {db} from "@/lib/db";

export type LeadCaptureState = {success?: boolean; error?: string};

export async function captureAffiliateLead(_state: LeadCaptureState, formData: FormData): Promise<LeadCaptureState> {
  const affiliateUsername = String(formData.get("affiliateUsername") || "unknown");
  const affiliateId = String(formData.get("affiliateId") || affiliateUsername);

  await pushAffiliateLeadToCrm({
    affiliateId,
    affiliateUsername,
    fullName: String(formData.get("fullName") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    companySize: String(formData.get("companySize") || ""),
    message: String(formData.get("message") || ""),
    source: `affiliate-page/${affiliateUsername}`,
    status: "New Demo Request",
    createdAt: new Date().toISOString()
  });
  return {success: true};
}

export async function registerAffiliate(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const phoneDigits = rawPhone.replace(/\D/g, "");
  const phone = phoneDigits ? `${rawPhone.startsWith("+") ? "+" : ""}${phoneDigits}` : "";
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  if (!name || !email || password.length < 6 || password !== confirmPassword) redirect(`/${locale}?registration=invalid`);

  const passwordHash = await bcrypt.hash(password, 12);
  const connection = await db.getConnection();
  let registrationError = "";
  try {
    await connection.beginTransaction();

    let managerId: number | null = null;
    let hostName: string | null = null;
    let hostPhone: string | null = null;
    let userStatus: "active" | "pending" = "pending";
    let isActive = 0;

    if (phoneDigits) {
      const [membershipRows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, user_id, status
           FROM team_members
          WHERE REPLACE(phone, '+', '') = ?
          LIMIT 1
          FOR UPDATE`,
        [phoneDigits]
      );
      const membership = membershipRows[0];
      if (membership) {
        await connection.execute(`UPDATE team_members SET status = 'active' WHERE id = ?`, [Number(membership.id)]);
        userStatus = "active";
        isActive = 1;
        const [hostRows] = await connection.execute<RowDataPacket[]>(
          `SELECT id, name, phone FROM users WHERE id = ? LIMIT 1 FOR UPDATE`,
          [Number(membership.user_id)]
        );
        const host = hostRows[0];
        if (host) {
          managerId = Number(host.id);
          hostName = String(host.name ?? "") || null;
          hostPhone = String(host.phone ?? "") || null;
        }
      }
    }

    await connection.execute<ResultSetHeader>(
      `INSERT INTO users
        (name, email, password_hash, role, status, preferred_locale, phone,
         manager_id, host_name, host_phone, is_active, joined_at)
       VALUES (?, ?, ?, 'affiliate', ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE())`,
      [name, email, passwordHash, userStatus, locale, phone || null, managerId, hostName, hostPhone, isActive]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    const code = (error as {code?: string}).code;
    registrationError = code === "ER_DUP_ENTRY" ? "exists" : "failed";
  } finally {
    connection.release();
  }
  if (registrationError) redirect(`/${locale}?registration=${registrationError}`);
  redirect(`/${locale}?registration=pending`);
}
