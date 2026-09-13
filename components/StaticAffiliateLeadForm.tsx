"use client";

import {useActionState, useEffect, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import DashboardSelect from "@/components/DashboardSelect";
import {captureAffiliateLead} from "@/app/actions";

export default function StaticAffiliateLeadForm({
  affiliateId,
  affiliateUsername,
  affiliateName,
  referralCode,
}: {
  affiliateId: string;
  affiliateUsername: string;
  affiliateName: string;
  referralCode?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(captureAffiliateLead, {});
  const [activeReferralCode, setActiveReferralCode] = useState(referralCode || affiliateUsername);

  useEffect(() => {
    const queryReferralCode = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (queryReferralCode) {
      window.localStorage.setItem("middar_ref", queryReferralCode);
      setActiveReferralCode(queryReferralCode);
      return;
    }
    const storedReferralCode = window.localStorage.getItem("middar_ref")?.trim();
    if (storedReferralCode) setActiveReferralCode(storedReferralCode);
  }, [affiliateUsername, referralCode]);

  return (
    <form action={formAction} className="demo-form">
      <input name="affiliateUsername" type="hidden" value={affiliateUsername} />
      <input name="referralCode" type="hidden" value={activeReferralCode} />
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
      <button className="button button-form" disabled={pending} type="submit">
        {pending ? "..." : t("form.submit")}
      </button>
      <p>
        {state.success
          ? t("affiliatePage.formTag", {affiliateName})
          : t("affiliatePage.crmNote", {affiliateId})}
      </p>
    </form>
  );
}
