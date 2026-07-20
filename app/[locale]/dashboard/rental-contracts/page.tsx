import {setRequestLocale} from "next-intl/server";

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
  const isArabic = locale === "ar";

  return (
    <>
      <DashboardHeader
        badge={isArabic ? "مركز العقود" : "Contracts Hub"}
        eyebrow={isArabic ? "إدارة العقود" : "Contract Management"}
        subtitle={
          isArabic
            ? "سجلات العقود مرتبطة بالحسابات وتتبع حالات التجديد والسداد تلقائياً."
            : "Contract records are linked to accounts and track renewal and payment status automatically."
        }
        title={
          isArabic
            ? "إدارة العقود التأجيرية ومتابعتها في واجهة واحدة"
            : "Manage and track rental contracts in one interface"
        }
        variant="card"
      />
      <RentalContractsPanel locale={locale} />
    </>
  );
}
