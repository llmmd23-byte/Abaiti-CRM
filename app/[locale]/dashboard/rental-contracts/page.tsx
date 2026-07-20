import {setRequestLocale} from "next-intl/server";

import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import {RentalContractsPanel} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardRentalContractsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.rental_contracts", locale);
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeaderBanner section="rentalContracts" />
      <RentalContractsPanel locale={locale} />
    </>
  );
}
