import {setRequestLocale} from "next-intl/server";

import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import {SponsorshipContractsPanel} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardSponsorshipContractsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.sponsorship_contracts", locale);
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeaderBanner section="sponsorshipContracts" />
      <SponsorshipContractsPanel locale={locale} />
    </>
  );
}
