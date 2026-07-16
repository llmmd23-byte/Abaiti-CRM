"use client";

import { useLocale } from "next-intl";
import { useState, type FormEvent } from "react";

import DashboardSelect from "@/components/DashboardSelect";
import { createBackend, useBackend } from "@/lib/client-backend";

type IndustryRow = Record<string, unknown> & { id: number };

export default function LeadRequestForm({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const isArabic = useLocale() === "ar";
  const copy = isArabic
    ? {
        title: "\u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u064a\u0644 \u0645\u0647\u062a\u0645",
        company: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
        companyPlaceholder: "\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629 \u0623\u0648 \u0627\u0644\u0645\u0624\u0633\u0633\u0629",
        industry: "\u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637",
        industryPlaceholder: "\u0627\u062e\u062a\u0631 \u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637",
        address: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
        addressPlaceholder: "\u0627\u0644\u0645\u062f\u064a\u0646\u0629\u060c \u0627\u0644\u062d\u064a",
        name: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644",
        namePlaceholder: "\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0643\u0627\u0645\u0644",
        email: "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
        phone: "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644",
        requirements: "\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u064a\u0629",
        requirementsPlaceholder: "\u0627\u0630\u0643\u0631 \u0623\u064a \u0645\u062a\u0637\u0644\u0628\u0627\u062a \u062e\u0627\u0635\u0629 \u0623\u0648 \u062a\u0641\u0627\u0635\u064a\u0644 \u0625\u0636\u0627\u0641\u064a\u0629...",
        submit: "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u0647\u062a\u0645",
        required: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629 \u0648\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0648\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644 \u062d\u0642\u0648\u0644 \u0625\u062c\u0628\u0627\u0631\u064a\u0629",
        creating: "\u062c\u0627\u0631\u064a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644...",
        created: "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u0647\u062a\u0645 \u0628\u0646\u062c\u0627\u062d",
        failed: "\u062a\u0639\u0630\u0631 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u0647\u062a\u0645",
      }
    : {
        title: "Add Interested Customer",
        company: "Company Name",
        companyPlaceholder: "Enter the company or organization name",
        industry: "Industry",
        industryPlaceholder: "Select an industry",
        address: "Address",
        addressPlaceholder: "City, district",
        name: "Full Name",
        namePlaceholder: "Enter the customer's full name",
        email: "Email Address",
        phone: "Mobile Number",
        requirements: "Additional Requirements",
        requirementsPlaceholder: "Mention any special requirements or additional details...",
        submit: "Add Interested Customer",
        required: "Company name, email address, and mobile number are required",
        creating: "Adding customer...",
        created: "Interested customer added successfully",
        failed: "Unable to add the interested customer",
      };
  const [leadRequest, setLeadRequest] = useState({
    companyName: "",
    industryId: "",
    address: "",
    fullName: "",
    email: "",
    phone: "",
    requirements: "",
  });
  const [status, setStatus] = useState("");
  const { data: industries } = useBackend<IndustryRow[]>(
    "/api/v1/data/industries",
  );

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !leadRequest.companyName.trim() ||
      !leadRequest.email.trim() ||
      !leadRequest.phone.trim()
    ) {
      setStatus(copy.required);
      return;
    }
    setStatus(copy.creating);
    try {
      await createBackend("leads", {
        name: leadRequest.fullName.trim(),
        company_name: leadRequest.companyName.trim(),
        email: leadRequest.email.trim() || null,
        phone: leadRequest.phone.trim(),
        source: "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645",
        industry_id: Number(leadRequest.industryId),
        address: leadRequest.address.trim() || null,
        requirements: leadRequest.requirements.trim() || null,
        stage: "new",
      });
      setLeadRequest({
        companyName: "",
        industryId: "",
        address: "",
        fullName: "",
        email: "",
        phone: "",
        requirements: "",
      });
      setStatus(copy.created);
      onCreated?.();
    } catch {
      setStatus(copy.failed);
    }
  }

  return (
    <section
      className="dashboard-lead-request leads-hub-lead-request"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="dashboard-lead-request-inner">
        <div className="dashboard-lead-request-card">
          <h2>{copy.title}</h2>
          <form
            className="dashboard-lead-request-form"
            onSubmit={(event) => void submitLead(event)}
          >
            <div className="dashboard-lead-request-grid">
              <div className="dashboard-lead-request-stack">
                <div>
                  <label>{copy.company}</label>
                  <input
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                    placeholder={copy.companyPlaceholder}
                    required
                    type="text"
                    value={leadRequest.companyName}
                  />
                </div>
                <div>
                  <label>{copy.industry}</label>
                  <DashboardSelect
                    ariaLabel={copy.industry}
                    onValueChange={(value) =>
                      setLeadRequest((current) => ({
                        ...current,
                        industryId: value,
                      }))
                    }
                    options={(industries ?? [])
                      .filter(
                        (industry) =>
                          String(industry.status ?? "active") === "active",
                      )
                      .map((industry) => ({
                        label: String(
                          (isArabic
                            ? industry.name
                            : industry.name_en ?? industry.name) ?? "—",
                        ),
                        value: String(industry.id),
                      }))}
                    placeholder={copy.industryPlaceholder}
                    value={leadRequest.industryId}
                  />
                </div>
                <div>
                  <label>{copy.address}</label>
                  <input
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder={copy.addressPlaceholder}
                    type="text"
                    value={leadRequest.address}
                  />
                </div>
              </div>
              <div className="dashboard-lead-request-stack">
                <div>
                  <label>{copy.name}</label>
                  <input
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder={copy.namePlaceholder}
                    required
                    type="text"
                    value={leadRequest.fullName}
                  />
                </div>
                <div>
                  <label>{copy.email}</label>
                  <input
                    dir="ltr"
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={leadRequest.email}
                  />
                </div>
                <div>
                  <label>{copy.phone}</label>
                  <input
                    dir="ltr"
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+966 5X XXX XXXX"
                    required
                    type="tel"
                    value={leadRequest.phone}
                  />
                </div>
              </div>
            </div>
            <div>
              <label>{copy.requirements}</label>
              <textarea
                onChange={(event) =>
                  setLeadRequest((current) => ({
                    ...current,
                    requirements: event.target.value,
                  }))
                }
                placeholder={copy.requirementsPlaceholder}
                rows={3}
                value={leadRequest.requirements}
              />
            </div>
            <button type="submit">{copy.submit}</button>
            {status ? (
              <p className="dashboard-lead-request-status" role="status">
                {status}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
