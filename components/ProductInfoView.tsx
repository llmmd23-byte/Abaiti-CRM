"use client";

import {useLocale} from "next-intl";
import DashboardSelect from "@/components/DashboardSelect";

const copy = {
  ar: {
    title: "\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a",
    subtitle: "\u0625\u0639\u062f\u0627\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0646\u062a\u062c \u0623\u0648 \u0627\u0644\u062e\u062f\u0645\u0629 \u0627\u0644\u0645\u0631\u0627\u062f \u062a\u0631\u0648\u064a\u062c\u0647\u0627 \u0636\u0645\u0646 \u0645\u0646\u0638\u0648\u0645\u0629 \u0645\u064a\u062f\u0627\u0631.",
    serviceTitle: "POS Box \u0646\u0638\u0627\u0645 \u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064a\u0639",
    serviceLabel: "\u0627\u062e\u062a\u0627\u0631 \u0646\u0648\u0639 \u0646\u0638\u0627\u0645 \u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064a\u0639",
    servicePlaceholder: "\u0627\u062e\u062a\u0631 \u0646\u0648\u0639 \u0627\u0644\u0646\u0638\u0627\u0645...",
    serviceOptions: [
      "\u0646\u0638\u0627\u0645 \u0627\u0644\u062a\u062c\u0632\u0626\u0629",
      "\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0648\u0627\u0644\u0645\u0642\u0627\u0647\u064a",
      "\u0646\u0638\u0627\u0645 \u0627\u0644\u062e\u062f\u0645\u0627\u062a"
    ],
    businessTitle: "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
    requirementsTitle: "\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0646\u0634\u0623\u0629 \u0627\u0644\u0625\u0636\u0627\u0641\u064a\u0629 \u0623\u0648 \u0627\u0644\u0636\u0631\u0648\u0631\u064a\u0629",
    requirementsPlaceholder: "\u0627\u0643\u062a\u0628 \u0623\u064a \u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629 \u0623\u0648 \u0634\u0631\u0648\u0637 \u0636\u0631\u0648\u0631\u064a\u0629 \u0647\u0646\u0627...",
    contactTitle: "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644",
    activationTitle: "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0641\u0639\u064a\u0644",
    save: "\u0631\u0628\u0637 \u0645\u0639 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a",
    fields: {
      businessName: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
      registrationNumber: "\u0631\u0642\u0645 \u0627\u0644\u0633\u062c\u0644",
      businessActivity: "\u0646\u0634\u0627\u0637 \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
      businessEmail: "\u0627\u064a\u0645\u064a\u0644 \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
      businessMobile: "\u0631\u0642\u0645 \u0645\u0648\u0628\u0627\u064a\u0644 \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
      address: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
      city: "\u0627\u0644\u0645\u062f\u064a\u0646\u0629",
      district: "\u0627\u0644\u062d\u064a",
      street: "\u0627\u0644\u0634\u0627\u0631\u0639",
      managerName: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u0624\u0648\u0644",
      mobile: "\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064a\u0644",
      email: "\u0627\u0644\u0627\u064a\u0645\u064a\u0644",
      serialNumber: "\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u062a\u0633\u0644\u0633\u0644\u064a",
      serialNumberPlaceholder: "\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u062a\u0633\u0644\u0633\u0644\u064a \u0644\u0644\u0645\u0646\u062a\u062c",
      activationCode: "\u0643\u0648\u062f \u0627\u0644\u062a\u0641\u0639\u064a\u0644",
      referralCode: "\u0631\u0645\u0632 \u0625\u062d\u0627\u0644\u0629 \u0627\u0644\u0645\u0633\u0648\u0642"
    }
  },
  en: {
    title: "Products",
    subtitle: "Configure the product or service that will be promoted through the Middar system.",
    serviceTitle: "POS Box point-of-sale system",
    serviceLabel: "Retail, restaurants, and services activities",
    servicePlaceholder: "Select system type...",
    serviceOptions: ["Retail system", "Restaurants and cafes system", "Services system"],
    businessTitle: "Business Information",
    requirementsTitle: "Additional or Required Business Requirements",
    requirementsPlaceholder: "Write any additional requirements or necessary conditions here...",
    contactTitle: "Contact Information",
    activationTitle: "Activation Information",
    save: "Save Changes",
    fields: {
      businessName: "Business name",
      registrationNumber: "Registration number",
      businessActivity: "Business activity",
      businessEmail: "Business email",
      businessMobile: "Business mobile",
      address: "Business address",
      city: "City",
      district: "District",
      street: "Street",
      managerName: "Manager name",
      mobile: "Mobile number",
      email: "Email",
      serialNumber: "Serial number",
      serialNumberPlaceholder: "Product serial number",
      activationCode: "Activation code",
      referralCode: "Affiliate referral code"
    }
  }
};

function Field({
  label,
  type = "text",
  placeholder
}: {
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="product-info-field">
      <span>{label}</span>
      <input type={type} placeholder={placeholder ?? label} />
    </label>
  );
}

function PremiumSystemSelect({
  label,
  options,
  placeholder
}: {
  label: string;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="product-info-field premium-system-field">
      <span>{label}</span>
      <DashboardSelect
        ariaLabel={label}
        name="systemType"
        options={options.map((option) => ({label: option, value: option}))}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function ProductInfoView() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const content = isArabic ? copy.ar : copy.en;

  return (
    <section className="product-info-view" dir={isArabic ? "rtl" : "ltr"}>
      <article className="product-info-card">
        <h2>{content.serviceTitle}</h2>
        <PremiumSystemSelect
          label={content.serviceLabel}
          options={content.serviceOptions}
          placeholder={content.servicePlaceholder}
        />
      </article>

      <article className="product-info-card">
        <h2>{content.businessTitle}</h2>
        <div className="product-info-grid">
          <Field label={content.fields.businessName} />
          <Field label={content.fields.registrationNumber} />
          <Field label={content.fields.businessActivity} />
          <Field label={content.fields.businessEmail} type="email" />
          <Field label={content.fields.businessMobile} type="tel" />
          <div className="product-info-address">
            <span>{content.fields.address}</span>
            <div className="product-info-address-grid">
              <input type="text" placeholder={content.fields.city} />
              <input type="text" placeholder={content.fields.district} />
              <input type="text" placeholder={content.fields.street} />
            </div>
          </div>
        </div>
      </article>

      <article className="product-info-card">
        <h2>{content.requirementsTitle}</h2>
        <label className="product-info-field">
          <span>{content.requirementsTitle}</span>
          <textarea placeholder={content.requirementsPlaceholder} />
        </label>
      </article>

      <article className="product-info-card">
        <h2>{content.contactTitle}</h2>
        <div className="product-info-grid product-info-three-grid">
          <Field label={content.fields.managerName} />
          <Field label={content.fields.mobile} type="tel" />
          <Field label={content.fields.email} type="email" />
        </div>
      </article>

      <article className="product-info-card">
        <h2>{content.activationTitle}</h2>
        <div className="product-info-grid product-info-three-grid">
          <Field label={content.fields.serialNumber} placeholder={content.fields.serialNumberPlaceholder} />
          <Field label={content.fields.activationCode} />
          <Field label={content.fields.referralCode} />
        </div>
      </article>

      <div className="product-info-actions">
        <button type="button">{content.save}</button>
        <button className="product-info-activate-button" type="button">
          {isArabic ? "\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0646\u0638\u0627\u0645" : "Activate System"}
        </button>
      </div>
    </section>
  );
}
