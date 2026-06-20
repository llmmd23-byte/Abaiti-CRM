"use client";

import type {FormEvent} from "react";
import {useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import DashboardSelect from "@/components/DashboardSelect";

export default function StaticAffiliateLeadForm({
  affiliateId,
  affiliateUsername,
  affiliateName
}: {
  affiliateId: string;
  affiliateUsername: string;
  affiliateName: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
  }

  return (
    <form className="demo-form" onSubmit={handleSubmit}>
      <input name="affiliateUsername" type="hidden" value={affiliateUsername} />
      <input name="affiliateId" type="hidden" value={affiliateId} />
      <input name="locale" type="hidden" value={locale} />
      <label>
        <span>{t("form.name")}</span>
        <input name="fullName" required type="text" placeholder={t("form.namePlaceholder")} />
      </label>
      <label>
        <span>{t("form.email")}</span>
        <input name="email" required type="email" placeholder="name@company.com" />
      </label>
      <label>
        <span>{t("form.phone")}</span>
        <input name="phone" type="tel" placeholder="+966 5X XXX XXXX" />
      </label>
      <label>
        <span>{t("form.size")}</span>
        <DashboardSelect
          ariaLabel={t("form.size")}
          defaultValue={t("form.size1")}
          name="companySize"
          options={[1, 2, 3, 4].map((item) => ({
            label: t("form.size" + item),
            value: t("form.size" + item)
          }))}
        />
      </label>
      <label>
        <span>{t("affiliatePage.message")}</span>
        <textarea name="message" placeholder={t("affiliatePage.messagePlaceholder")} />
      </label>
      <button className="button button-form" type="submit">
        {t("form.submit")}
      </button>
      <p>
        {isSubmitted
          ? t("affiliatePage.formTag", {affiliateName})
          : t("affiliatePage.crmNote", {affiliateId})}
      </p>
    </form>
  );
}
