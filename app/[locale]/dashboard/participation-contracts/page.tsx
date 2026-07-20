import {setRequestLocale} from "next-intl/server";

import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import {ParticipationContractsPanel} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardParticipationContractsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.participation_contracts", locale);
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeaderBanner section="participationContracts" />
      <ParticipationContractsPanel locale={locale} />
    </>
  );
}
