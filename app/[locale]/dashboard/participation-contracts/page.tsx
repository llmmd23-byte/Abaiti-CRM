import {getTranslations, setRequestLocale} from "next-intl/server";

import {DashboardHeader} from "@/components/DashboardSections";
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
  const t = await getTranslations();

  return (
    <>
      <DashboardHeader
        eyebrow={t("portal.salesTools")}
        title={t("portal.participationContracts")}
      />
      <ParticipationContractsPanel locale={locale} />
    </>
  );
}
