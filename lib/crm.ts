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
  // Replace this mock with your CRM API call.
  // Example: await fetch(process.env.CRM_WEBHOOK_URL!, {method: "POST", body: JSON.stringify(lead)});
  console.info("CRM_LEAD_CAPTURED", lead);
  return {
    crmLeadId: `lead_${lead.affiliateId}_${Date.now()}`,
    routedTo: "central-crm",
    assignedQueue: "sales-demo-requests"
  };
}
