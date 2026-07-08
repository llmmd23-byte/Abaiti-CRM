import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import {QuoteSystem} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardQuotesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.quotes", locale);
  return (
    <>
      <DashboardHeaderBanner section="quotes" />
      <QuoteSystem />
    </>
  );
}
