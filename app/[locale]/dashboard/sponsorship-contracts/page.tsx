import {getTranslations, setRequestLocale} from "next-intl/server";

import {DashboardHeader, SponsorshipContractsPanel} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardSponsorshipContractsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.sponsorship_contracts", locale);
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <DashboardHeader
        eyebrow={t("portal.salesTools")}
        title={t("portal.sponsorshipContracts")}
      />
      <SponsorshipContractsPanel locale={locale} />
    </>
  );
}
