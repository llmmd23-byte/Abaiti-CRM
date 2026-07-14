import {getTranslations, setRequestLocale} from "next-intl/server";

import {DashboardHeader, RentalContractsPanel} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardRentalContractsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.rental_contracts", locale);
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <DashboardHeader
        eyebrow={t("portal.salesTools")}
        title={t("portal.rentalContracts")}
      />
      <RentalContractsPanel locale={locale} />
    </>
  );
}
