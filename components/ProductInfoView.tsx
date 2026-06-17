"use client";

import {useLocale} from "next-intl";
import {cn, theme} from "@/components/ui";

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
    save: "\u0631\u0628\u0637 \u0645\u0639 \u0639\u0631\u0636 \u0633\u0639\u0631",
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
    <label className="grid min-w-0 gap-2">
      <span className="text-[13px] font-extrabold leading-snug text-slate-700">{label}</span>
      <input
        className="min-h-12 w-full rounded-[14px] border border-[#dbe6ee] bg-white px-3.5 py-3 text-sm font-medium leading-normal text-[#0b1f3a] outline-none transition focus:border-[#22b8b8] focus:shadow-[0_0_0_4px_rgba(0,161,157,0.1)]"
        type={type}
        placeholder={placeholder ?? label}
      />
    </label>
  );
}

export default function ProductInfoView() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const content = isArabic ? copy.ar : copy.en;

  return (
    <section className="grid w-full gap-[18px]" dir={isArabic ? "rtl" : "ltr"}>
      <header className="grid gap-2 px-0.5 pb-1 pt-1">
        <span className="text-[13px] font-extrabold text-[#22b8b8]">{content.title}</span>
        <h1 className="m-0 max-w-[760px] text-[clamp(28px,3.2vw,46px)] font-black leading-[1.18] text-[#0b1f3a]">
          {content.subtitle}
        </h1>
      </header>

      <article className={cn("grid gap-[18px] rounded-[22px] p-6", theme.card)}>
        <h2 className="m-0 text-lg font-black leading-snug text-[#0b1f3a]">{content.serviceTitle}</h2>
        <label className="grid min-w-0 gap-2">
          <span className="text-[13px] font-extrabold leading-snug text-slate-700">{content.serviceLabel}</span>
          <select
            className="min-h-12 w-full rounded-[14px] border border-[#dbe6ee] bg-white px-3.5 py-3 text-sm font-medium leading-normal text-[#0b1f3a] outline-none transition focus:border-[#22b8b8] focus:shadow-[0_0_0_4px_rgba(0,161,157,0.1)]"
            defaultValue=""
          >
            <option value="" disabled>
              {content.servicePlaceholder}
            </option>
            {content.serviceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </article>

      <article className={cn("grid gap-[18px] rounded-[22px] p-6", theme.card)}>
        <h2 className="m-0 text-lg font-black leading-snug text-[#0b1f3a]">{content.businessTitle}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={content.fields.businessName} />
          <Field label={content.fields.registrationNumber} />
          <Field label={content.fields.businessActivity} />
          <Field label={content.fields.businessEmail} type="email" />
          <Field label={content.fields.businessMobile} type="tel" />
          <div className="grid gap-2 md:col-span-2">
            <span className="text-[13px] font-extrabold leading-snug text-slate-700">{content.fields.address}</span>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {[content.fields.city, content.fields.district, content.fields.street].map((placeholder) => (
                <input
                  className="min-h-12 w-full rounded-[14px] border border-[#dbe6ee] bg-white px-3.5 py-3 text-sm font-medium leading-normal text-[#0b1f3a] outline-none transition focus:border-[#22b8b8] focus:shadow-[0_0_0_4px_rgba(0,161,157,0.1)]"
                  key={placeholder}
                  type="text"
                  placeholder={placeholder}
                />
              ))}
            </div>
          </div>
        </div>
      </article>

      <article className={cn("grid gap-[18px] rounded-[22px] p-6", theme.card)}>
        <h2 className="m-0 text-lg font-black leading-snug text-[#0b1f3a]">{content.requirementsTitle}</h2>
        <label className="grid min-w-0 gap-2">
          <span className="text-[13px] font-extrabold leading-snug text-slate-700">{content.requirementsTitle}</span>
          <textarea
            className="min-h-[118px] w-full resize-y rounded-[14px] border border-[#dbe6ee] bg-white px-3.5 py-3 text-sm font-medium leading-normal text-[#0b1f3a] outline-none transition focus:border-[#22b8b8] focus:shadow-[0_0_0_4px_rgba(0,161,157,0.1)]"
            placeholder={content.requirementsPlaceholder}
          />
        </label>
      </article>

      <article className={cn("grid gap-[18px] rounded-[22px] p-6", theme.card)}>
        <h2 className="m-0 text-lg font-black leading-snug text-[#0b1f3a]">{content.contactTitle}</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label={content.fields.managerName} />
          <Field label={content.fields.mobile} type="tel" />
          <Field label={content.fields.email} type="email" />
        </div>
      </article>

      <article className={cn("grid gap-[18px] rounded-[22px] p-6", theme.card)}>
        <h2 className="m-0 text-lg font-black leading-snug text-[#0b1f3a]">{content.activationTitle}</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label={content.fields.serialNumber} placeholder={content.fields.serialNumberPlaceholder} />
          <Field label={content.fields.activationCode} />
          <Field label={content.fields.referralCode} />
        </div>
      </article>

      <div className="mt-1 flex flex-wrap items-center gap-4">
        <button
          className="min-w-[170px] rounded-[14px] border-0 bg-[#0b1f3a] px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#071426] hover:shadow-[0_14px_28px_rgba(11,25,44,0.18)]"
          type="button"
        >
          {content.save}
        </button>
        <button
          className="min-w-[170px] rounded-[14px] border-0 bg-emerald-600 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_14px_28px_rgba(5,150,105,0.18)]"
          type="button"
        >
          {isArabic ? "\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0646\u0638\u0627\u0645" : "Activate System"}
        </button>
      </div>
    </section>
  );
}
