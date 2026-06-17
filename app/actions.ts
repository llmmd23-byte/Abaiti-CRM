"use server";

import {pushAffiliateLeadToCrm} from "@/lib/crm";

export async function captureAffiliateLead(formData: FormData) {
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
}
