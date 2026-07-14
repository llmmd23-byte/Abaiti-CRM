import {getTranslations, setRequestLocale} from "next-intl/server";

import {DashboardHeader, SalesOrdersPanel} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardSalesOrdersPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.sales_orders", locale);
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <DashboardHeader
        eyebrow={t("portal.salesTools")}
        title={t("portal.salesOrders")}
      />
      <SalesOrdersPanel locale={locale} />
    </>
  );
}
